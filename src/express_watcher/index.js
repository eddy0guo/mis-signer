import to from 'await-to-js'
import utils1 from '../adex/api/utils'
import psql from '../express/models/db'

import mist_config from '../cfg'
import { AsimovWallet } from '@fingo/asimov-wallet';


class watcher {

    constructor() {
        this.psql_db = new psql();
        this.utils = new utils1();
        this.start();
    }

    async start() {
        this.loop();
    }

    async loop() {

        let [err, pending_trade] = await to(this.psql_db.laucher_pending_trade());
        if (err) console.error(err)
        if (!pending_trade || pending_trade.length == 0) {

            console.log("[Express Watcher]No pending trade");
            setTimeout(() => {
                this.loop.call(this)
            }, 2000);

            return;
        }
        let { trade_id, address, quote_amount, quote_asset_name } = pending_trade[0];
        let current_time = this.utils.get_current_time();

        let tokens = await this.psql_db.get_tokens([quote_asset_name]);

        const wallet = new AsimovWallet({
            name: mist_config.fauct_address,
            rpc: mist_config.asimov_master_rpc,
            mnemonic: mist_config.fauct_word,
        });
        //todo:deal with erro
        let [quote_err, quote_txid] = await to(wallet.commonTX.transfer(address, quote_amount, tokens[0].asim_assetid));
        if (quote_err) console.error(quote_err)

        let quote_tx_status = quote_txid == undefined ? "failed" : "successful";

        let info = [quote_txid, quote_tx_status, current_time, trade_id];

        let [err3, result3] = await to(this.psql_db.update_quote(info));
        if (err3) console.error(err3, result3)
        setTimeout(() => {
            this.loop.call(this)
            //间隔时间随着用户量的增长而降低
        }, 1000 * 10);


    }

}
export default new watcher();
