import client from '../models/db';
import utils2 from './utils';

import to from 'await-to-js';
import mist_wallet from './mist_wallet';

export default class Market {
    private db;
    private utils;

    constructor() {
        this.db = new client();
        this.utils = new utils2();
    }

    async list_markets() {
        const result = await this.db.list_markets();
        return result;
    }

    async get_market(market_id) {
        return await this.db.get_market([market_id]);
    }

    async list_market_quotations() {

        const markets = await this.list_markets();
        const quotation = new mist_wallet();
        const quotations = [];
        for (const index in markets) {
            if( !markets[index])continue
            const [err, result] = await to(this.db.get_market_quotations([markets[index].id]));
            if (!err && result && result.length > 0) {
                const base_token = result[0].market_id.split('-')[0];
                result[0].CNYC_price = await quotation.get_token_price2pi(base_token);
                quotations.push(result[0]);
            }
        }
        return quotations;
    }

}
