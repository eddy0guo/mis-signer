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
                await Utils.sleep(500);
            }else{
                return true;
            }
        }
        return false;
    }
    async updateDataBase(tx_trades,trades,txid,current_time){
        const [updateLocalBookErr, updateLocalBookRes] = await to(this.updateLocalBook(tx_trades,current_time));
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

    async generateProcessOrders(tx_trades,now:number) {
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
                +NP.times(+oneTrade.price, 100000000),
                now,
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



    async  test_repayment(account,basetokenamount,time2){
        if(account.latesttime === 0){
            account.balance = account.balance + basetokenamount
        }else {
            // tslint:disable-next-line:radix
            const  diff =  parseInt(String((time2 - account.latesttime) / 3600)) + 1
            const  base = Math.pow(10,16)
            const  debt = Math.pow(1.000017,diff) * base

            // tslint:disable-next-line:radix
            const  totoal = parseInt(String(account.accumulatedDebt * debt / base))
            // tslint:disable-next-line:radix
            const  rep  =  parseInt(String(basetokenamount * base / debt))

           if (totoal >= account.borrow){
                const  interest = totoal - account.borrow
                if(basetokenamount >= interest){
                    if(basetokenamount >= totoal){
                        account.accumulatedDebt = 0
                        account.borrow = 0;
                        account.latesttime = 0;
                        account.balance = account.balance + basetokenamount - totoal
                    }else{
                        account.accumulatedDebt = account.accumulatedDebt - rep
                        account.borrow = account.borrow - (basetokenamount - interest)
                        account.repay = account.repay + basetokenamount
                    }
                }else{
                    account.accumulatedDebt = account.accumulatedDebt - rep
                    account.repay = account.repay + basetokenamount
                }
            }else{
                if (basetokenamount >= account.borrow){
                    account.accumulatedDebt = 0
                    account.borrow = 0;
                    account.latesttime = 0;
                    account.balance = account.balance + (basetokenamount - account.borrow)
                }else{
                    account.accumulatedDebt = account.accumulatedDebt - rep
                    account.borrow = account.borrow - basetokenamount
                    account.repay = account.repay + basetokenamount
                }
            }

        }
        return account
    }

    async  test_debt(account,amount,time2){
        // tslint:disable-next-line:radix
        const diff =  parseInt(String((time2 - account.latesttime) / 3600)) + 1;
        const base = Math.pow(10,16);
        const  debt = Math.pow(1.000017,diff) * base;
        // tslint:disable-next-line:radix
        const total = parseInt(String(amount * base / debt));
        if(account.balance>=amount){
            account.balance = account.balance - amount
        }else{
            if (account.latesttime === 0){
                account.borrow = amount - account.balance
                account.latesttime = time2
                account.accumulatedDebt = amount - account.balance
            }else{
                account.borrow = account.borrow+ amount
                account.accumulatedDebt = account.accumulatedDebt + total
            }
        }
        return account
    }
    // 按照合约逻辑进行本地账本更新
    async updateBalanceBorrow(symbol:string,address:string,addAmount:string,now:number): Promise<void>{
        await Token.lockLocalBook(this.redisClient,address);
        let  book:ILocalBook = await Token.getLocalBook(symbol,this.redisClient,address);
        let book2 = {
            account: address,
            balance : +NP.times(book.balance,Math.pow(10,8)),
            borrow: +NP.times(book.borrowAmount,Math.pow(10,8)),
            latesttime: book.latestBorrowTime,
            accumulatedDebt: +NP.times(book.accumulatedDebt,Math.pow(10,8)),
            repay: +NP.times(book.repayAmount,Math.pow(10,8)),
        };
        console.log('bbb',symbol,address,addAmount,now,book);
        // tslint:disable-next-line:radix
        const addAmount2 = Math.abs(parseInt(NP.times(addAmount,Math.pow(10,8))));
        const  tmpBorrow = book2.borrow;
        if(+addAmount < 0){
            book2 = await this.test_debt(book2,addAmount2,now);
            console.log(`test_1debt_${symbol},--${address}----${book2.borrow}=${tmpBorrow} - ${addAmount2} ,at ${now}`);
        }else{
            book2 = await this.test_repayment(book2,addAmount2,now);
            console.log(`test_1repay_${symbol},--${address}----${book2.borrow}=${tmpBorrow} - ${addAmount2} ,at ${now}`);
            // console.log(`test_1repayment-${symbol}-${address}-,`,book2.borrow,addAmount2,now);

        }
        book = {
            balance : NP.divide(book2.balance,Math.pow(10,8)),
            borrowAmount: NP.divide(book2.borrow.toString(),Math.pow(10,8)),
            repayAmount: NP.divide(book2.repay.toString(),Math.pow(10,8)),
            accumulatedDebt: NP.divide(book2.accumulatedDebt.toString(),Math.pow(10,8)),
            freezeAmount: book.freezeAmount,
            latestBorrowTime:book2.latesttime,
        }
        console.log('fff--%o',book);
        await Token.setLocalBook(symbol,this.redisClient,address,book);
        await Token.unlockLocalBook(this.redisClient,address);
    }



    // 按照合约逻辑进行本地账本更新
    async updateBalanceBorrow2(symbol:string,address:string,addAmount:string,now:number): Promise<void>{
        await Token.lockLocalBook(this.redisClient,address);
        console.log('aaa')
        const book:ILocalBook = await Token.getLocalBook(symbol,this.redisClient,address);
        console.log('bbb',symbol,address,addAmount,now,book);
        const sixteenPower = Math.pow(10,16);
        const eightPower = Math.pow(10,8);
        console.log('bbb2',symbol,address,addAmount,now,book);
        if(+book.balance > 0){
            const balance = NP.plus(book.balance,addAmount);
            if(+balance >= 0){
                book.balance = balance;
            }else{
                book.balance = '0';
                // get abs()
                book.borrowAmount = balance.substr(1);
                book.latestBorrowTime = now;
                book.accumulatedDebt = balance.substr(1);
            }
        }else if (+book.balance === 0){
            // 复利计算，日利息万五，小时0.000017
            const duration = Math.floor((now - book.latestBorrowTime) / 3600) + 1;
            const sixteenPowerRate = NP.times(Math.pow(1.000017,duration),sixteenPower);
            // 当前累计的债务+利息,向下取整
            let DebtAtNow =NP.times(book.accumulatedDebt,Math.pow(1.000017,duration));
            DebtAtNow = Math.floor(+NP.divide(NP.times(DebtAtNow,eightPower),eightPower)).toString();
            const TFAddAmount = NP.times(addAmount,eightPower,sixteenPower);
            let equalOriginAddAmount = Math.floor(+NP.divide(TFAddAmount,sixteenPowerRate)).toString();
            if(+TFAddAmount < 0){
                 equalOriginAddAmount = '-' +  Math.floor(+NP.divide(TFAddAmount.substr(1),sixteenPowerRate));
             }
            // 债务还完，balance有剩余
            if(DebtAtNow >= book.borrowAmount){
                const currentFee = NP.minus(DebtAtNow,book.borrowAmount);
                const liquidateResult = NP.minus(NP.times(book.accumulatedDebt,eightPower),equalOriginAddAmount);
                if(+liquidateResult <= 0){
                    book.accumulatedDebt = '0';
                    book.latestBorrowTime = 0;
                    book.borrowAmount = '0';
                    book.balance = NP.divide(liquidateResult.substr(1),eightPower);
                    console.log('4.a1--',liquidateResult,eightPower,book);
                    // book.balance = liquidateResult.substr(1);
                }else{
                    book.accumulatedDebt = NP.divide(liquidateResult,eightPower);
                        if(+addAmount >= +currentFee){
                            const tmp = book.borrowAmount;
                            book.borrowAmount = NP.minus(book.borrowAmount,NP.minus(addAmount,currentFee));
                            console.log(`borrow11::${book.borrowAmount} =${tmp} - ${addAmount} + ${currentFee} -----`);
                            book.repayAmount = NP.plus(book.repayAmount,addAmount);
                        }else if(+addAmount < 0){
                            const tmp = book.borrowAmount;
                            book.borrowAmount = NP.minus(book.borrowAmount,addAmount);
                            console.log(`borrow12::${book.borrowAmount} =${tmp} - ${addAmount} -----`);
                        }else if(+addAmount >0 && +currentFee > +addAmount){
                            book.repayAmount = NP.plus(book.repayAmount,addAmount);
                        }
                }
            }else{
                const liquidateResult = NP.minus(NP.times(book.borrowAmount,eightPower),addAmount);
                if(+liquidateResult <= 0){
                    book.accumulatedDebt = '0';
                    book.latestBorrowTime = 0;
                    book.borrowAmount = '0';
                    book.balance = NP.divide(liquidateResult.substr(1),eightPower);
                    console.log('4.a1--',liquidateResult,eightPower,book);
                }else{
                    book.accumulatedDebt = NP.divide(NP.minus(NP.times(book.accumulatedDebt,eightPower),equalOriginAddAmount),eightPower);
                        if(+addAmount >= 0){
                            const tmp = book.borrowAmount;
                            book.borrowAmount = NP.minus(book.borrowAmount,addAmount);
                            console.log(`borrow13::${book.borrowAmount} =${tmp} - ${addAmount} -----`);
                            book.repayAmount = NP.plus(book.repayAmount,addAmount);
                        }else{
                            const tmp = book.borrowAmount;
                            book.borrowAmount = NP.minus(book.borrowAmount,addAmount);
                            console.log(`borrow14::${book.borrowAmount} =${tmp} - ${addAmount} -----`);
                        }
                }

            }

            // console.log('compute---symbol=%o,  originAccumulatedDebt=%o,  duration=%o,   addamount=%o,  equalOriginaddAmount=%o,  liquidateResult+%o',
             //   symbol,tmp,duration,addAmount,equalOriginAddAmount,liquidateResult);
        }else{
            console.log('bbb3',symbol,address,addAmount,now);
            const message = `account balance error ${symbol} ${address} ${book.balance}`;
            console.error(message);
            throw new Error(message);
        }
        console.log('fff--%o',book);
        await Token.setLocalBook(symbol,this.redisClient,address,book);
        await Token.unlockLocalBook(this.redisClient,address);
    }
    async updateLocalBook(tx_trades: ITrade[],currentTime:string): Promise<void> {
        const nowStr = currentTime.replace(/-/g,'/');
        const now =  Math.floor((new Date(nowStr)).getTime() / 1000);
        console.log('update local book on redis');
        for (const trade of tx_trades) {
            const {taker_side, price, amount, taker, maker} = trade;
            const [baseToken, quoteToken] = trade.market_id.split('-');
            if (taker_side === 'buy') {
                //  更新顺序先扣钱，再收钱
                const makerBaseAddAmount = '-' + amount.toString();
                await this.updateBalanceBorrow2(baseToken,maker,makerBaseAddAmount,now);
                /**
                // amount有效位于0.0001，这里不用判断手续费精度超8位de情况
                const takerBaseAddAmount = NP.times(amount, 0.999);
                await this.updateBalanceBorrow(baseToken,taker,takerBaseAddAmount,now);
                **/
                const takerBaseAddAmount = NP.times(amount, 1);
                await this.updateBalanceBorrow2(baseToken,taker,takerBaseAddAmount,now);
                const takerBaseAddAmount2 = NP.times(amount, -0.001);
                await this.updateBalanceBorrow2(baseToken,taker,takerBaseAddAmount2,now);




                const takerQuoteAddAmount = '-' + NP.times(amount, price);
                await this.updateBalanceBorrow2(quoteToken,taker,takerQuoteAddAmount,now);

                /**
                 // 合约里手续费扣除之后有小数,则手续费取整，用户余额少扣1
                 let fee = NP.times(amount, price, 0.001);
                 fee = NP.divide(Math.floor(+NP.times(fee,100000000)),100000000);
                 const makerQuoteAddAmount = NP.minus(NP.times(amount, price),fee);
                 await this.updateBalanceBorrow(quoteToken,maker,makerQuoteAddAmount,now);
                **/
                //  start
                const makerQuoteAddAmount2 = NP.times(amount, price);
                await this.updateBalanceBorrow2(quoteToken,maker,makerQuoteAddAmount2,now);

                let fee = NP.times(amount, price, 0.001);
                fee = NP.divide(-Math.floor(+NP.times(fee,100000000)),100000000);
                console.log('feeeee-',fee);
                await this.updateBalanceBorrow2(quoteToken,maker,fee,now);



            } else if (taker_side === 'sell') {
                const takerBaseAddAmount = '-' + amount.toString();
                await this.updateBalanceBorrow2(baseToken,taker,takerBaseAddAmount,now);
                console.log('compute1');

                /**
                const makerBaseAddAmount = NP.times(amount,0.999);
                await this.updateBalanceBorrow(baseToken,maker,makerBaseAddAmount,now);
                 **/
                const makerBaseAddAmount = NP.times(amount,1);
                await this.updateBalanceBorrow2(baseToken,maker,makerBaseAddAmount,now);
                const makerBaseAddAmount2 = NP.times(amount,-0.001);
                await this.updateBalanceBorrow2(baseToken,maker,makerBaseAddAmount2,now);
                console.log('compute4');

                const makerQuoteAddAmount = '-' + NP.times(amount, price);
                await this.updateBalanceBorrow2(quoteToken,maker,makerQuoteAddAmount,now);
                console.log('compute3,',quoteToken,maker,makerQuoteAddAmount,now);

                /**
                let fee = NP.times(amount, price, 0.001);
                fee = NP.divide(Math.floor(+NP.times(fee,100000000)),100000000);
                const takerQuoteAddAmount =  NP.minus(NP.times(amount, price),fee);
                await this.updateBalanceBorrow(quoteToken,taker,takerQuoteAddAmount,now);
                 **/
                const takerQuoteAddAmount = NP.times(amount, price);
                await this.updateBalanceBorrow2(quoteToken,taker,takerQuoteAddAmount,now);

                let fee = NP.times(amount, price, 0.001);
                fee = NP.divide(-Math.floor(+NP.times(fee,100000000)),100000000);
                await this.updateBalanceBorrow2(quoteToken,taker,fee,now);

                console.log('compute2',);
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
        const nowStr = current_time.replace(/-/g,'/');
        const now =  Math.floor((new Date(nowStr)).getTime() / 1000);

        const processOrders = await this.generateProcessOrders(tx_trades,now);
        console.log('matchorder---',processOrders);
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
        return await Utils.sleep(500);
    }

    async mainLoop(): Promise<void> {
        const trades = await this.db.get_laucher_trades();
        if (trades.length <= 0) {
            this.logger.log('No matched trades-- ',trades);
            return await Utils.sleep(1000);
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
        await Utils.sleep(500);
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
                await Utils.sleep(500);
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
