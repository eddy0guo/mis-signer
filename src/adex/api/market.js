import client from '../models/db'
import utils2 from './utils'

import to from 'await-to-js';
import mist_wallet from './mist_wallet'

export default class makets {
    db;
    exchange;
    root_hash;

    constructor() {
        this.db = new client();
        this.utils = new utils2;
    }

    async list_markets() {
        let result = await this.db.list_markets();
        return result;
    }

    async get_market(market_id) {
        return await this.db.get_market([market_id]);
    }


    async list_market_quotations() {

        let markets = await this.list_markets();
        let quotation = new mist_wallet;
        let quotations = [];
        for (var index in markets) {
            let [err, result] = await to(this.db.get_market_quotations([markets[index].id]));
            if (!err) {
                let base_token = result[0].market_id.split('-')[0];
                result[0].CNYC_price = await quotation.get_token_price2pi(base_token);
                quotations.push(result[0]);
            }
        }
        return quotations;
    }


}
