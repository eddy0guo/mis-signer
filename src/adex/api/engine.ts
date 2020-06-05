import Utils from './utils';
import NP from '../../common/NP';
import mist_config from '../../cfg';
import to from 'await-to-js'
import {IOrder, ITrade} from '../interface';
import DBClient from '../models/db';
import {promisify} from 'util';
const ENGINE_ORDERS = 'engine_orders';
export default class Engine {
    private db:DBClient;
    private utils:Utils;

    constructor(client:DBClient) {
        this.db = client;
        this.utils = new Utils();
    }

    async match(message,redisClient): Promise<IOrder[]> {
        const  side = message.side ===  'buy'  ? 'sell':'buy';
        const filter = [message.price, side, message.market_id];
        const result = await this.db.filter_orders(filter);
        const match_orders = [];
        let amount = '0';
        // find and retunr。all orders。which's price below this order
        for (const i in result) {
            if (!result[i]) continue;
            result[i].amount = +result[i].amount;
            result[i].available_amount = +result[i].available_amount;
            match_orders.push(result[i]);
            amount = NP.plus(amount,result[i].available_amount);
            if (amount >= message.available_amount) {
                break;
            }
        }
        return match_orders;
    }

    async makeTrades(find_orders, my_order): Promise<ITrade[]> {
        const create_time = this.utils.get_current_time();
        const trade_arr: ITrade[] = [];
        let available_amount = my_order.available_amount;

        for (let item = 0; item < find_orders.length; item++) {
            let maker_status = 'full_filled';
            // 吃单全部成交,挂单有剩余,
            if (item === find_orders.length - 1 && available_amount < find_orders[item].available_amount) {
                const overflow_amount = NP.minus(find_orders[item].available_amount, available_amount);
                find_orders[item].available_amount = NP.minus(
                    find_orders[item].available_amount,
                    overflow_amount
                );
                maker_status = 'partial_filled';
            }
            available_amount = NP.minus(available_amount, find_orders[item].available_amount);

            const trade: ITrade = {
                id: null,
                transaction_id: null,
                transaction_hash: null,
                status: 'matched', // 匹配完成事matched，打包带确认pending，确认ok为successful，失败为failed
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
            const update_maker_orders_info = [
                -find_orders[item].available_amount,
                0,
                0,
                find_orders[item].available_amount,
                maker_status,
                create_time,
                find_orders[item].id,
            ];

            await this.db.update_orders(update_maker_orders_info);
        }
        return trade_arr;
    }

    async call_asimov(trades:ITrade[]): Promise<void> {
        const token_address = await this.db.get_market([trades[0].market_id]);
        if (!token_address) {
            console.log('[ADEX ENGINE]::(get_market):', token_address);
            return;
        }

        const transactions = await this.db.list_all_trades();
        const matched_trades = await this.db.list_matched_trades();
        // 经验值300为单次上链trades数量，主要受rpc接口相应时间限制
        const add_queue_num = Math.floor(matched_trades / 100) + 1;

        const transaction_id =
            transactions.length === 0 ? 0 : transactions[0].transaction_id + add_queue_num;
        const trades_arr = [];
        for (const i in trades) {
            if (!trades[i]) continue;
            trades[i].transaction_id = transaction_id;
            trades_arr.push(this.utils.arr_values(trades[i]));
        }
        await this.db.insert_trades(trades_arr);
    }
}
