import Utils from './utils';
import DBClient from '../models/db';
import to from 'await-to-js';
import MistMallet from './mist_wallet';
import {IMarket} from '../interface';

export default class Market {
    private db:DBClient;
    private utils:Utils;
    private mistMallet:MistMallet;

    constructor(client) {
        this.db = client;
        this.utils = new Utils();
        this.mistMallet = new MistMallet(client);

    }


    async market_down(id: string, down_at: string): Promise<any[]> {
        const update_at = this.utils.get_current_time();
        const result = await this.db.market_down([down_at, id, update_at]);
        return result;
    }


    async market_up(id: string, up_at: string): Promise<any[]> {
        const update_at = this.utils.get_current_time();
        const [err, result] = await to(this.db.market_up([up_at, id, update_at]));
        if (!result) {
            console.error(err, result);
        }
        return result;
    }

    async market_add(info): Promise<any[]> {
        const current_time = this.utils.get_current_time();
        // online,up_at,down_at,updated_at,created_at
        info = info.concat([false, current_time, current_time, current_time, current_time]);
        const [err, result] = await to(this.db.market_add(info));
        if (!result) {
            console.error(err, result);
        }
        return result;
    }


    async list_markets(): Promise<IMarket[]> {
        const result = await this.db.list_markets();
        return result;
    }

    async list_online_markets(): Promise<IMarket[]> {
        const [err, markets] = await to(this.db.list_online_markets());
        if (!markets) {
            console.error(err, markets);
        }
        const onlineMarkets = [];
        for(const market of markets){
            if(onlineMarkets.length === 0){
                const onlineMarket = {
                    quoteToken:market.quote_token_symbol,
                    markets:[],
                }
                onlineMarkets.push(onlineMarket);
            }
            // tslint:disable-next-line:forin
            for (const index in onlineMarkets){
                if (market.quote_token_symbol === onlineMarkets[index].quoteToken){
                    onlineMarkets[index].markets.push(market);
                    continue;
                }
                if(+index === onlineMarkets.length - 1) {
                    const onlineMarket = {
                        quoteToken: market.quote_token_symbol,
                        markets: [market],
                    }
                    onlineMarkets.push(onlineMarket);
                }
            }
        }

        return onlineMarkets;
    }

    async list_online_markets_v2(): Promise<IMarket[]> {
        const [err, markets] = await to(this.db.list_online_markets());
        if (!markets) {
            console.error(err, markets);
        }
        const onlineMarkets = [];
        for(const market of markets){
            if(onlineMarkets.length === 0){
                const onlineMarket = {
                    quoteToken:market.quote_token_symbol,
                    markets:[],
                }
                onlineMarkets.push(onlineMarket);
            }
            // tslint:disable-next-line:forin
            for (const index in onlineMarkets){
                if (market.quote_token_symbol === onlineMarkets[index].quoteToken){
                    onlineMarkets[index].markets.push(market);
                    continue;
                }
                if(+index === onlineMarkets.length - 1) {
                    const onlineMarket = {
                        quoteToken: market.quote_token_symbol,
                        markets: [market],
                    }
                    onlineMarkets.push(onlineMarket);
                }
            }
        }

        return onlineMarkets;
    }


    async get_market(market_id): Promise<IMarket[]> {
        return await this.db.get_market([market_id]);
    }

    // TODO 该方法生产环境无法访问
    async list_market_quotations(): Promise<any[]> {

        const logs = [];
        const [markets_err, markets] = await to(this.list_online_markets());
        if (!markets) {
            console.error(markets_err, markets);
            return [];
        }
        const quotations = [];

        for (const marketInfo of markets) {
            const defaultQuotations = {
                market_id: marketInfo.id,
                price: 0,
                ratio: 0,
                volume: 0,
                CNYC_price: 0,
                maxprice: 0,
                minprice: 0,
                min_CNYC_price: 0,
                max_CNYC_price: 0,
                symbol: marketInfo.id.replace('-', '/'),
            };
            const [error,result] =  await to(this.db.get_market_quotation_tmp([marketInfo.id]))
            console.log(error,result);
            const quotation = result && result[0] ? result[0]:defaultQuotations;
            quotations.push(quotation);
        }
        logs.push({beforeSort:new Date().toLocaleTimeString()});
        // @ts-ignore
        quotations.sort((a, b) => {
            // XXX:为了和ws推送的数据的排序保持一致
            if (a.market_id.split('').reverse().join('') < b.market_id.split('').reverse().join('')) {
                return -1;
            } else {
                return 1;
            }
        });

        logs.push({end:new Date().toLocaleTimeString()});
        console.log(logs);

        return quotations;
    }


    async getMarketQuotation(marketId){
        const logs = [];
        const defaultQuotations = {
            market_id: marketId,
            price: 0,
            ratio: 0,
            volume: 0,
            CNYC_price: 0,
            maxprice: 0,
            minprice: 0,
            min_CNYC_price: 0,
            max_CNYC_price: 0,
            symbol: marketId.replace('-', '/'),
        };
        let [err, result]: [any, any] = await to(this.db.get_market_quotations([marketId]));
        if (err || !result ) {
            console.error(`get_market_quotations failed ${marketId},err ${err}`);
            err = null;
            result = [defaultQuotations];
        } else if( result.length <= 0 ) {
            result[0] = defaultQuotations;
        } else {
            const [base_token, quote_token] = result[0].market_id.split('-');
            const quote_price = await this.mistMallet.get_token_price2pi(quote_token);
            const max_price = await this.db.get_market_max_price([marketId]);
            const min_price = await this.db.get_market_min_price([marketId]);

            if (max_price.length > 0 && min_price.length > 0 && quote_price > 0) {
                result[0].CNYC_price = await this.mistMallet.get_token_price2pi(base_token);
                result[0].maxprice = max_price[0].price;
                result[0].minprice = min_price[0].price;
                result[0].min_CNYC_price = (min_price[0].price * quote_price).toFixed(2);
                result[0].max_CNYC_price = (max_price[0].price * quote_price).toFixed(2);
                result[0].symbol = marketId.replace('-', '/');
            } else {
                result[0] = defaultQuotations;
            }
        }

        logs.push({marketItem:new Date().toLocaleString(),marketId});
        return  result[0];
    }

}
