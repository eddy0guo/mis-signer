import to from 'await-to-js'
import Utils from '../adex/api/utils'
import DBClient from '../adex/models/db'

import NP from 'number-precision'

import mist_config, {BullOption} from '../cfg'
import { AsimovWallet, AsimovConst } from '@fingo/asimov-wallet';
import { Health } from '../common/Health'
import * as redis from 'redis';

async function send_asset(address, asset, amount) {
    const master_wallet = new AsimovWallet({
        name: mist_config.bridge_address,
        rpc: mist_config.asimov_master_rpc,
        mnemonic: mist_config.bridge_word
    });

    return await to(master_wallet.commonTX.transfer(address, amount, asset))
}

/**
 * Asset and Token Convert wathcer
 *
 */
class Watcher {
    // FIXME: db reconnect when error
    private dbClient:DBClient;
    private utils:Utils;
    private redisClient;
    constructor() {
        this.dbClient = new DBClient();
        this.utils = new Utils();
    }

    async start() {
        if (typeof BullOption.redis !== 'string') {
            this.redisClient = redis.createClient(BullOption.redis.port, BullOption.redis.host);
            this.redisClient.auth(BullOption.redis.password);
        }
        this.asset2coin_loop();
        this.asset2coin_decode_loop();
        this.coin2asset_release_loop();
        this.coin2asset_burn_loop();
    }

	async asset2coin_decode_loop(){
		const [pending_decode_err,pendingDecodeArray] = await to(this.dbClient.get_pending_decode_bridge());
		if(pending_decode_err || !pendingDecodeArray || pendingDecodeArray.length <= 0){
			console.error('[ADEX BRIDGER]::(get_pending_decode_bridge):have no trades need to be decoded');
			setTimeout(() => {
				this.asset2coin_decode_loop.call(this)
			}, 1000 * 2);
			return;
		}

		let master_txid_status = 'successful';
        const current_time = this.utils.get_current_time();
        const pendingDecodeItem = pendingDecodeArray[0];

		const [decode_err, decode_info]:[Error,any] = await to(this.utils.decode_transfer_info(pendingDecodeItem.master_txid));
		if (decode_err || !decode_info) {
            console.error('[BDIGER WATCHER]:(decode_transfer_info):',decode_err)
            console.log('[BDIGER WATCHER]: pendingDecodeArray = ',pendingDecodeArray)
			// FIXME:根据error内容判断是外部服务rpc问题还是交易本身的问题
			if(!decode_err.message.includes('asimov_getRawTransaction failed')){
				const updated = [null,null,null,'illegaled','pending',null,null,current_time,pendingDecodeItem.id];
				const [update_err,update_result] = await to(this.dbClient.update_asset2coin_decode(updated));
				if(update_err) console.error('[ADEX BRIDGER]::(update_asset2coin_decode):',update_err);
			}

			setTimeout(() => {
				this.asset2coin_decode_loop.call(this)
			}, 1000 * 2);
			return;

		};
		const {
			from,
			asset_id,
			vin_amount,
			to_amount,
			remain_amount,
			fee_amount,
			fee_asset,
		} = decode_info;


		if (decode_info.to !== mist_config.bridge_address) {
			master_txid_status = 'illegaled';
			console.error(`reciver ${decode_info.to}  is not official address`);
		}

		const transfer_tokens = await this.dbClient.get_tokens([asset_id]);
		const fee_tokens = await this.dbClient.get_tokens([fee_asset]);

		const update_info = {
			address: from,
			token_name: transfer_tokens[0].symbol,
			amount: to_amount,
			master_txid_status,
			child_txid_status: 'pending',
			fee_asset: fee_tokens[0].symbol,
			fee_amount,
			updated_at: current_time,
			id: pendingDecodeItem.id,
		};
		const update_info_arr = this.utils.arr_values(update_info);
		const [err4, result4] = await to(
			this.dbClient.update_asset2coin_decode(update_info_arr)
		);
		if (err4) console.log('dbClient.update_asset2coin_decode', err4, result4);
        this.asset2coin_decode_loop.call(this)
	}

    async asset2coin_loop() {

        const [err, pending_trade]: [any,any] = await to(this.dbClient.filter_bridge(['asset2coin', 'successful', 'pending']));
		if(!pending_trade){
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
        const [transfer_tokens_err,transfer_tokens] = await to(this.dbClient.get_tokens([token_name]));
		if(!transfer_tokens){
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
            [address, Math.round((NP.times(amount, 100000000)))],
            AsimovConst.DEFAULT_GAS_LIMIT, 0,
            AsimovConst.DEFAULT_ASSET_ID,
            AsimovConst.DEFAULT_FEE_AMOUNT,
            AsimovConst.DEFAULT_ASSET_ID,
            AsimovConst.CONTRACT_TYPE.CALL))
        if (child_txid) {
            const info = [child_txid, 'successful', current_time, id];
            const [err3, result3] = await to(this.dbClient.update_asset2coin_bridge(info));
            if (err3) {
                console.error(err3, result3)
                return ;
            }else{
                // tslint:disable-next-line:no-shadowed-variable
               this.redisClient.hget(address,token_name, async (err, value) => {
                   console.log(value); // > "bar"
                   await this.redisClient.HMSET(address, token_name, NP.plus(value,amount));
               });
            }
        } else {
            console.error(`error happend in send coin`, child_err)
        }
        setTimeout(() => {
            this.asset2coin_loop.call(this)
            // 间隔时间随着用户量的增长而降低
        }, 1000 * 10);


    }

