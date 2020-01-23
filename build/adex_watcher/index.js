"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../adex/models/db");
const utils_1 = require("../adex/api/utils");
const chain_1 = require("../wallet/api/chain");
const await_to_js_1 = require("await-to-js");
const number_precision_1 = require("number-precision");
class watcher {
    constructor() {
        this.db = new db_1.default;
        this.utils = new utils_1.default;
        this.block_height = 0;
        this.start();
    }
    async start() {
        this.loop();
    }
    async loop() {
        const [bestblock_err, bestblock_result] = await await_to_js_1.default(chain_1.chain.getbestblock());
        if (bestblock_err || bestblock_result.height == this.block_height) {
            setTimeout(() => {
                this.loop.call(this);
            }, 500);
            return;
        }
        this.block_height = bestblock_result.height;
        const transaction = await this.db.get_pending_transactions();
        if (!transaction || transaction.length == 0) {
            console.log('[ADEX WATCHER]:no pending transaction');
            setTimeout(() => {
                this.loop.call(this);
            }, 1000);
            return;
        }
        const id = transaction[0].id;
        const [err, result] = await await_to_js_1.default(chain_1.chain.getrawtransaction([transaction[0].transaction_hash, true, true], 'child_poa'));
        const update_time = this.utils.get_current_time();
        if (!err && result.confirmations >= 1) {
            const status = 'successful';
            const [get_receipt_err, contract_status] = await await_to_js_1.default(this.utils.get_receipt_log(transaction[0].transaction_hash));
            if (get_receipt_err) {
                console.error(`get_receipt_err--${get_receipt_err}`);
                this.loop.call(this);
                return;
            }
            const info = [status, update_time, id];
            const transaction_info = [status, contract_status, update_time, id];
            await this.db.update_transactions(transaction_info);
            await this.db.update_trades(info);
            const trades = await this.db.transactions_trades([id]);
            const updates = [];
            for (const index in trades) {
                const trade_amount = +trades[index].amount;
                let index_taker;
                const taker_ar = updates.find(function (elem, index_tmp) {
                    index_taker = index_tmp;
                    return elem.info[3] == trades[index].taker_order_id;
                });
                let index_maker;
                const maker_ar = updates.find(function (elem, index_tmp) {
                    index_maker = index_tmp;
                    return elem.info[3] == trades[index].maker_order_id;
                });
                if (!taker_ar) {
                    const update_taker = {
                        info: [+trade_amount, -trade_amount, update_time, trades[index].taker_order_id]
                    };
                    updates.push(update_taker);
                }
                else {
                    updates[index_taker].info[0] = number_precision_1.default.plus(updates[index_taker].info[0], trade_amount);
                    updates[index_taker].info[1] = number_precision_1.default.minus(updates[index_taker].info[1], trade_amount);
                }
                if (!maker_ar) {
                    const update_maker = {
                        info: [+trade_amount, -trade_amount, update_time, trades[index].maker_order_id]
                    };
                    updates.push(update_maker);
                }
                else {
                    updates[index_maker].info[0] = number_precision_1.default.plus(updates[index_maker].info[0], trade_amount);
                    updates[index_maker].info[1] = number_precision_1.default.minus(updates[index_maker].info[1], trade_amount);
                }
            }
            await this.db.update_order_confirm(updates);
        }
        else if (err) {
            await this.db.update_transactions(['failed', undefined, update_time, id]);
            console.error('Err', err);
        }
        else {
            console.log('[Watcher Pending]', transaction[0].transaction_hash);
        }
        this.loop.call(this);
    }
}
exports.default = new watcher();
//# sourceMappingURL=index.js.map