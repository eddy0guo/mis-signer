import utils2 from './utils';

import to from 'await-to-js';
import mist_wallet from './mist_wallet';
import {IMarket} from '../interface';

export default class Market {
    private db;
    private utils;
    private quotation;

    constructor(client) {
        this.db = client;
        this.utils = new utils2();
        this.quotation = new mist_wallet(client);

    }


    async market_down(id): Promise<any[]> {
        const update_at = this.utils.get_current_time();
        const result = await this.db.update_market([false, id, update_at]);
        return result;
    }


    async market_up(id): Promise<any[]> {
        const update_at = this.utils.get_current_time();
        const [err, result] = await to(this.db.update_market([true, id, update_at]));
        if (!result) {
            console.error(err, result);
        }
        return result;
    }

    async market_add(info): Promise<any[]> {
        const current_time = this.utils.get_current_time();
        info = info.concat([false, current_time, current_time]);
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
        const [err, result] = await to(this.db.list_online_markets());
        if (!result) {
            console.error(err, result);
        }
        return result;
    }


    async get_market(market_id): Promise<IMarket[]> {
        return await this.db.get_market([market_id]);
    }

    async list_market_quotations() {

        const [markets_err, markets] = await to(this.list_online_markets());
        if (!markets) {
            console.error(markets_err, markets);
            return [];
        }
        const quotations = [];
        for (const index in markets) {
            if (!markets[index]) continue

            const [err, result]: [any, any] = await to(this.db.get_market_quotations([markets[index].id]));
            const [base_token, quote_token] = result[0].market_id.split('-');
            const quote_price = await this.quotation.get_token_price2pi(quote_token);
            const max_price = await this.db.get_market_max_price([base_token]);
            const min_price = await this.db.get_market_min_price([base_token]);

            if (!err && result && result.length > 0 && max_price.length > 0 && min_price.length > 0 && quote_price > 0) {
                result[0].CNYC_price = await this.quotation.get_token_price2pi(base_token);
                result[0].maxprice = max_price[0].price;
                result[0].minprice = min_price[0].price;
                result[0].min_CNYC_price = (min_price[0].price * quote_price).toFixed(2);
                result[0].max_CNYC_price = (max_price[0].price * quote_price).toFixed(2);
                result[0].symbol = markets[index].id.replace('-', '/');
            } else if (!err && result && result.length === 0) {
                result[0] = {
                    market_id: markets[index].id,
                    price: 0,
                    ratio: 0,
                    volume: 0,
                    CNYC_price: 0,
                    maxprice: 0,
                    minprice: 0,
                    min_CNYC_price: 0,
                    max_CNYC_price: 0,
                    symbol: markets[index].id.replace('-', '/'),
                }
            } else {
                console.error(err);
            }
            quotations.push(result[0]);
        }
        // @ts-ignore
        quotations.sort((a, b) => {
            // XXX:为了和ws推送的数据的排序保持一致
            if (a.market_id.split('').reverse().join('') < b.market_id.split('').reverse().join('')) {
                return -1;
            } else {
                return 1;
            }
        });
        return quotations;
    }

}
