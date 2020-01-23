"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const await_to_js_1 = require("await-to-js");
const utils_1 = require("../adex/api/utils");
const db_1 = require("../express/models/db");
const cfg_1 = require("../cfg");
const asimov_wallet_1 = require("@fingo/asimov-wallet");
class watcher {
    constructor() {
        this.psql_db = new db_1.default();
        this.utils = new utils_1.default();
        this.start();
    }
    async start() {
        this.loop();
    }
    async loop() {
        const [err, pending_trade] = await await_to_js_1.default(this.psql_db.laucher_pending_trade());
        if (err)
            console.error(err);
        if (!pending_trade || pending_trade.length == 0) {
            console.log('[Express Watcher]No pending trade');
            setTimeout(() => {
                this.loop.call(this);
            }, 2000);
            return;
        }
        const { trade_id, address, quote_amount, quote_asset_name } = pending_trade[0];
        const current_time = this.utils.get_current_time();
        const tokens = await this.psql_db.get_tokens([quote_asset_name]);
        const wallet = new asimov_wallet_1.AsimovWallet({
            name: cfg_1.default.fauct_address,
            rpc: cfg_1.default.asimov_master_rpc,
            mnemonic: cfg_1.default.fauct_word,
        });
        const [quote_err, quote_txid] = await await_to_js_1.default(wallet.commonTX.transfer(address, quote_amount, tokens[0].asim_assetid));
        if (quote_err)
            console.error(quote_err);
        const quote_tx_status = quote_txid == undefined ? 'failed' : 'successful';
        const info = [quote_txid, quote_tx_status, current_time, trade_id];
        const [err3, result3] = await await_to_js_1.default(this.psql_db.update_quote(info));
        if (err3)
            console.error(err3, result3);
        setTimeout(() => {
            this.loop.call(this);
        }, 1000 * 10);
    }
}
exports.default = new watcher();
//# sourceMappingURL=index.js.map