"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../adex/models/db");
const utils_1 = require("../adex/api/utils");
const await_to_js_1 = require("await-to-js");
const cfg_1 = require("../cfg");
const mist_ex10_1 = require("../wallet/contract/mist_ex10");
const number_precision_1 = require("number-precision");
const chain_1 = require("../wallet/api/chain");
class launcher {
    constructor() {
        this.db = new db_1.default;
        this.utils = new utils_1.default;
        this.start();
        this.block_height = 0;
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
        const trades = await this.db.get_laucher_trades();
        const current_time = this.utils.get_current_time();
        if (trades.length == 0) {
            console.log('[Launcher] No matched trades');
            setTimeout(() => {
                this.loop.call(this);
            }, 1000);
            return;
        }
        this.tmp_transaction_id = trades[0].transaction_id;
        const update_trade_info = ['pending', undefined, current_time, trades[0].transaction_id];
        await this.db.launch_update_trades(update_trade_info);
        setTimeout(async () => {
            const trades = await this.db.transactions_trades([this.tmp_transaction_id]);
            const index = trades[0].transaction_id % 3;
            const trades_hash = [];
            const markets = await this.db.list_markets();
            for (const i in trades) {
                let token_address;
                for (const j in markets) {
                    if (trades[i].market_id == markets[j].id) {
                        token_address = markets[j];
                    }
                }
                if (token_address == undefined) {
                    console.error('not support market id');
                    continue;
                }
                const trade_info = {
                    trade_hash: trades[i].trade_hash,
                    taker: trades[i].taker,
                    maker: trades[i].maker,
                    base_token_address: token_address.base_token_address,
                    quote_token_address: token_address.quote_token_address,
                    relayer: cfg_1.default.relayers[index].address,
                    base_token_amount: number_precision_1.default.times(+trades[i].amount, 100000000),
                    quote_token_amount: number_precision_1.default.times(+trades[i].amount, +trades[i].price, 100000000),
                    r: null,
                    s: null,
                    side: trades[i].taker_side,
                    v: null
                };
                trades_hash.push(trade_info);
            }
            const mist = new mist_ex10_1.default(cfg_1.default.ex_address);
            const [err, txid] = await await_to_js_1.default(mist.matchorder(trades_hash, cfg_1.default.relayers[index].prikey, cfg_1.default.relayers[index].word));
            if (!err) {
                const update_trade_info = ['pending', txid, current_time, trades[0].transaction_id];
                await this.db.launch_update_trades(update_trade_info);
                const TXinfo = [trades[0].transaction_id, txid, trades[0].market_id, 'pending', 'pending', current_time, current_time];
                this.db.insert_transactions(TXinfo);
            }
            else {
                const update_trade_info = ['matched', null, current_time, trades[0].transaction_id];
                await this.db.launch_update_trades(update_trade_info);
                if (err)
                    console.log('---call dex matchorder--err=%o-transaction_id=%o--relayers=%o\n', err, trades[0].transaction_id, cfg_1.default.relayers[index].address);
            }
            this.loop.call(this);
        }, 2000);
    }
}
exports.default = new launcher();
//# sourceMappingURL=index.js.map