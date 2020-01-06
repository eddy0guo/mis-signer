import to from 'await-to-js'
import utils1 from '../adex/api/utils'
import psql from '../adex/models/db'

import NP from 'number-precision'

import mist_config from '../cfg'
import {AsimovWallet, Transaction, AsimovConst} from '@fingo/asimov-wallet';

async function send_asset(address, asset, amount) {
    let master_wallet = new AsimovWallet({
        name: mist_config.bridge_address,
        rpc: mist_config.asimov_master_rpc,
        mnemonic: mist_config.bridge_word
    });


    await master_wallet.account.createAccount()
    return await to(master_wallet.commonTX.transfer(address, amount, asset))
}

class watcher {

    psql_db = new psql();
    utils = new utils1();

    constructor() {
        this.start()
    }

    async start() {
        this.asset2coin_loop();
        this.coin2asset_release_loop();
        this.coin2asset_burn_loop();
    }

    async asset2coin_loop() {

        let [err, pending_trade] = await to(this.psql_db.filter_bridge(['asset2coin', 'successful', 'pending']));
        console.log("err,pending_trade", err, pending_trade);
        if (pending_trade.length == 0) {

            console.log("have not pending trade");
            setTimeout(() => {
                this.asset2coin_loop.call(this)
            }, 2000);

            return;
        }
        let {id, address, amount, token_name} = pending_trade[0];
        let current_time = this.utils.get_current_time();
        let transfer_tokens = await this.psql_db.get_tokens([token_name])

        let wallet = new AsimovWallet({
            name: mist_config.bridge_address,
            rpc: mist_config.asimov_child_rpc,
            mnemonic: mist_config.bridge_word,
        });
        //TODO:deal error
        let [child_err, child_txid] = await to(wallet.contractCall.call(
            transfer_tokens[0].address,
            'mint(address,uint256)',
            [address, NP.times(amount, 100000000)],
            AsimovConst.DEFAULT_GAS_LIMIT, 0,
            AsimovConst.DEFAULT_ASSET_ID,
            AsimovConst.DEFAULT_FEE_AMOUNT,
            AsimovConst.DEFAULT_ASSET_ID,
            AsimovConst.CONTRACT_TYPE.CALL))
        if (child_txid) {
            let info = [child_txid, "successful", current_time, id];

            let [err3, result3] = await to(this.psql_db.update_asset2coin_bridge(info));
        } else {
            console.error(`error happend in send coin`)
        }
        setTimeout(() => {
            this.asset2coin_loop.call(this)
            //间隔时间随着用户量的增长而降低
        }, 1000 * 10);


    }

    async coin2asset_release_loop() {

        let [failed_err, failed_trade] = await to(this.psql_db.filter_bridge(['coin2asset', 'failed', 'successful']));
        console.log("err,pending_trade", failed_err, failed_trade);
        if (failed_trade.length != 0) {
            let {id, address, amount, token_name} = failed_trade[0];
            let tokens = await this.psql_db.get_tokens([token_name])

            let [master_err, master_txid] = await send_asset(address, tokens[0].asim_assetid, amount);
            if (master_txid) {
                let info = [master_txid, "successful", current_time, id];
                let [err3, result3] = await to(this.psql_db.update_coin2asset_failed(info));
            } else {
                console.error(`the trade ${id} failed again`)

            }


        }


        let [err, pending_trade] = await to(this.psql_db.filter_bridge(['coin2asset', 'pending', 'successful']));
        if (pending_trade.length == 0) {

            console.log("have not need release bridge");
            setTimeout(() => {
                this.coin2asset_release_loop.call(this)
            }, 2000);

            return;
        }


        let {id, address, fee_amount, amount, token_name, child_txid, child_txid_status} = pending_trade[0];
        let tokens = await this.psql_db.get_tokens([token_name])

        let [master_err, master_txid] = await send_asset(address, tokens[0].asim_assetid, amount);
        let master_txid_status = master_txid == null ? "failed" : "successful";

        if (master_err) {
            master_txid = null;
        }

        let current_time = this.utils.get_current_time();

        let info = [master_txid, master_txid_status, child_txid, child_txid_status, current_time, id];
        let [err3, result3] = await to(this.psql_db.update_coin2asset_bridge(info));

        setTimeout(() => {
            this.coin2asset_release_loop.call(this)
        }, 1000 * 10);


    }

    async coin2asset_burn_loop() {


        let [err, pending_trade] = await to(this.psql_db.filter_bridge(['coin2asset', 'pending', 'pending']));
        if (pending_trade.length == 0) {

            console.log("have not pending burn bridge");
            setTimeout(() => {
                this.coin2asset_burn_loop.call(this)
            }, 2000);

            return;
        }

        let {id, address, fee_amount, amount, token_name} = pending_trade[0];
        let tokens = await this.psql_db.get_tokens([token_name])
        let burn_amount = NP.plus(fee_amount, amount);


        let child_wallet = new AsimovWallet({
            name: mist_config.bridge_address,
            rpc: mist_config.asimov_child_rpc,
            mnemonic: mist_config.bridge_word,
        });

        let [child_err, child_txid] = await to(child_wallet.contractCall.call(
            tokens[0].address,
            'burn(address,uint256)',
            [address, NP.times(burn_amount, 100000000)],
            AsimovConst.DEFAULT_GAS_LIMIT, 0,
            AsimovConst.DEFAULT_ASSET_ID,
            AsimovConst.DEFAULT_FEE_AMOUNT,
            AsimovConst.DEFAULT_ASSET_ID,
            AsimovConst.CONTRACT_TYPE.CALL))

        if (child_err) {
            //todo:
            console.error(`error happend where burn ${address}'s erc20`);
            setTimeout(() => {
                this.coin2asset_burn_loop.call(this)
            }, 2000);

            return
        }
        setTimeout(async () => {
            let [get_receipt_err, child_txid_status] = await to(this.utils.get_receipt_log(child_txid));
            if (get_receipt_err) {
                this.coin2asset_burn_loop.call(this)
                return;
            }
            let current_time = this.utils.get_current_time();
            if (child_txid_status == "successful") {
                let [err3, result3] = await to(this.psql_db.update_coin2asset_bridge([null, "pending", child_txid, "successful", current_time, id]));
            } else {
                let [err3, result3] = await to(this.psql_db.update_coin2asset_bridge([null, "failed", child_txid, "failed", current_time, id]));
            }
            this.coin2asset_burn_loop.call(this)
        }, 1000 * 10);


    }

};
export default new watcher();
