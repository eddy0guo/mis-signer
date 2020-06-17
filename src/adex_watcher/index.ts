import to from 'await-to-js'
import NP from '../common/NP'

import DBClient from '../adex/models/db'
import Utils from '../adex/api/utils'
import { Logger } from '../common/Logger';
import LogUnhandled from '../common/LogUnhandled';
import {promisify} from 'util';
import {BullOption} from '../cfg';
import * as redis from 'redis';
import {ITrade} from '../adex/interface';
import Token from '../wallet/contract/Token';
import {ILocalBook} from '../interface';
const FREEZE_PREFIX = 'freeze::';
let baseAmountTmp = '0';
let quoteAmountTmp = '0';

class Watcher {

    private db: DBClient;
    private utils: Utils;
    private getReceiptTimes: number;
    // 5分钟无log输出会杀死进程。
    private logger: Logger = new Logger(Watcher.name, 5 * 60 * 1000);
    private redisClient;
    constructor() {
        this.db = new DBClient();
        this.utils = new Utils();
        this.getReceiptTimes = 0;
        if (typeof BullOption.redis !== 'string') {
            this.redisClient = redis.createClient(BullOption.redis.port, BullOption.redis.host);
            this.redisClient.auth(BullOption.redis.password);
        }
    }

    async start() {
        while(true){
            const [loopErr,loopRes] = await to(this.loop());
            if(loopErr){
                console.log(loopErr);
            }else{
                await this.utils.sleep(1000);
            }
        }
    }

    async loop() {
        const transaction = await this.db.get_pending_transactions();
        // 全部都是成功的,就睡眠1s
        if (transaction.length === 0) {
            console.log('[ADEX WATCHER]:no pending transaction');
            return;
        }
        const id = transaction[0].id;
        let status = 'successful';
        let contract_status = 'successful';
        const updateTime = this.utils.get_current_time();
        const watcherTrades = await this.db.get_trades([id]);
        const [getReceiptErr, getReceiptRes] = await to(this.utils.get_receipt_log(transaction[0].transaction_hash));
        // 直接在sql里过滤待确认txid，安全起见对找不到的交易仍多做4次检查,实际运行中发现30秒没确认de交易这里，放到到60次
        const checkTimes = 60;
        if (getReceiptErr && this.getReceiptTimes <= checkTimes) {
            console.error(`[ADEX Watcher Pending]:get_receipt_err ${getReceiptErr},It's been retried ${this.getReceiptTimes} times for ${transaction[0].transaction_hash}`);
            this.getReceiptTimes++;
            await this.utils.sleep(1000);
            throw new Error(getReceiptErr);
        } else if (getReceiptErr && this.getReceiptTimes > checkTimes) {
            status = 'failed';
            console.error(`[ADEX Watcher Pending]:get_receipt_log failed,It's been retried ${this.getReceiptTimes} times for ${transaction[0].transaction_hash},please check  block chain `);
        } else if (getReceiptRes.length !== watcherTrades.length * 4) {
            contract_status = 'failed';
            console.error('getReceiptRes len %s,watcherTrades len,transaction_id',getReceiptRes.length,watcherTrades.length,id);
            for (const trade of watcherTrades){
                const [base_token, quota_token] = trade.market_id.split('-');
                const tokenMaker = new Token(trade.maker);
                const tokenTaker = new Token(trade.taker);
                if(trade.taker_side === 'sell'){
                    const maker_balance = await tokenMaker.localBalanceOf(quota_token,this.redisClient);
                    const taker_balance = await tokenTaker.localBalanceOf(base_token,this.redisClient);
                    console.error('contract status failed side=%o maker_balance=%o,taker_balance=%o',
                        trade.taker_side,maker_balance,taker_balance)
                }else{
                     const maker_balance = await tokenMaker.localBalanceOf(base_token,this.redisClient);
                     const taker_balance = await tokenTaker.localBalanceOf(quota_token,this.redisClient);
                    console.error('contract status failed side=%o maker_balance=%o,taker_balance=%o',
                        trade.taker_side,maker_balance,taker_balance)
                }
            }
            console.log(`[ADEX Watcher Pending] ${transaction[0].transaction_hash} contract execution log is null`);
        } else {
            console.log(`[ADEX Watcher Pending]::now ${updateTime} get_receipt_log %o contract status %o`, transaction[0], contract_status)
        }

        this.getReceiptTimes = 0;
        await this.updateDB(status, contract_status, updateTime, id);
    }

