import to from 'await-to-js'
import utils1 from '../adex/api/utils'
import psql from '../adex/models/db'

import NP from 'number-precision'

import mist_config from '../cfg'
import { AsimovWallet, AsimovConst } from '@fingo/asimov-wallet';

async function send_asset(address, asset, amount) {
    const master_wallet = new AsimovWallet({
        name: mist_config.bridge_address,
        rpc: mist_config.asimov_master_rpc,
        mnemonic: mist_config.bridge_word
    });

    return await to(master_wallet.commonTX.transfer(address, amount, asset))
}

class watcher {
    private psql_db;
    private utils;
    constructor() {
        this.psql_db = new psql();
        this.utils = new utils1();
        this.start()
    }

    async start() {
        this.asset2coin_loop();
        this.coin2asset_release_loop();
        this.coin2asset_burn_loop();
    }

    async asset2coin_loop() {

        const [err, pending_trade]: [any,any] = await to(this.psql_db.filter_bridge(['asset2coin', 'successful', 'pending']));
		if(err){
			console.log(err);
			  setTimeout(() => {
                this.asset2coin_loop.call(this)
            }, 2000);
            return;
		}

        if (pending_trade.length === 0) {
            console.log('[BRIDGE WATCHER] No pending trade');
            setTimeout(() => {
                this.asset2coin_loop.call(this)
            }, 2000);

            return;
        }
        const { id, address, amount, token_name } = pending_trade[0];
        const current_time = this.utils.get_current_time();
        const [transfer_tokens_err,transfer_tokens] = await to(this.psql_db.get_tokens([token_name]));
		if(transfer_tokens_err){
			console.error(transfer_tokens_err);
			setTimeout(() => {
                this.asset2coin_loop.call(this)
            }, 2000);
            return;
		}

        const wallet = new AsimovWallet({
            name: mist_config.bridge_address,
            rpc: mist_config.asimov_child_rpc,
            mnemonic: mist_config.bridge_word,
        });

        const [child_err, child_txid] = await to(wallet.contractCall.call(
            transfer_tokens[0].address,
            'mint(address,uint256)',
            [address, NP.times(amount, 100000000)],
            AsimovConst.DEFAULT_GAS_LIMIT, 0,
            AsimovConst.DEFAULT_ASSET_ID,
            AsimovConst.DEFAULT_FEE_AMOUNT,
            AsimovConst.DEFAULT_ASSET_ID,
            AsimovConst.CONTRACT_TYPE.CALL))
        if (child_txid) {
            const info = [child_txid, 'successful', current_time, id];
            const [err3, result3] = await to(this.psql_db.update_asset2coin_bridge(info));
            if (err3) console.error(err3, result3)
        } else {
            console.error(`error happend in send coin`, child_err)
        }
        setTimeout(() => {
            this.asset2coin_loop.call(this)
            // 间隔时间随着用户量的增长而降低
        }, 1000 * 10);


    }

