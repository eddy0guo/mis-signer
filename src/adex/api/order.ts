import client from '../models/db';
import NP from 'number-precision';

import engine from './engine';
import utils2 from './utils';

const Queue = require('bull');
const orderQueue = new Queue('OrderQueue' + process.env.MIST_MODE, { redis: { port: process.env.REDIS_PORT, host: process.env.REDIS_URL, password: process.env.REDIS_PWD } });

export default class order {

    private db;
    private exchange;
    private utils;

    constructor(client) {
        this.db = client;
        this.exchange = new engine(this.db);
        this.utils = new utils2();
    }

    async build(message) {
		/*暂时这块业务没做先去掉此逻辑
        let mist_user = await this.db.find_user([message.trader_address]);
        if (!mist_user[0]) {
            let address_info = {
                address: message.trader_address,
            }
            let result = await this.db.insert_users(this.utils.arr_values(address_info));

        }
		*/
        orderQueue.add(message);
        return;
    }

    async cancle_order(message) {

        const create_time = this.utils.get_current_time();
        const cancle_info = [-message.amount, 0, message.amount, 0, 'cancled', create_time, message.id];
        const result = await this.db.update_orders(cancle_info);

        return result;
    }

    async list_orders() {

        const result = await this.db.list_orders();

        return result;
    }

    async my_orders(message) {

        const filter_info = [message.address];
        const result = await this.db.my_orders(filter_info);

        return result;
    }

    async my_orders2(address, page, perpage, status1, status2) {
        const offset = (+page - 1) * perpage;
        const orders = await this.db.my_orders2([address, offset, perpage, status1, status2]);
        for (const order_index in orders) {
            const trades = await this.db.order_trades([orders[order_index].id]);
            if (trades.length == 0) {
                orders[order_index].average_price = '--';
                orders[order_index].confirm_value = '--';
                continue;
            }
            let amount = 0;
            let value = 0;
            for (const trade_index in trades) {
                amount = NP.plus(amount, trades[trade_index].amount);
                const trade_value = NP.times(trades[trade_index].amount, trades[trade_index].price);
                value = NP.plus(value, trade_value);
            }
            orders[order_index].average_price = NP.divide(value, amount).toFixed(8);
            orders[order_index].confirm_value = value.toFixed(8);
        }

        return orders;
    }

    async my_orders_length(address, status1, status2) {
        const result = await this.db.my_orders_length([address, status1, status2]);
        return result;
    }

    async order_book(marketID) {

        const asks = await this.db.order_book(['sell', marketID]);
        const bids = await this.db.order_book(['buy', marketID]);

        const asks_arr = [];
        const bids_arr = [];
        for (const item in asks) {

            asks_arr.push(this.utils.arr_values(asks[item]));
        }

        for (const item2 in bids) {
            bids_arr.push(this.utils.arr_values(bids[item2]));
        }

        const order_book = {
            asks: asks_arr.reverse(),
            bids: bids_arr,
        };
        return order_book;
    }

    async get_order(order_id) {
        return await this.db.find_order([order_id]);
    }

}

// 回滚没有打包成功的交易,不过吃单变成了挂单，等别人吃
export async function restore_order(order_id, amount) {
    const utils = new utils2;
    const update_time = utils.get_current_time();
    const db = new client();
    const current_order = await db.find_order([order_id]);

    const status = current_order[0].available_amount + amount < current_order[0].amount ? 'partial_filled' : 'pending';
    const update_orders_info = [amount, 0, 0, -amount, status, update_time, order_id];
    await db.update_orders(update_orders_info);
}
