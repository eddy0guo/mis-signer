"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../models/db");
const utils_1 = require("../api/utils");
const mist_wallet_1 = require("../api/mist_wallet");
const cfg_1 = require("../../cfg");
const number_precision_1 = require("number-precision");
const asimov_wallet_1 = require("@fingo/asimov-wallet");
class assets {
    constructor() {
        this.db = new db_1.default();
        this.utils = new utils_1.default;
        this.mist_wallet = new mist_wallet_1.default();
        this.times = 0;
        this.exchange;
        this.root_hash;
    }
    async status_flushing() {
        this.loop();
    }
    async loop() {
        const update_time = this.utils.get_current_time();
        const token_arr = await this.mist_wallet.list_tokens();
        token_arr.splice(1, 1);
        const assets_info = [];
        for (const i in token_arr) {
            if (token_arr[i].symbol != 'ASIM') {
                const wallet = new asimov_wallet_1.AsimovWallet({
                    name: 'test',
                    rpc: cfg_1.default.asimov_master_rpc,
                    address: '0x66381fed979566a0656a3b422706072915a452ba6b'
                });
                const index = +token_arr[i].asim_assetid % 100000;
                const balance = await wallet.contractCall.callReadOnly(token_arr[i].asim_address, 'totalSupply(uint32)', [index]);
                const total_balance = number_precision_1.default.divide(+balance, 100000000);
                console.log('balance------', balance);
                this.db.update_assets_total([total_balance, update_time, token_arr[i].symbol]);
                const asset_info = {
                    symbol: token_arr[i].symbol,
                    total: total_balance
                };
                assets_info.push(asset_info);
            }
        }
        if (this.times == 1 * 60) {
            for (const asset of assets_info)
                this.db.update_assets_yesterday_total([asset.total, update_time, asset.symbol]);
            this.times = 0;
        }
        this.times++;
        setTimeout(() => {
            this.loop.call(this);
        }, 1000 * 60);
    }
}
exports.default = assets;
//# sourceMappingURL=asset_info.js.map