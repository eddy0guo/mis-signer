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


	async market_down(id) {
		const update_at = this.utils.get_current_time();
        const result = await this.db.update_market([false,id,update_at]);
        return result;
    }


	async market_up(id) {
		const update_at = this.utils.get_current_time();
        const result = await this.db.update_market([true,id,update_at]);
        return result;
    }

	async market_add(info) {
		const current_time = this.utils.get_current_time();
		info = info.concat([true,current_time,current_time]);
        const result = await this.db.market_add(info);
        return result;
    }


    async list_markets() {
        const result = await this.db.list_markets();
        return result;
    }

	async list_online_markets() {
        const result = await this.db.list_online_markets();
        return result;
    }


    async get_market(market_id) {
        return await this.db.get_market([market_id]);
    }

    async list_market_quotations() {

        const markets = await this.list_online_markets();
        const quotation = new mist_wallet();
        const quotations = [];
        for (const index in markets) {
            if( !markets[index])continue
            const [err, result]: [any,any] = await to(this.db.get_market_quotations([markets[index].id]));
			if (!err && result && result.length > 0) {
                let base_token = result[0].market_id.split('-')[0];
                result[0].CNYC_price = await quotation.get_token_price2pi(base_token);

            }else if(!err && result && result.length === 0){
                result[0] = {
                    market_id: markets[index].id,
                    price: 0,
                    ratio: 0,
                    volume: 0,
                    CNYC_price: 0
                }
            }else{
				console.error(err);	
			}
            quotations.push(result[0]);
        }
        return quotations;
    }

}
