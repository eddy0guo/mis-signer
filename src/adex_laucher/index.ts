import to from 'await-to-js';
import NP from '../common/NP';

import Exchange from './Exchange';

import DBClient from '../adex/models/db';
import Utils from '../adex/api/utils';
import MistConfig, {BullOption} from '../cfg';
import {Logger} from '../common/Logger';
import LogUnhandled from '../common/LogUnhandled';

import {AsimovWallet} from '@fingo/asimov-wallet';
import {ITrade} from '../../src/adex/interface';
import * as redis from 'redis';
import {promisify} from 'util';
import Token from '../wallet/contract/Token';
import {ILocalBook} from '../interface';

class Launcher {
    private db: DBClient;
    private utils: Utils;
    private tmpTransactionId;
    private relayer: AsimovWallet;
    private mist: Exchange;
    private errorCount: number = 0;
    // 5分钟无log输出会杀死进程。
    private logger: Logger = new Logger(Launcher.name, 5 * 60 * 1000);
    private redisClient;

    constructor() {
        this.db = new DBClient();
        this.utils = new Utils();

        this.relayer = new AsimovWallet({
            name: 'Exchange_Relayer',
            rpc: MistConfig.asimov_child_rpc,
            pk: MistConfig.relayers[0].prikey,
        });
        this.mist = new Exchange(MistConfig.ex_address, this.relayer);
    }

