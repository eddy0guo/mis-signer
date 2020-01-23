"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../adex/models/db");
const engine_1 = require("../adex/api/engine");
const utils_1 = require("../adex/api/utils");
const Queue = require("bull");
const number_precision_1 = require("number-precision");
class enginer {
    constructor() {
        this.orderQueue = new Queue('OrderQueue' + process.env.MIST_MODE, { redis: { port: process.env.REDIS_PORT, host: process.env.REDIS_URL, password: process.env.REDIS_PWD } });
        this.db = new db_1.default();
        this.exchange = new engine_1.default(this.db);
        this.utils = new utils_1.default();
        this.start();
    }
    async start() {
        this.orderQueue.process(async (job, done) => {
            const message = job.data;
            const create_time = this.utils.get_current_time();
            message.created_at = create_time;
            message.updated_at = create_time;
            while (message.available_amount > 0) {
                const find_orders = await this.exchange.match(message);
                if (find_orders.length == 0) {
                    break;
                }
                const trades = await this.exchange.make_trades(find_orders, message);
                await this.exchange.call_asimov(trades);
                let amount = 0;
                for (const i in trades) {
                    amount = number_precision_1.default.plus(amount, trades[i].amount);
                }
                message.available_amount = number_precision_1.default.minus(message.available_amount, amount);
                message.pending_amount = number_precision_1.default.plus(message.pending_amount, amount);
            }
            if (message.pending_amount == 0) {
                message.status = 'pending';
            }
            else if (message.available_amount == 0) {
                message.status = 'full_filled';
            }
            else {
                message.status = 'partial_filled';
            }
            const arr_message = this.utils.arr_values(message);
            await this.db.insert_order(arr_message);
            done();
        });
    }
}
exports.default = new enginer();
//# sourceMappingURL=index.js.map