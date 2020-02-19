import to from 'await-to-js';
import date = require('silly-datetime');

import { restore_order } from './order';

export default class trades {
    private db;


    constructor(client) {
        this.db = client;
    }

    async get_engine_info() {

        const result = await this.db.get_engine_info();
        return result;
    }

    async list_trades(marketID) {

        const result = await this.db.list_trades([marketID]);
        return result;
    }

    async my_trades_length(address) {

        const result = await this.db.my_trades_length([address]);
        return result;
    }

    async my_trades(message) {

        const filter_info = [message.address];
        const result = await this.db.my_trades(filter_info);

        return result;
    }

    async my_trades2(address, page, perpage) {
        const offset = (+page - 1) * perpage;
        const [err, result] = await to(this.db.my_trades2([address, offset, perpage]));
        if (!result) console.error(err, result);
        return result;
    }

    async trading_view(message) {
        const bar_length = (message.to - message.from) / message.granularity;
        const bars = [];
        for (let i = 0; i < bar_length; i++) {
            const from = date.format(new Date((message.from + message.granularity * i) * 1000), 'YYYY-MM-DD HH:mm:ss');
            const to_time = date.format(new Date((message.from + message.granularity * (i + 1)) * 1000), 'YYYY-MM-DD HH:mm:ss');
            const filter_info = [message.market_id, from, to_time];
            const trades_by_time = await this.db.sort_trades(filter_info, 'created_at');
            const trades_by_price = await this.db.sort_trades(filter_info, 'price');

            let volume = 0;
            for (const item of trades_by_price) {
                volume += +item.amount;
            }

            let open = 0;
            let close = 0;
            let high = 0;
            let low = 0;

            if (trades_by_time.length !== 0) {
                open = trades_by_time[0].price;
                close = trades_by_time.pop().price;
                high = trades_by_price[0].price;
                low = trades_by_price.pop().price;
            }

            const bar = {
                time: from,
                open,
                close,
                low,
                high,
                volume,
            };
            bars.push(bar);
        }
        return bars;
    }

    // 应该先停laucher的线程，再回滚，否则可能出现已经launched的也回滚了
    async rollback_trades() {
        const matched_trades = await this.db.get_matched_trades();
        for (const item of matched_trades) {
            restore_order(item.taker_order_id, item.amount);
            restore_order(item.maker_order_id, item.amount);
        }

        await this.db.delete_matched_trades();
    }
}