    async sleep(ms: number): Promise<void> {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, ms);
        });
    }

    countError(err: Error) {
        this.errorCount++;
        if (this.errorCount > 100) {
            this.logger.log(
                'Too many db errors, kill process, goodbye...',
                this.errorCount,
                err
            );
            // Maybe you shold kill the process
            process.exit(-1);
        } else {
            this.logger.log('Count Error', this.errorCount, err);
        }
    }
    async verifyLocalTXid(txid){
        // 经验值10秒内找不到就判断未上链
        let   tryTimes = 20;
        while(tryTimes--){
            const [err, txinfo] = await to(this.relayer.commonTX.detail(txid));
            if (err || !txinfo) {
                console.log('[UTILS] asimov_getRawTransaction failed', err,txid,tryTimes);
                await this.sleep(500);
            }else{
                return true;
            }
        }
        return false;
    }
    async updateDataBase(tx_trades,trades,txid,current_time){
        const [updateLocalBookErr, updateLocalBookRes] = await to(this.updateLocalBook(tx_trades));
        if (updateLocalBookErr) {
            console.error('[ADEX LAUCNHER]', updateLocalBookErr);
            process.exit(-1);
        }
        const updatedInfo = [
            'pending',
            txid,
            current_time,
            trades[0].transaction_id,
        ];
        await this.db.begin();
        const [updatedInfoErr, updatedInfoResult] = await to(
            this.db.launch_update_trades(updatedInfo)
        );
        if (!updatedInfoResult) {
            this.logger.log(
                `[ADEX LAUCNER]:launch_update_trades failed %o`,
                updatedInfoErr
            );
            await this.db.rollback();
            return;
        }

        const TXinfo = [
            trades[0].transaction_id,
            txid,
            trades[0].market_id,
            'pending',
            'pending',
            current_time,
            current_time,
        ];
        const [insertTransactionsErr, insertTransactionsResult] = await to(
            this.db.insert_transactions(TXinfo)
        );
        if (!insertTransactionsResult) {
            this.logger.log(
                `[ADEX LAUCNER]:launch_update_trades failed %o`,
                insertTransactionsErr
            );
            await this.db.rollback();
            return;
        }
        await this.db.commit();
    }

    async generateProcessOrders(tx_trades) {
        const processOrders = [];
        const [markets_err, markets] = await to(this.db.list_online_markets());
        if (!markets) {
            this.logger.log(
                '[ADEX LAUNCHER]::(list_online_markets):',
                markets_err,
                markets
            );
            return;
        }
        for (const oneTrade of tx_trades) {
            let token_address;
            for (const j in markets) {
                if (oneTrade.market_id === markets[j].id) {
                    token_address = markets[j];
                }
            }
            if (!token_address) {
                this.logger.log('not supported token_address');
                continue;
            }

            const base_amount = +NP.times(+oneTrade.amount, 100000000);
            const quote_amount = +NP.times(+oneTrade.amount, +oneTrade.price, 100000000);

            //    let taker = ["0x66a7bc2e2041d7d15fdfae69bbce9bbbecefc8704c",10,12,time,"ASIM-BTC","sell"]
            const takerOrder = await this.db.find_order([oneTrade.taker_order_id]);
            const makerOrder = await this.db.find_order([oneTrade.maker_order_id]);
            const takerProcessOrder = [
                takerOrder[0].trader_address,
                +NP.times(takerOrder[0].amount, 100000000),
                +NP.times(takerOrder[0].price, 100000000),
                +takerOrder[0].expire_at,
                takerOrder[0].market_id,
                takerOrder[0].side,
            ];

            const makerProcessOrder = [
                makerOrder[0].trader_address,
                +NP.times(makerOrder[0].amount, 100000000),
                +NP.times(makerOrder[0].price, 100000000),
                +makerOrder[0].expire_at,
                makerOrder[0].market_id,
                makerOrder[0].side,
            ];


            const trade_info = [takerProcessOrder,
                makerProcessOrder,
                base_amount,
                quote_amount,
                NP.times(+oneTrade.price, 100000000),
                token_address.base_token_address,
                token_address.quote_token_address,
                oneTrade.taker_side,
                takerOrder[0].signature,
                makerOrder[0].signature
            ];
            processOrders.push(trade_info);
        }
        return processOrders;
    }

    // 按照合约逻辑进行本地账本更新
    /**
    async updateLocalBook(tx_trades: ITrade[]): Promise<void> {
        const hgetAsync = promisify(this.redisClient.hget).bind(this.redisClient);
        console.log('update local book on redis');
        for (const trade of tx_trades) {
            const {taker_side, price, amount, taker, maker} = trade;
            const taker_key = Utils.bookKeyFromAddress(taker);
            const maker_key = Utils.bookKeyFromAddress(maker);
            const [baseToken, quoteToken] = trade.market_id.split('-');
            console.log(`step0-`,taker_side, price, amount, taker, maker);
            if (taker_side === 'buy') {
                // @ts-ignore
                const takerBaseRes = await hgetAsync(taker_key, baseToken);
                const takerBase = takerBaseRes.toString();
                await this.redisClient.HMSET(taker_key, baseToken, NP.plus(takerBase, NP.times(amount, 0.999)));
                console.log(`step1-taker-base-${baseToken}: ${takerBase} + ${NP.times(amount, 0.999)} = ${NP.plus(takerBase, NP.times(amount, 0.999))}`)
                // 0 + 0.0032 * 0。999 = 0.0031968

                const takerQuoteRes = await hgetAsync(taker_key, quoteToken);
                const takerQuote = takerQuoteRes.toString();
                await this.redisClient.HMSET(taker_key, quoteToken, NP.minus(takerQuote, NP.times(amount, price)));
                console.log(`step2-taker-quoteToken-${quoteToken}: ${takerQuote} - ${NP.times(amount, price)} = ${NP.minus(takerQuote, NP.times(amount, price))}`)
                // 0 - 9000 * 0.0032 = -28.8

                const makerBaseRes = await hgetAsync(maker_key, baseToken);
                const makerBase = makerBaseRes.toString();
                await this.redisClient.HMSET(maker_key, baseToken, NP.minus(makerBase, amount));
                console.log(`step3-maker-base-${baseToken}: ${makerBase} - ${amount} = ${ NP.minus(makerBase, amount)}`)
                // 0.0031968 - 0.0032 = -0.0000032

                const makerQuoteRes = await hgetAsync(maker_key, quoteToken);
                const makerQuote = makerQuoteRes.toString();
                let makerQuoteeResult = NP.plus(makerQuote, NP.times(amount, price, 0.999));
                // 合约里手续费扣除之后有小数,则手续费取整，用户余额少扣1
                if (makerQuoteeResult.split('.')[1].length > 8){
                    makerQuoteeResult = NP.plus(makerQuoteeResult.substr(0,makerQuoteeResult.length - 1),0.00000001);
                }
                await this.redisClient.HMSET(maker_key, quoteToken,makerQuoteeResult);
                console.log(`step4-maker-quotetoken-${quoteToken}: ${makerQuote} + ${NP.times(amount, price, 0.999)} = ${NP.plus(makerQuote, NP.times(amount, price, 0.999))}`)
                // -28.8 + 28.8 * 0.999 = -28.8 * 0.0001 = -0.0288

            } else if (taker_side === 'sell') {
                // @ts-ignore
                const takerBaseRes = await hgetAsync(taker_key, baseToken);
                const takerBase = takerBaseRes.toString();
                await this.redisClient.HMSET(taker_key, baseToken, NP.minus(takerBase, amount));

                const takerQuoteRes = await hgetAsync(taker_key, quoteToken);
                const takerQuote = takerQuoteRes.toString();
                let takerQuoteResult =  NP.plus(takerQuote, NP.times(amount, price, 0.999));
                // 合约里手续费扣除之后有小数,则手续费取整，用户余额少扣1
                if (takerQuoteResult.split('.')[1].length > 8){
                    takerQuoteResult = NP.plus(takerQuoteResult.substr(0,takerQuoteResult.length - 1),0.00000001);
                }
                await this.redisClient.HMSET(taker_key, quoteToken,takerQuoteResult);

                const makerQuoteRes = await hgetAsync(maker_key, quoteToken);
                const makerQuote = makerQuoteRes.toString();
                await this.redisClient.HMSET(maker_key, quoteToken, NP.minus(makerQuote, NP.times(amount, price)));

                const makerBaseRes = await hgetAsync(maker_key, baseToken);
                const makerBase = makerBaseRes.toString();
                await this.redisClient.HMSET(maker_key, baseToken,NP.plus(makerBase, NP.times(amount, 0.999)));
            } else {
                console.error('[ADEX_LAUNCHER]:updateLocalBook unknown side', taker_side);
                return;
            }
        }
    }**/
    async updateBalanceBorrow(symbol:string,address:string,addAmount:string): Promise<void>{
        console.log('start updateBalanceBorrow');
        await Token.lockLocalBook(this.redisClient,address);
        const start = Date.now();
        const now = Math.floor(+NP.divide(Date.now(),1000));
        const book:ILocalBook = await Token.getLocalBook(symbol,this.redisClient,address);
        if(+book.balance > 0){
            const balance = NP.plus(book.balance,addAmount);
            if(+balance >= 0){
                book.balance = balance;
            }else{
                book.balance = '0';
                // get abs()
                book.borrowAmount = balance.substr(1);
                book.latestBorrowTime = now;
            }
        }else if (+book.balance === 0){
            // 复利计算，日利息万五，小时0.000017
            const duration = (now - book.latestBorrowTime) / 3600 + 1;
            let interest = NP.times(book.borrowAmount,Math.pow(1.000017,duration));
            interest = NP.divide(Math.floor(+NP.times(interest,100000000)),100000000);
            // addAmount的负号是相对于balance的，borrow就用minus而不是plus
            const borrowAmount = NP.minus(interest,addAmount);
            if(+borrowAmount >= 0){
                book.borrowAmount = borrowAmount;
                book.latestBorrowTime = now;
                // 有还债
                if(+addAmount > 0){
                    book.repayAmount = NP.plus(book.repayAmount,addAmount);
                }
            }else if (+borrowAmount < 0){
                book.borrowAmount = '0';
                book.latestBorrowTime = 0;
                book.repayAmount = '0';
                book.balance = borrowAmount.substr(1);
            }else {
                book.borrowAmount = '0';
                book.repayAmount = '0';
                book.latestBorrowTime = 0;
            }

        }else{
            const message = `account balance error ${symbol} ${address} ${book.balance}`
            console.error(message);
            throw new Error(message);
        }
        await Token.setLocalBook(symbol,this.redisClient,address,book);
        await Token.unlockLocalBook(this.redisClient,address);
        console.log('laucher update freeze spend %o ms',Date.now() - start);
    }
    async updateLocalBook(tx_trades: ITrade[]): Promise<void> {
        console.log('update local book on redis');
        for (const trade of tx_trades) {
            const {taker_side, price, amount, taker, maker} = trade;
            const [baseToken, quoteToken] = trade.market_id.split('-');
            if (taker_side === 'buy') {
                // amount有效位于0.0001，这里不用判断手续费精度超8位de情况
                const takerBaseAddAmount = NP.times(amount, 0.999);
                await this.updateBalanceBorrow(baseToken,taker,takerBaseAddAmount);

                const takerQuoteAddAmount = '-' + NP.times(amount, price);
                await this.updateBalanceBorrow(quoteToken,taker,takerQuoteAddAmount);

                const makerBaseAddAmount = '-' + amount.toString();
                await this.updateBalanceBorrow(baseToken,maker,makerBaseAddAmount);

                // 合约里手续费扣除之后有小数,则手续费取整，用户余额少扣1
                let fee = NP.times(amount, price, 0.001);
                fee = NP.divide(Math.floor(+NP.times(fee,100000000)),100000000);
                const makerQuoteAddAmount = NP.minus(NP.times(amount, price),fee);
                await this.updateBalanceBorrow(quoteToken,maker,makerQuoteAddAmount);

            } else if (taker_side === 'sell') {
                const takerBaseAddAmount = '-' + amount.toString();
                await this.updateBalanceBorrow(baseToken,taker,takerBaseAddAmount);

                let fee = NP.times(amount, price, 0.001);
                fee = NP.divide(Math.floor(+NP.times(fee,100000000)),100000000);
                const takerQuoteAddAmount =  NP.minus(NP.times(amount, price),fee);
                await this.updateBalanceBorrow(quoteToken,taker,takerQuoteAddAmount);

                const makerQuoteAddAmount = '-' + NP.times(amount, price);
                await this.updateBalanceBorrow(quoteToken,maker,makerQuoteAddAmount);

                const makerBaseAddAmount = NP.times(amount,0.999);
                await this.updateBalanceBorrow(baseToken,maker,makerBaseAddAmount);
            } else {
                console.error('[ADEX_LAUNCHER]:updateLocalBook unknown side', taker_side);
                return;
            }
        }
    }

    async doLaunch(trades, current_time): Promise<void> {
        const [tx_trades_err, tx_trades] = await to(
            this.db.transactions_trades([this.tmpTransactionId])
        );
        if (!tx_trades || tx_trades_err) {
            this.logger.log(
                '[ADEX LAUNCHER]::(transactions_trades):',
                tx_trades_err,
                tx_trades
            );
            return;
        }
        const processOrders = await this.generateProcessOrders(tx_trades);
        const [err, txid] = await to(this.mist.matchorder(processOrders));
        if (!err && !txid.remoteErr) {
            await this.updateDataBase(tx_trades,trades,txid.remoteTXid,current_time);
        }else if(!err && txid.remoteErr.message && txid.remoteErr.message.includes('timeout')) {
            this.logger.log('matchorder catch timeout,local txid ', txid.remoteErr.message,txid.localTXid,this.tmpTransactionId);
            const result = await this.verifyLocalTXid(txid.localTXid);
            if (result === true){
                await this.updateDataBase(tx_trades,trades,txid.localTXid,current_time);
            }else{
                const errInfo = ['pending', null, current_time, trades[0].transaction_id];
                const [errUpdateErr, errUpdateRes] = await to(this.db.launch_update_trades(errInfo));
                if (errUpdateErr) {
                    this.logger.log(`[ADEX LAUNCHER] launch_update_trades err=${errUpdateErr}`);
                }
            }
        } else {
            this.logger.log(
                `[ADEX LAUNCHER] call dex matchorder err=${err},txid.remoteErr=${txid}
                transaction_id=${trades[0].transaction_id}
                relayers=${this.relayer.address}`
            );
            const errInfo = ['pending', null, current_time, trades[0].transaction_id];
            const [errUpdateErr, errUpdateRes] = await to(this.db.launch_update_trades(errInfo));
            if (errUpdateErr) {
                this.logger.log(`[ADEX LAUNCHER] launch_update_trades err=${errUpdateErr}`);
            }
        }
        // 500ms的作用：1、为等待pg磁盘写入的时间，2、防止laucher过快，watcher跟不上，因为wathcer的需要链上确认
        return await this.sleep(500);
    }

    async mainLoop(): Promise<void> {
        const trades = await this.db.get_laucher_trades();
        if (trades.length <= 0) {
            this.logger.log('No matched trades-- ',trades);
            return await this.sleep(1000);
        }

        const current_time = this.utils.get_current_time();
        // 只要进入laucher阶段就先把状态设置为pending
        // 防止engine那边在laucher的时候，继续在当前transaction_id里继续插数据
        this.tmpTransactionId = trades[0].transaction_id;

        const update_trade_info = [
            'pending',
            undefined,
            current_time,
            trades[0].transaction_id,
        ];
        await this.db.launch_update_trades(update_trade_info);
        // 准备laucher之前先延时2秒,waiting locked in db?
        // mt 3s 一个块，所以目前问题不大。
        // 但是utxo已经主动拆分，其实可以更快速度进行launch，按目前的拆分可以一个块提交10个以内交易。
        await this.sleep(500);
        return await this.doLaunch(trades, current_time);
    }

    async start() {
        if (typeof BullOption.redis !== 'string') {
            this.redisClient = redis.createClient(BullOption.redis.port, BullOption.redis.host);
            this.redisClient.auth(BullOption.redis.password);
        }
        while (true) {
            const start = new Date();
            this.logger.log(`Main loop started at:${start.toString()}ms`);
            const [err] = await to(this.mainLoop());
            if (err) {
                this.logger.log(`Catched Main Loop Error:${err}`);
                this.sleep(500);
            }
            this.logger.log(
                `Main loop finished in:${new Date().getTime() - start.getTime()}ms`
            );
         }
    }
}


LogUnhandled(Launcher.name);
const launcher = new Launcher();
launcher.start();