    async updateDB(status, contract_status, updateTime, id): Promise<void> {
        const info = [status, updateTime, id];
        const transaction_info = [status, contract_status, updateTime, id];
        await this.db.begin();

        const [updateTransactionsErr, updateTransactionsResult] = await to(this.db.update_transactions(transaction_info));
        if(!updateTransactionsResult) {
            await this.db.rollback();
            return;
        }
        const [updateTradesErr,updateTradesResult] = await to(this.db.update_trades(info));
        if(!updateTradesResult) {
            await this.db.rollback();
            return;
        }


        const trades = await this.db.transactions_trades([id]);
        for (const trade of trades) {
            let updates = [];
            updates = this.updateElement(updates, trade, updateTime, trade.taker_order_id);
            updates = this.updateElement(updates, trade, updateTime, trade.maker_order_id);
            const [updateConfirmErr,updateConfirmRes] = await to (this.db.update_order_confirm(updates));
            if(!updateConfirmRes) {
                await this.db.rollback();
                return ;
            }
            const [updateFreezeErr,updateFreezeRes] = await to (this.updateFreeze(trade));
            if (updateFreezeErr) {
                console.error('[ADEX_WATCHER]::updateFreezeErr',updateFreezeErr)
                await this.db.rollback();
                return ;
            }
        }
        await this.db.commit();
    }

