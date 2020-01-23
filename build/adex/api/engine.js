"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const number_precision_1 = require("number-precision");
const cfg_1 = require("../../cfg");
class engine {
    constructor(client) {
        this.db = client;
        this.utils = new utils_1.default;
    }
    async match(message) {
        let side = 'buy';
        if (message.side == 'buy') {
            side = 'sell';
        }
        const filter = [message.price, side, message.market_id];
        const result = await this.db.filter_orders(filter);
        const match_orders = [];
        let amount = 0;
        for (let i = 0; i < result.length; i++) {
            result[i].amount = +result[i].amount;
            result[i].available_amount = +result[i].available_amount;
            match_orders.push(result[i]);
            amount += result[i].available_amount;
            if (amount >= message.amount) {
                break;
            }
        }
        return match_orders;
    }
    async make_trades(find_orders, my_order) {
        const create_time = this.utils.get_current_time();
        const trade_arr = [];
        let amount = 0;
        for (let item = 0; item < find_orders.length; item++) {
            let maker_status = 'full_filled';
            amount = number_precision_1.default.plus(amount, find_orders[item].available_amount);
            if (item == find_orders.length - 1 && amount > my_order.amount) {
                const overflow_amount = number_precision_1.default.minus(amount, my_order.amount);
                find_orders[item].available_amount = number_precision_1.default.minus(find_orders[item].available_amount, overflow_amount);
                maker_status = 'partial_filled';
            }
            const trade = {
                id: null,
                trade_hash: null,
                transaction_id: null,
                transaction_hash: null,
                status: 'matched',
                market_id: my_order.market_id,
                maker: find_orders[item].trader_address,
                taker: my_order.trader_address,
                price: find_orders[item].price,
                amount: find_orders[item].available_amount,
                taker_side: my_order.side,
                maker_order_id: find_orders[item].id,
                taker_order_id: my_order.id,
                created_at: create_time,
                updated_at: create_time,
            };
            const trade_id = this.utils.get_hash(trade);
            trade.id = trade_id;
            trade_arr.push(trade);
            const update_maker_orders_info = [-find_orders[item].available_amount, 0, 0, find_orders[item].available_amount, maker_status, create_time, find_orders[item].id];
            await this.db.update_orders(update_maker_orders_info);
        }
        return trade_arr;
    }
    async call_asimov(trades) {
        const token_address = await this.db.get_market([trades[0].market_id]);
        const transactions = await this.db.list_all_trades();
        const matched_trades = await this.db.list_matched_trades();
        const add_queue_num = Math.floor(matched_trades[0].count / 300) + 1;
        const transaction_id = transactions.length == 0 ? 0 : transactions[0].transaction_id + add_queue_num;
        const index = transaction_id % 3;
        const order_address_set = [token_address[0].base_token_address, token_address[0].quote_token_address, cfg_1.default.relayers[index].address];
        const trades_arr = [];
        for (const i in trades) {
            const trade_info = {
                taker: trades[i].taker,
                maker: trades[i].maker,
                baseToken: order_address_set[0],
                quoteToken: order_address_set[1],
                relayer: order_address_set[2],
                baseTokenAmount: number_precision_1.default.times(trades[i].amount, 100000000),
                quoteTokenAmount: number_precision_1.default.times(trades[i].amount, trades[i].price, 100000000),
                takerSide: trades[i].taker_side,
            };
            trades[i].transaction_id = transaction_id;
            trades[i].trade_hash = await this.utils.orderhashbytes(trade_info);
            trades_arr.push(this.utils.arr_values(trades[i]));
        }
        await this.db.insert_trades(trades_arr);
    }
}
exports.default = engine;
//# sourceMappingURL=engine.js.map