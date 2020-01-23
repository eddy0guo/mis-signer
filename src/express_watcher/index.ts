import to from 'await-to-js'
import Utils from '../adex/api/utils'
import DBClient from '../express/models/db'

import mist_config from '../cfg'
import { AsimovWallet } from '@fingo/asimov-wallet';


class Watcher {

    private db;
    private utils;

    constructor() {
        this.db = new DBClient();
        this.utils = new Utils();
        this.start();
    }

    async start() {
        this.loop();
    }

    async loop() {

        const [err, pendingTrade] = await to(this.db.laucher_pending_trade());
        if (err) console.error(err)
        if (!pendingTrade || pendingTrade.length <= 0) {

            console.log('[Express Watcher]No pending trade');
            setTimeout(() => {
                this.loop.call(this)
            }, 2000);

            return;
        }
        const { trade_id, address, quote_amount, quote_asset_name } = pendingTrade[0];
        const current_time = this.utils.get_current_time();

        const tokens = await this.db.get_tokens([quote_asset_name]);

        const wallet = new AsimovWallet({
            name: mist_config.fauct_address,
            rpc: mist_config.asimov_master_rpc,
            mnemonic: mist_config.fauct_word,
        });
        // todo:deal with erro
        const [quote_err, quote_txid] = await to(wallet.commonTX.transfer(address, quote_amount, tokens[0].asim_assetid));
        if (quote_err) console.error(quote_err)

        const quote_tx_status = quote_txid == undefined ? 'failed' : 'successful';

        const info = [quote_txid, quote_tx_status, current_time, trade_id];

        const [err3, result3] = await to(this.db.update_quote(info));
        if (err3) console.error(err3, result3)
        setTimeout(() => {
            this.loop.call(this)
            // 间隔时间随着用户量的增长而降低
        }, 1000 * 10);


    }

}
export default new Watcher();