    updateElement(updates, trade, updateTime, orderId) {
        const tradeAmount: number = +trade.amount;

        let itemIndex;
        const resultArray = updates.find((element, temp_index) => {
            itemIndex = temp_index;
            return element.info[3] === orderId;
        });

        if (!resultArray) {
            const updateElement = {
                info: [
                    +tradeAmount,
                    -tradeAmount,
                    updateTime,
                    orderId,
                ],
            };
            updates.push(updateElement);
        } else {
            const updateElement = updates[itemIndex];
            updateElement.info[0] = NP.plus(
                updateElement.info[0],
                tradeAmount
            );
            updateElement.info[1] = NP.minus(
                updateElement.info[1],
                tradeAmount
            );
            updates[itemIndex] = updateElement;
        }

        return updates;

    }
    /**
    async updateFreeze(trade:ITrade) : Promise<void>{
        const {taker_side,market_id,taker,maker,price,amount} = trade;
        let [baseToken, quoteToken] = market_id.split('-');
        quoteToken = FREEZE_PREFIX + quoteToken;
        baseToken = FREEZE_PREFIX + baseToken;
        const takerKey = Utils.bookKeyFromAddress(taker);
        const makerKey = Utils.bookKeyFromAddress(maker);
        if (taker_side === 'buy'){
            const takerQuoteRes = await this.hgetAsync(takerKey, quoteToken);
            const takerQuote = takerQuoteRes.toString();
            await this.redisClient.HMSET(takerKey, quoteToken, NP.minus(takerQuote, NP.times(amount,price)));

            const makerBaseRes = await this.hgetAsync(makerKey, baseToken);
            const makerBase = makerBaseRes.toString();
            await this.redisClient.HMSET(makerKey, baseToken, NP.minus(makerBase, amount));
        }else if (taker_side === 'sell'){
            // @ts-ignore
            const takerBaseRes = await this.hgetAsync(takerKey, baseToken);
            const takerBase = takerBaseRes.toString();
            await this.redisClient.HMSET(takerKey, baseToken, NP.minus(takerBase,amount));

            const makerQuoteRes = await this.hgetAsync(makerKey, quoteToken);
            const makerQuote = makerQuoteRes.toString();
            await this.redisClient.HMSET(makerKey, quoteToken, NP.minus(makerQuote, NP.times(amount,price)));
        }
        else{
            console.error('[ADEX_watcher]:updateFreeze unknown side',taker_side);
            return;
        }
    }**/
    async updateFreeze(trade:ITrade) : Promise<void>{
        const {taker_side,market_id,taker,maker,price,amount,taker_order_id} = trade;
        const takerOrder = await this.db.find_order([taker_order_id])
        const [baseToken, quoteToken] = market_id.split('-');

        await Token.lockLocalBook(this.redisClient,taker);
        if(taker !== maker){
            await Token.lockLocalBook(this.redisClient,maker);
        }
        const start = Date.now();
        if (taker_side === 'buy'){
            const takerQuoteRes:ILocalBook = await Token.getLocalBook(quoteToken,this.redisClient,taker);
            // 解冻的数量依据的价格是taker 订单的，而不是trade的
            const tmpa = takerQuoteRes.freezeAmount;
            takerQuoteRes.freezeAmount = NP.minus(takerQuoteRes.freezeAmount, NP.times(amount,takerOrder[0].price));
            await Token.setLocalBook(quoteToken,this.redisClient,taker,takerQuoteRes);
            // --
            const tmp1 = quoteAmountTmp;
            quoteAmountTmp =NP.minus(quoteAmountTmp, NP.times(amount,takerOrder[0].price));
            console.log('freeze123_USDT_minux',tmpa,takerQuoteRes.freezeAmount,taker,tmp1,NP.times(takerOrder[0].price,amount),quoteAmountTmp);

            const makerBaseRes:ILocalBook = await Token.getLocalBook(baseToken,this.redisClient,maker);
            const tmpb = makerBaseRes.freezeAmount;
            makerBaseRes.freezeAmount = NP.minus(makerBaseRes.freezeAmount, amount);
            await Token.setLocalBook(baseToken,this.redisClient,maker,makerBaseRes);
            // --
            const tmp2 = baseAmountTmp;
            baseAmountTmp = NP.minus(baseAmountTmp,amount);
            console.log('freeze123_BTC_minus',tmpb,makerBaseRes.freezeAmount,maker,tmp2,amount,baseAmountTmp);

        }else if (taker_side === 'sell'){
            const takerBaseRes:ILocalBook = await Token.getLocalBook(baseToken,this.redisClient,taker);
            const tmpa = takerBaseRes.freezeAmount;
            takerBaseRes.freezeAmount = NP.minus(takerBaseRes.freezeAmount, amount);
            await Token.setLocalBook(baseToken,this.redisClient,taker,takerBaseRes);
            // --
            const tmp2 = baseAmountTmp;
            baseAmountTmp = NP.minus(baseAmountTmp,amount);
            console.log('freeze123_BTC_minus',tmpa,takerBaseRes.freezeAmount,taker,tmp2,amount,baseAmountTmp);


            const makerQuoteRes:ILocalBook = await Token.getLocalBook(quoteToken,this.redisClient,maker);
            const tmpb = makerQuoteRes.freezeAmount;
            makerQuoteRes.freezeAmount = NP.minus(makerQuoteRes.freezeAmount, NP.times(amount,price));
            await Token.setLocalBook(quoteToken,this.redisClient,maker,makerQuoteRes);
            // --
            const tmp1 = quoteAmountTmp;
            quoteAmountTmp =NP.minus(quoteAmountTmp, NP.times(amount,price));
            console.log('freeze123_USDT_minux',tmpb,makerQuoteRes.freezeAmount,taker,tmp1,NP.times(price,amount),quoteAmountTmp);
        }
        else{
            console.error('[ADEX_watcher]:updateFreeze unknown side',taker_side);
            return;
        }
        await Token.unlockLocalBook(this.redisClient,taker);
        if(taker !== maker){
            await Token.unlockLocalBook(this.redisClient,maker);
        }
        console.log('watcher update freeze spend %o ms',Date.now() - start);
    }
}

LogUnhandled(Watcher.name);
const watcher = new Watcher();
watcher.start();