    async coin2asset_release_loop() {

        const [failed_err, failed_trade]: [any,any] = await to(this.psql_db.filter_bridge(['coin2asset', 'failed', 'successful']));
        if(failed_err){
			console.error('err,pending_trade', failed_err, failed_trade);
			setTimeout(() => {
                this.coin2asset_release_loop.call(this)
            }, 2000);
            return;
		}
        if (failed_trade.length > 0) {
            // tslint:disable-next-line: no-shadowed-variable
            const { id, address, amount, token_name } = failed_trade[0];
            const [ tokens_err, tokenAry ] = await to(this.psql_db.get_tokens([token_name]));
			if(tokens_err){
				console.log(tokens_err);
				setTimeout(() => {
					this.coin2asset_release_loop.call(this)
				}, 2000);
				return;

			}
            const currentTime = this.utils.get_current_time();
            const [masterErr, masterTxid] = await send_asset(address, tokenAry[0].asim_assetid, amount);
            if (masterTxid) {
                const update_info = [masterTxid, 'successful', currentTime, id];
                const [err4, result4] = await to(this.psql_db.update_coin2asset_failed(update_info));
                if (err4) console.error(err4, result4)
            } else {
                console.error(`the trade ${id} failed again`, masterErr)
			}
        }

        const [err, pending_trade]: [any,any] = await to(this.psql_db.filter_bridge(['coin2asset', 'pending', 'successful']));
        if (err) {
            console.error(`release bridge happened error ${err}`);
            setTimeout(() => {
                this.coin2asset_release_loop.call(this)
            }, 2000);

            return;
        }
        if (pending_trade.length === 0) {

            console.log('have not need release bridge');
            setTimeout(() => {
                this.coin2asset_release_loop.call(this)
            }, 2000);

            return;
        }


        const { id, address, fee_amount, amount, token_name, child_txid, child_txid_status } = pending_trade[0];
        const tokens = await this.psql_db.get_tokens([token_name])

        let [master_err, master_txid] = await send_asset(address, tokens[0].asim_assetid, amount);
        const master_txid_status = master_txid === null ? 'failed' : 'successful';

        if (master_err) {
            master_err = null;
            master_txid = null;
        }

        const current_time = this.utils.get_current_time();

        const info = [master_txid, master_txid_status, child_txid, child_txid_status, current_time, id];
        const [err3, result3] = await to(this.psql_db.update_coin2asset_bridge(info));
        if (err3) console.error(err3, result3, fee_amount)

        setTimeout(() => {
            this.coin2asset_release_loop.call(this)
        }, 1000 * 10);


    }

    async coin2asset_burn_loop() {


        const [err, pending_trade]: [any,any] = await to(this.psql_db.filter_bridge(['coin2asset', 'pending', 'pending']));
        if (err) {
			console.error(err)
			setTimeout(() => {
                this.coin2asset_burn_loop.call(this)
            }, 2000);
            return;
		}

        if (pending_trade.length === 0) {

            console.log('[WATCHER] No pending burn bridge');
            setTimeout(() => {
                this.coin2asset_burn_loop.call(this)
            }, 2000);

            return;
        }

        const { id, address, fee_amount, amount, token_name } = pending_trade[0];
        const [tokens_err,tokens] = await to(this.psql_db.get_tokens([token_name]));
		if(tokens_err){
			console.log(tokens_err);
            setTimeout(() => {
                this.coin2asset_burn_loop.call(this)
            }, 2000);

			return;
		}
        const burn_amount = NP.plus(fee_amount, amount);


        const child_wallet = new AsimovWallet({
            name: mist_config.bridge_address,
            rpc: mist_config.asimov_child_rpc,
            mnemonic: mist_config.bridge_word,
        });

        const [child_err, child_txid] = await to(child_wallet.contractCall.call(
            tokens[0].address,
            'burn(address,uint256)',
            [address, NP.times(burn_amount, 100000000)],
            AsimovConst.DEFAULT_GAS_LIMIT, 0,
            AsimovConst.DEFAULT_ASSET_ID,
            AsimovConst.DEFAULT_FEE_AMOUNT,
            AsimovConst.DEFAULT_ASSET_ID,
            AsimovConst.CONTRACT_TYPE.CALL))

        if (child_err) {
            console.error(`error happend where burn ${address}'s erc20`);
            setTimeout(() => {
                this.coin2asset_burn_loop.call(this)
            }, 2000);

            return
        }
        setTimeout(async () => {
            const [get_receipt_err, child_txid_status] = await to(this.utils.get_receipt_log(child_txid));
            if (get_receipt_err) {
                this.coin2asset_burn_loop.call(this)
                return;
            }
            const current_time = this.utils.get_current_time();
            if (child_txid_status === 'successful') {
                const [err3, result3] = await to(this.psql_db.update_coin2asset_bridge([null, 'pending', child_txid, 'successful', current_time, id]));
                if (err3) console.error(err3, result3)
            } else {
                const [err3, result3] = await to(this.psql_db.update_coin2asset_bridge([null, 'failed', child_txid, 'failed', current_time, id]));
                if (err3) console.error(err3, result3)
            }
            this.coin2asset_burn_loop.call(this)
        }, 1000 * 10);


    }

}

export default new watcher();