    async coin2asset_release_loop() {

        const [failed_err, failed_trade]: [any,any] = await to(this.dbClient.filter_bridge(['coin2asset', 'failed', 'successful']));
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
            const [ tokens_err, tokenAry ] = await to(this.dbClient.get_tokens([token_name]));
			if(tokens_err){
				console.log(tokens_err);
				setTimeout(() => {
					this.coin2asset_release_loop.call(this)
				}, 2000);
				return;

			}
            const currentTime = this.utils.get_current_time();
            const [masterErr, masterTxid] = await send_asset(address, tokenAry[0].asim_assetid, amount);
            await this.dbClient.begin()
            if (masterTxid) {
                const update_info = [masterTxid, 'successful', currentTime, id];
                const [updateFailedErr, updateFailedRes] = await to(this.dbClient.update_coin2asset_failed(update_info));
                if (!updateFailedRes) {
                    await this.dbClient.rollback();
                    this.coin2asset_release_loop.call(this);
                    return ;
                }
            } else {
                console.error(`the trade ${id} failed again`, masterErr)
			}
        }

        const [err, pending_trade]: [any,any] = await to(this.dbClient.filter_bridge(['coin2asset', 'pending', 'successful']));
        if (err) {
            console.error(`release bridge happened error ${err}`);
            setTimeout(() => {
                this.coin2asset_release_loop.call(this)
            }, 2000);

            return;
        }
        if (pending_trade?.length === 0 || pending_trade === null || pending_trade === undefined ) {

            console.log('have not need release bridge');
            setTimeout(() => {
                this.coin2asset_release_loop.call(this)
            }, 2000);

            return;
        }


        const { id, address, fee_amount, amount, token_name, child_txid, child_txid_status } = pending_trade[0];
        const tokens = await this.dbClient.get_tokens([token_name]);

        let [master_err, master_txid] = await send_asset(address, tokens[0].asim_assetid, amount);
        const master_txid_status = master_txid === null ? 'failed' : 'successful';

        if (master_err) {
            master_err = null;
            master_txid = null;
        }

        const current_time = this.utils.get_current_time();

        const info = [master_txid, master_txid_status, child_txid, child_txid_status, current_time, id];
        const [updateBridgeErr, updateBridgeRes] = await to(this.dbClient.update_coin2asset_bridge(info));
        if (!updateBridgeRes){
            console.error(updateBridgeErr, updateBridgeRes, fee_amount);
            await this.dbClient.rollback();
            this.coin2asset_release_loop.call(this)
            return ;
        }
        await this.dbClient.commit();
        setTimeout(() => {
            this.coin2asset_release_loop.call(this)
        }, 1000 * 10);


    }

    async coin2asset_burn_loop() {


        const [err, pending_trade]: [any,any] = await to(this.dbClient.filter_bridge(['coin2asset', 'pending', 'pending']));
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
        const [tokens_err,tokens] = await to(this.dbClient.get_tokens([token_name]));
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
            [address, Math.round(NP.times(burn_amount, 100000000))],
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
        // tslint:disable-next-line:no-shadowed-variable
        this.redisClient.hget(address,token_name, async (err, value) => {
            console.log(value); // > "bar"
            await this.redisClient.HMSET(address, token_name, NP.minus(value,burn_amount));
        });
        setTimeout(async () => {
            const [get_receipt_err, child_txid_status] = await to(this.utils.get_receipt_log(child_txid));
            if (get_receipt_err) {
                this.coin2asset_burn_loop.call(this)
                return;
            }
            const current_time = this.utils.get_current_time();
            if (child_txid_status === 'successful') {
                const [err3, result3] = await to(this.dbClient.update_coin2asset_bridge([null, 'pending', child_txid, 'successful', current_time, id]));
                if (err3) console.error(err3, result3)
            } else {
                const [err3, result3] = await to(this.dbClient.update_coin2asset_bridge([null, 'failed', child_txid, 'failed', current_time, id]));
                if (err3) console.error(err3, result3)
            }
            this.coin2asset_burn_loop.call(this)
        }, 1000 * 10);


    }

}

process.on('unhandledRejection', (reason, p) => {
    console.log('[Bridge Watcher] Unhandled Rejection at: Promise,reason:', reason);
    // application specific logging, throwing an error, or other logic here
});

const health = new Health();
health.start();

const watcher = new Watcher();
watcher.start();
