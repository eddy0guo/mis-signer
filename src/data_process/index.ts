import to from 'await-to-js'
import Utils from '../adex/api/utils'
import DBClient from '../adex/models/db'

import mist_config from '../cfg'
import {BullOption} from '../cfg';
import {Health} from '../common/Health';
import NP from '../common/NP';
import Order from '../adex/api/order';
import mist_wallet1 from '../adex/api/mist_wallet';
import Market from '../adex/api/market';
import {Logger} from '../common/Logger';
import Token from '../wallet/contract/Token';
import * as redis from 'redis';
const FREEZE_PREFIX = 'freeze::';
import BigNumber from 'bignumber.js'
import {IERC20Book, ILocalBook} from '../interface';


class ProcessData {

    private db : DBClient;
    private utils : Utils;
    private order : Order;
    private mist_wallet;
    private market : Market;
    private logger: Logger = new Logger(ProcessData.name, 5 * 60 * 1000);
    private redisClient;


    constructor() {
        this.db = new DBClient();
        this.utils = new Utils();
        this.order = new Order(this.db);
        this.mist_wallet = new mist_wallet1(this.db);
        this.market = new Market(this.db);

    }

    async start() {
        if (typeof BullOption.redis !== 'string') {
            this.redisClient = redis.createClient(BullOption.redis.port, BullOption.redis.host);
            this.redisClient.auth(BullOption.redis.password);
        }
        this.startCleanupJob();
        const [initErr,initRes] = await to(this.init());
        if (initErr){
            console.error('[DATA_PROCESS]: init data failed',initErr)
        }
        this.refreshCoinBookLoop();
        setTimeout(() => {
            this.orderBookLoop();
            this.marketQuotationLoop();
        }, 1000);
    }
    async refreshCoinBookLoop() {
        const listBridgeAddressRes = await this.db.listBridgeAddress();
        const addressArr = [];
        for (const address of listBridgeAddressRes){
            addressArr.push(address.address);
        }
        addressArr.push('0x660b26beb33778dbece8148bf32e83373dd1fee80e');
        addressArr.push('0x669b7bae95f3823acb2d5d434f4b4be6968cc8a233');
        console.log('start refreshCoinBook at',this.utils.get_current_time());
        const tokens = await this.mist_wallet.list_mist_tokens();
        // @ts-ignore
        // tslint:disable-next-line:forin
        for (let index:number in tokens) {
            const tokenOjb = new Token(tokens[index].address);
            const [batchqueryErr, batchqueryRes]:[Error,IERC20Book] = await to(tokenOjb.batchquery(addressArr, 'child_poa'));
            if(!batchqueryErr && batchqueryRes) {
                // @ts-ignore
                for (const account of batchqueryRes) {
                        const balance = NP.divide(account.balance, 100000000);
                        const borrowAmount = NP.divide(account.borrow, 100000000);
                        const repayAmount = NP.divide(account.repay, 100000000);
                        const latestBorrowTime = account.latesttime;

                        let freezeAmount = '0';
                        const freezeResult = await this.db.get_freeze_amount([account.account, tokens[index].symbol]);
                        if (freezeResult && freezeResult.length > 0) {
                            for (const freeze of freezeResult) {
                                if (freeze.side === 'buy') {
                                    freezeAmount = NP.plus(freezeAmount, freeze.quote_amount);
                                } else if (freeze.side === 'sell') {
                                    freezeAmount = NP.plus(freezeAmount, freeze.base_amount);
                                } else {
                                    console.error(`${freeze.side} error`);
                                }
                            }
                        }
                        const localBook:ILocalBook = {
                            balance,
                            borrowAmount,
                            repayAmount,
                            latestBorrowTime,
                            freezeAmount,
                        }
                        await this.redisClient.HMSET(Utils.bookKeyFromAddress(account.account),tokens[index].symbol,JSON.stringify(localBook));
                         // @ts-ignore
                        index++;
                    }
            }else{
                console.error('[data_process]:batchqueryErr',tokens[index].symbol,batchqueryErr);
            }
        }
        console.log('end refreshCoinBook at',this.utils.get_current_time());
        setTimeout(() => {
            this.refreshCoinBookLoop.call(this);
        }, 24 * 60 * 60 * 1000);
    }

    async orderBookLoop() {
        this.logger.log('Start processing order book data');
        const [markets_err, markets] = await to(this.market.list_online_markets());
        if (!markets) {
            console.error(markets_err, markets);
            this.orderBookLoop.call(this);
            return;
        }
        const now =  this.utils.get_current_time();
        for (const marketInfo of markets) {
            for (const precision of ['0','1','2']){
                const orderBookRes = await this.order.order_book_v2(marketInfo.id,precision);
                const orderBookStr = JSON.stringify(orderBookRes);
                const orderBookArr = [marketInfo.id,+precision,orderBookStr,now];
                const [error2,result2] = await to(this.db.update_order_book_tmp(orderBookArr));
            }
        }

        this.orderBookLoop.call(this);
        return;
    }

    async marketQuotationLoop(): Promise<any> {
        this.logger.log('Start processing market data');
        const [markets_err, markets] = await to(this.market.list_online_markets());
        if (!markets) {
            console.error(markets_err, markets);
            this.marketQuotationLoop.call(this);
            return;
        }
        const now =  this.utils.get_current_time();
        for (const marketInfo of markets) {
            // todo:await to
            const marketQuotation = await this.market.getMarketQuotation(marketInfo.id);
            let info = this.utils.arr_values(marketQuotation);
            info = info.concat([now]);
            const [error,result] = await to(this.db.update_market_quotation(info));
        }

        this.marketQuotationLoop.call(this);
        return;
    }

    async init(): Promise<any> {
        const [markets_err, markets] = await to(this.market.list_online_markets());
        if (!markets) {
            console.error(markets_err, markets);
            return [];
        }
        await this.db.truncate('mist_market_quotation_tmp');
        await this.db.truncate('mist_order_book_tmp');
        const now =  this.utils.get_current_time();
        for (const marketInfo of markets) {
            const [findMarketQuotationErr,findMarketQuotationRes] = await to(this.db.get_market_quotation_tmp([marketInfo.id]));
            if(findMarketQuotationErr || findMarketQuotationRes.length > 0) continue;
            const marketQuotation = await this.market.getMarketQuotation(marketInfo.id);
            let info = this.utils.arr_values(marketQuotation);
            info = info.concat([now,now]);
            // FIXME:重复插入会报错失败不用管
            const [error,result] = await to(this.db.insert_market_quotation(info));

            for (const precision of ['0','1','2']){
                const [findBookErr,findBookRes] = await to(this.db.get_order_book_tmp([marketInfo.id,precision]));
                if(findBookErr || findBookRes.length > 0) continue;
                const orderBookRes = await this.order.order_book_v2(marketInfo.id,precision);
                const orderBookStr = JSON.stringify(orderBookRes);
                const orderBookArr = [marketInfo.id,+precision,orderBookStr,now,now];
                console.log(orderBookArr);
                const [error2,result2] = await to(this.db.insert_order_book_tmp(orderBookArr));
            }

        }
    }

    startCleanupJob() {
        // cleanup temp orders
        setInterval(async () => {
            const [err] = await to(this.db.cleanupTempOrders());
            if (err) {
                console.log(err);
            }
        }, 60 * 60 * 1000);
    }

}


const health = new Health();
health.start();

const processData = new ProcessData();
processData.start();
