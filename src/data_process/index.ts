import to from 'await-to-js'
import Utils from '../adex/api/utils'
import DBClient from '../adex/models/db'

import mist_config from '../cfg'
import {Health} from '../common/Health';
import NP from '../common/NP';
import Order from '../adex/api/order';
import mist_wallet1 from '../adex/api/mist_wallet';
import Market from '../adex/api/market';
import {Logger} from '../common/Logger';




class ProcessData {

    private db : DBClient;
    private utils : Utils;
    private order : Order;
    private mist_wallet;
    private market : Market;
    private logger: Logger = new Logger(ProcessData.name, 5 * 60 * 1000);


    constructor() {
        this.db = new DBClient();
        this.utils = new Utils();
        this.order = new Order(this.db);
        this.mist_wallet = new mist_wallet1(this.db);
        this.market = new Market(this.db);

    }

    async start() {

        this.startCleanupJob();
        await this.init();
        setTimeout(() => {
            this.orderBookLoop();
            this.marketQuotationLoop();
        }, 1000);
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

    async marketQuotationLoop() {
        this.logger.log('Start processing market data');
        const [markets_err, markets] = await to(this.market.list_online_markets());
        if (!markets) {
            console.error(markets_err, markets);
            this.marketQuotationLoop.call(this);
            return;
        }
        const now =  this.utils.get_current_time();
        for (const marketInfo of markets) {
            const marketQuotation = await this.market.getMarketQuotation(marketInfo.id);
            let info = this.utils.arr_values(marketQuotation);
            info = info.concat([now]);
            const [error,result] = await to(this.db.update_market_quotation(info));
        }

        this.marketQuotationLoop.call(this);
        return;
    }

    async init() {
        const [markets_err, markets] = await to(this.market.list_online_markets());
        if (!markets) {
            console.error(markets_err, markets);
            return [];
        }
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