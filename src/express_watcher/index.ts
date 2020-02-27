import to from 'await-to-js'
import Utils from '../adex/api/utils'
import DBClient from '../express/models/db'

import mist_config from '../cfg'
import {AsimovWallet} from '@fingo/asimov-wallet';
import { Health } from 'src/common/Health';


class Watcher {

    private db;
    private utils;

    constructor() {
        this.db = new DBClient();
        this.utils = new Utils();
    }

    async start() {
        this.loop();
    }

    async loop() {

        const [err, pendingTrade]: [any, any] = await to(this.db.laucher_pending_trade());
        if (!pendingTrade) {

            console.log(`[Express Watcher]pendingTrade=${pendingTrade},error=${err}`);
            setTimeout(() => {
                this.loop.call(this)
            }, 2000);

            return;
        }

        if (pendingTrade.length <= 0) {

            console.log('[Express Watcher]No pending trade');
            setTimeout(() => {
                this.loop.call(this)
            }, 2000);

            return;
        }
        const {trade_id, address, quote_amount, quote_asset_name} = pendingTrade[0];
        const current_time = this.utils.get_current_time();

        const [tokens_err, tokens] = await to(this.db.get_tokens([quote_asset_name]));
        if (!tokens) {
            console.error('[Express Watcher] Token Err:', tokens_err, tokens);
            setTimeout(() => {
                this.loop.call(this)
            }, 2000);
            return;
        }

        const wallet = new AsimovWallet({
            name: mist_config.express_address,
            rpc: mist_config.asimov_master_rpc,
            mnemonic: mist_config.express_word,
        });
        const [quote_err, quote_txid] = await to(wallet.commonTX.transfer(address, quote_amount, tokens[0].asim_assetid));
        if (!quote_txid) {
            console.error('[Express Watcher] quote_err:', quote_err, quote_txid)
            setTimeout(() => {
                this.loop.call(this)
            }, 2000);
            return;
        }

        const quote_tx_status = !quote_txid ? 'failed' : 'successful';

        const info = [quote_txid, quote_tx_status, current_time, trade_id];

        const [err3, result3] = await to(this.db.update_quote(info));
        if (!result3) console.error('[Express Watcher] update_quote Error:', err3, result3)
        setTimeout(() => {
            this.loop.call(this)
            // 间隔时间随着用户量的增长而降低
        }, 1000 * 10);


    }

}

process.on('unhandledRejection', (reason, p) => {
    console.log('[Express Watcher]Unhandled Rejection at: Promise reason:', reason);
    // application specific logging, throwing an error, or other logic here
});

const health = new Health();
health.start();

const watcher = new Watcher();
watcher.start();
