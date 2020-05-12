import to from 'await-to-js'
import NP from 'number-precision'

import DBClient from '../adex/models/db'
import Utils from '../adex/api/utils'
import { Logger } from '../common/Logger';
import LogUnhandled from '../common/LogUnhandled';
import {promisify} from 'util';
import {BullOption} from '../cfg';
import * as redis from 'redis';
import {ITrade} from '../adex/interface';
import Token from '../wallet/contract/Token';
const FREEZE_PREFIX = 'freeze::';

class Watcher {

    private db: DBClient;
    private utils: Utils;
    private getReceiptTimes: number;
    // 5分钟无log输出会杀死进程。
    private logger: Logger = new Logger(Watcher.name, 5 * 60 * 1000);
    private hgetAsync;
    private redisClient;
    constructor() {
        this.db = new DBClient();
        this.utils = new Utils();
        this.getReceiptTimes = 0;
        if (typeof BullOption.redis !== 'string') {
            this.redisClient = redis.createClient(BullOption.redis.port, BullOption.redis.host);
            this.redisClient.auth(BullOption.redis.password);
        }
        this.hgetAsync = promisify(this.redisClient.hget).bind(this.redisClient);
    }

    async start() {
        this.loop()
    }

    async loop() {

        const [transaction_err, transaction] = await to(this.db.get_pending_transactions())
        if (!transaction) {
            console.error('[ADEX WATCHER] transaction_err Error:', transaction_err);
            setTimeout(() => {
                this.loop.call(this)
            }, 1000);
            return;
        }

        // 全部都是成功的,就睡眠1s
        if (transaction.length === 0) {
            console.log('[ADEX WATCHER]:no pending transaction');
            setTimeout(() => {
                this.loop.call(this)
            }, 1000);
            return;
        }
        const id = transaction[0].id;
        let status = 'successful';

        const updateTime = this.utils.get_current_time();
        const [get_receipt_err, contract_status] = await to(this.utils.get_receipt_log(transaction[0].transaction_hash));
        // 直接在sql里过滤待确认txid，安全起见对找不到的交易仍多做4次检查,实际运行中发现30秒没确认de交易这里，放到到60次
        const checkTimes = 60;
        if (get_receipt_err && this.getReceiptTimes <= checkTimes) {
            console.error(`[ADEX Watcher Pending]:get_receipt_err ${get_receipt_err},It's been retried ${this.getReceiptTimes} times for ${transaction[0].transaction_hash}`);
            setTimeout(() => {
                this.getReceiptTimes++;
                this.loop.call(this)
            }, 1000);
            return;

        } else if (get_receipt_err && this.getReceiptTimes > checkTimes) {
            status = 'failed';
            console.error(`[ADEX Watcher Pending]:get_receipt_log failed,It's been retried ${this.getReceiptTimes} times for ${transaction[0].transaction_hash},please check  block chain `);
        } else if (contract_status === 'failed') {
            const trades = await  this.db.get_trades([id]);
            for (const trade of trades){
                console.log('contract_status_gxy_failed trade  %o',trade);
                const [base_token, quota_token] = trade.market_id.split('-');
                const tokenMaker = new Token(trade.maker);
                const tokenTaker = new Token(trade.taker);
                if(trade.taker_side === 'sell'){
                    const maker_balance = await tokenMaker.localBalanceOf(quota_token,this.redisClient);
                    const taker_balance = await tokenTaker.localBalanceOf(base_token,this.redisClient);
                    console.log('contract_status_gxy_failed side=%o maker_balance=%o,takker_balance=%o',
                        trade.taker_side,maker_balance,taker_balance)
                }else{
                     const maker_balance = await tokenMaker.localBalanceOf(base_token,this.redisClient);
                     const taker_balance = await tokenTaker.localBalanceOf(quota_token,this.redisClient);
                    console.log('contract_status_gxy_failed side=%o maker_balance=%o,takker_balance=%o',
                        trade.taker_side,maker_balance,taker_balance)
                }
            }
            console.log(`[ADEX Watcher Pending] ${transaction[0].transaction_hash} contract execution log is null`);
        } else {
            console.log(`[ADEX Watcher Pending]::now ${updateTime} get_receipt_log %o contract status %o`, transaction[0], contract_status)
        }

        this.getReceiptTimes = 0;
        await this.updateDB(status, contract_status, updateTime, id);

        setImmediate(() => {
            this.loop.call(this)
        })
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
    async updateFreeze(trade:ITrade) : Promise<void>{
        const {taker_side,market_id,taker,maker,price,amount} = trade;
        let [baseToken, quoteToken] = market_id.split('-');
        quoteToken = FREEZE_PREFIX + quoteToken;
        baseToken = FREEZE_PREFIX + baseToken;
        if (taker_side === 'buy'){
            const takerQuoteRes = await this.hgetAsync(taker, quoteToken);
            const takerQuote = +takerQuoteRes.toString();
            await this.redisClient.HMSET(taker, quoteToken, NP.minus(takerQuote, NP.times(amount,price)));

            const makerBaseRes = await this.hgetAsync(maker, baseToken);
            const makerBase = +makerBaseRes.toString();
            await this.redisClient.HMSET(maker, baseToken, NP.minus(makerBase, amount));
        }else if (taker_side === 'sell'){
            // @ts-ignore
            const takerBaseRes = await this.hgetAsync(taker, baseToken);
            const takerBase = +takerBaseRes.toString();
            await this.redisClient.HMSET(taker, baseToken, NP.minus(takerBase,amount));

            const makerQuoteRes = await this.hgetAsync(maker, quoteToken);
            const makerQuote = +makerQuoteRes.toString();
            await this.redisClient.HMSET(maker, quoteToken, NP.minus(makerQuote, NP.times(amount,price)));
        }
        else{
            console.error('[ADEX_watcher]:updateFreeze unknown side',taker_side);
            return;
        }
    }
}

LogUnhandled(Watcher.name);
const watcher = new Watcher();
watcher.start();
