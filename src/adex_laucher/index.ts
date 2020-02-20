import to from 'await-to-js'
import NP from 'number-precision'

import Exchange from './Exchange'

import client from '../adex/models/db'
import utils2 from '../adex/api/utils'
import mist_config from '../cfg'
import { chain } from '../wallet/api/chain'

class launcher {
    private db;
    private utils;
    private block_height;
    private tmp_transaction_id;

    constructor() {
        this.db = new client();
        this.utils = new utils2();
        this.block_height = 0;
        this.start();
    }

	start(ms: number = 100):void {
		setTimeout(async () => {
			await this.loop();
		}, ms);
	}

    async loop():Promise<void> {
        const [bestblock_err, bestblock_result] = await to(chain.getbestblock());
        if (bestblock_err || !bestblock_result || !bestblock_result.height || bestblock_result.height === this.block_height) {
			if(bestblock_result && bestblock_result.height){
           		 console.log(`[ADEX LAUNCHER] current height is ${bestblock_result.height} and last is ${this.block_height}`);
			}else{
           		 console.log(`[ADEX LAUNCHER] ${bestblock_err}`);
			}
            setTimeout(() => {
                this.loop.call(this)
            }, 500);
            return
        }

        const [trades_err,trades] = await to(this.db.get_laucher_trades());
		if(!trades){
			console.error(trades_err,trades);
			return;
		}

        const current_time = this.utils.get_current_time();
        if (trades.length === 0) {
            console.log('[Launcher] No matched trades')
            setTimeout(() => {
                this.loop.call(this)
            }, 1000);
            return
        }

        // 只要进入laucher阶段就先把状态设置为pending，防止engine那边在laucher的时候，继续在当前transaction_id里继续插数据
        this.tmp_transaction_id = trades[0].transaction_id;

        const update_trade_info = ['pending', undefined, current_time, trades[0].transaction_id];
        await this.db.launch_update_trades(update_trade_info);
        // 准备laucher之前先延时2秒
        setTimeout(async () => {
            const [tx_trades_err,tx_trades] = await to(this.db.transactions_trades([this.tmp_transaction_id]));
			if(!tx_trades || tx_trades_err){
				console.error('[ADEX LAUNCHER]::(transactions_trades):',tx_trades_err,tx_trades);
				this.loop.call(this);
				return;
			}
            const index = tx_trades[0].transaction_id % 3;
            const trades_hash = [];
            const [markets_err,markets] = await to(this.db.list_online_markets());
			if(!markets){
				console.error('[ADEX LAUNCHER]::(list_online_markets):',markets_err,markets);
				this.loop.call(this);
				return;
			}
            for (const i in tx_trades) {
                if( !tx_trades[i])continue
                let token_address;
                for (const j in markets) {
                    if (tx_trades[i].market_id === markets[j].id) {
                        token_address = markets[j];
                    }
                }

                if (!token_address) {
                    console.error('not support market id');
                    continue;
                }

				const base_amount = Math.round(NP.times(+tx_trades[i].amount, 100000000));
				const quote_amount = Math.round(NP.times(+tx_trades[i].amount, +tx_trades[i].price, 100000000));

                const trade_info = {
                    trade_hash: tx_trades[i].trade_hash,
                    taker: tx_trades[i].taker,
                    maker: tx_trades[i].maker,
                    base_token_address: token_address.base_token_address,
                    quote_token_address: token_address.quote_token_address,
                    relayer: mist_config.relayers[index].address,
                    base_token_amount: base_amount,
                    quote_token_amount: quote_amount,
                    r: null,
                    s: null,
                    side: tx_trades[i].taker_side,
                    v: null
                };
                trades_hash.push(trade_info);
            }

            const mist = new Exchange(mist_config.ex_address);
            const [err, txid] = await to(mist.matchorder(trades_hash, mist_config.relayers[index].prikey, mist_config.relayers[index].word));
			const [bestblock_err2, bestblock_result2] = await to(chain.getbestblock());
			if (!txid || !bestblock_result2) {
				// console.log(trades_hash);
				console.error('[ADEX LAUNCHER]::(matchorder):',err,txid);
				console.error('[ADEX LAUNCHER]::(getbestblock)',bestblock_err2,bestblock_result2);
				this.loop.call(this);
				return;
			}

			if(!bestblock_result2.height){
				console.error('bestblock height is null');
				return;
			}
			this.block_height = bestblock_result2.height;

            if (!err) {
                const updatedInfo = ['pending', txid, current_time, trades[0].transaction_id];
                await this.db.launch_update_trades(updatedInfo);

                const TXinfo = [trades[0].transaction_id, txid, trades[0].market_id, 'pending', 'pending', current_time, current_time];
                this.db.insert_transactions(TXinfo);
            } else {
                const errInfo = ['matched', null , current_time, trades[0].transaction_id];
                await this.db.launch_update_trades(errInfo);
                console.log('[ADEX LAUNCHER] call dex matchorder err=%o transaction_id=%o relayers=%o\n', err, trades[0].transaction_id, mist_config.relayers[index].address)
            }

            this.loop.call(this)

        }, 2000);

    }


}

export default new launcher()
