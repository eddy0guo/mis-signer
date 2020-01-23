"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const await_to_js_1 = require("await-to-js");
const utils_1 = require("../adex/api/utils");
const db_1 = require("../adex/models/db");
const number_precision_1 = require("number-precision");
const cfg_1 = require("../cfg");
const asimov_wallet_1 = require("@fingo/asimov-wallet");
async function send_asset(address, asset, amount) {
    const master_wallet = new asimov_wallet_1.AsimovWallet({
        name: cfg_1.default.bridge_address,
        rpc: cfg_1.default.asimov_master_rpc,
        mnemonic: cfg_1.default.bridge_word
    });
    await master_wallet.account.createAccount();
    return await await_to_js_1.default(master_wallet.commonTX.transfer(address, amount, asset));
}
class watcher {
    constructor() {
        this.psql_db = new db_1.default();
        this.utils = new utils_1.default();
        this.start();
    }
    async start() {
        this.asset2coin_loop();
        this.coin2asset_release_loop();
        this.coin2asset_burn_loop();
    }
    async asset2coin_loop() {
        const [err, pending_trade] = await await_to_js_1.default(this.psql_db.filter_bridge(['asset2coin', 'successful', 'pending']));
        console.log('err,pending_trade', err, pending_trade);
        if (pending_trade.length == 0) {
            console.log('[BRIDGE WATCHER] No pending trade');
            setTimeout(() => {
                this.asset2coin_loop.call(this);
            }, 2000);
            return;
        }
        const { id, address, amount, token_name } = pending_trade[0];
        const current_time = this.utils.get_current_time();
        const transfer_tokens = await this.psql_db.get_tokens([token_name]);
        const wallet = new asimov_wallet_1.AsimovWallet({
            name: cfg_1.default.bridge_address,
            rpc: cfg_1.default.asimov_child_rpc,
            mnemonic: cfg_1.default.bridge_word,
        });
        const [child_err, child_txid] = await await_to_js_1.default(wallet.contractCall.call(transfer_tokens[0].address, 'mint(address,uint256)', [address, number_precision_1.default.times(amount, 100000000)], asimov_wallet_1.AsimovConst.DEFAULT_GAS_LIMIT, 0, asimov_wallet_1.AsimovConst.DEFAULT_ASSET_ID, asimov_wallet_1.AsimovConst.DEFAULT_FEE_AMOUNT, asimov_wallet_1.AsimovConst.DEFAULT_ASSET_ID, asimov_wallet_1.AsimovConst.CONTRACT_TYPE.CALL));
        if (child_txid) {
            const info = [child_txid, 'successful', current_time, id];
            const [err3, result3] = await await_to_js_1.default(this.psql_db.update_asset2coin_bridge(info));
            if (err3)
                console.error(err3, result3);
        }
        else {
            console.error(`error happend in send coin`, child_err);
        }
        setTimeout(() => {
            this.asset2coin_loop.call(this);
        }, 1000 * 10);
    }
    async coin2asset_release_loop() {
        const [failed_err, failed_trade] = await await_to_js_1.default(this.psql_db.filter_bridge(['coin2asset', 'failed', 'successful']));
        if (failed_err)
            console.error('err,pending_trade', failed_err, failed_trade);
        if (failed_trade.length != 0) {
            const { id, address, amount, token_name } = failed_trade[0];
            const tokens = await this.psql_db.get_tokens([token_name]);
            const current_time = this.utils.get_current_time();
            const [master_err, master_txid] = await send_asset(address, tokens[0].asim_assetid, amount);
            if (master_txid) {
                const info = [master_txid, 'successful', current_time, id];
                const [err3, result3] = await await_to_js_1.default(this.psql_db.update_coin2asset_failed(info));
                if (err3)
                    console.error(err3, result3);
            }
            else {
                console.error(`the trade ${id} failed again`, master_err);
            }
        }
        const [err, pending_trade] = await await_to_js_1.default(this.psql_db.filter_bridge(['coin2asset', 'pending', 'successful']));
        if (err) {
            console.error(`release bridge happened error ${err}`);
        }
        if (pending_trade.length == 0) {
            console.log('have not need release bridge');
            setTimeout(() => {
                this.coin2asset_release_loop.call(this);
            }, 2000);
            return;
        }
        const { id, address, fee_amount, amount, token_name, child_txid, child_txid_status } = pending_trade[0];
        const tokens = await this.psql_db.get_tokens([token_name]);
        let [master_err, master_txid] = await send_asset(address, tokens[0].asim_assetid, amount);
        const master_txid_status = master_txid == null ? 'failed' : 'successful';
        if (master_err) {
            master_txid = null;
        }
        const current_time = this.utils.get_current_time();
        const info = [master_txid, master_txid_status, child_txid, child_txid_status, current_time, id];
        const [err3, result3] = await await_to_js_1.default(this.psql_db.update_coin2asset_bridge(info));
        if (err3)
            console.error(err3, result3, fee_amount);
        setTimeout(() => {
            this.coin2asset_release_loop.call(this);
        }, 1000 * 10);
    }
    async coin2asset_burn_loop() {
        const [err, pending_trade] = await await_to_js_1.default(this.psql_db.filter_bridge(['coin2asset', 'pending', 'pending']));
        if (err)
            console.error(err);
        if (pending_trade.length == 0) {
            console.log('[WATCHER] No pending burn bridge');
            setTimeout(() => {
                this.coin2asset_burn_loop.call(this);
            }, 2000);
            return;
        }
        const { id, address, fee_amount, amount, token_name } = pending_trade[0];
        const tokens = await this.psql_db.get_tokens([token_name]);
        const burn_amount = number_precision_1.default.plus(fee_amount, amount);
        const child_wallet = new asimov_wallet_1.AsimovWallet({
            name: cfg_1.default.bridge_address,
            rpc: cfg_1.default.asimov_child_rpc,
            mnemonic: cfg_1.default.bridge_word,
        });
        const [child_err, child_txid] = await await_to_js_1.default(child_wallet.contractCall.call(tokens[0].address, 'burn(address,uint256)', [address, number_precision_1.default.times(burn_amount, 100000000)], asimov_wallet_1.AsimovConst.DEFAULT_GAS_LIMIT, 0, asimov_wallet_1.AsimovConst.DEFAULT_ASSET_ID, asimov_wallet_1.AsimovConst.DEFAULT_FEE_AMOUNT, asimov_wallet_1.AsimovConst.DEFAULT_ASSET_ID, asimov_wallet_1.AsimovConst.CONTRACT_TYPE.CALL));
        if (child_err) {
            console.error(`error happend where burn ${address}'s erc20`);
            setTimeout(() => {
                this.coin2asset_burn_loop.call(this);
            }, 2000);
            return;
        }
        setTimeout(async () => {
            const [get_receipt_err, child_txid_status] = await await_to_js_1.default(this.utils.get_receipt_log(child_txid));
            if (get_receipt_err) {
                this.coin2asset_burn_loop.call(this);
                return;
            }
            const current_time = this.utils.get_current_time();
            if (child_txid_status == 'successful') {
                const [err3, result3] = await await_to_js_1.default(this.psql_db.update_coin2asset_bridge([null, 'pending', child_txid, 'successful', current_time, id]));
                if (err3)
                    console.error(err3, result3);
            }
            else {
                const [err3, result3] = await await_to_js_1.default(this.psql_db.update_coin2asset_bridge([null, 'failed', child_txid, 'failed', current_time, id]));
                if (err3)
                    console.error(err3, result3);
            }
            this.coin2asset_burn_loop.call(this);
        }, 1000 * 10);
    }
}
exports.default = new watcher();
//# sourceMappingURL=index.js.map