import client from '../adex/models/db'
import utils2 from '../adex/api/utils'

import { chain } from '../wallet/api/chain'
import to from 'await-to-js'

import NP from 'number-precision'

class Watcher {

	private db;
	private utils;

	constructor() {

		this.db = new client();
		this.utils = new utils2();
		this.start();
	}

	async start() {
		this.loop()
	}


	async loop() {

		const [transaction_err,transaction] = await to(this.db.get_pending_transactions())
		if(!transaction){
			console.error(transaction_err);
			setTimeout(() => {
                this.loop.call(this)
            }, 1000);
            return;
		}

		// 全部都是成功的,就睡眠1s
		if (transaction.length === 0) {
			console.log('[ADEX WATCHER]:no pending transaction');
			setTimeout(() => {
				this.loop.call(this)
			}, 1000);
			return;
		}
		const id = transaction[0].id;

		const [err, result] = await to(chain.getrawtransaction([transaction[0].transaction_hash, true, true], 'child_poa'))
		if(!result || !result.confirmations){
			 console.error(`getrawtransaction error=${err},result=${result}`);
             this.loop.call(this)
             return;
		}

		const update_time = this.utils.get_current_time();
		if (!err && result.confirmations >= 1) {
			const status = 'successful';
			const [get_receipt_err, contract_status] = await to(this.utils.get_receipt_log(transaction[0].transaction_hash));
			if (get_receipt_err) {
				console.error(`get_receipt_err ${get_receipt_err}`);
				this.loop.call(this)
				return;
			}
			const info = [status, update_time, id]
			const transaction_info = [status, contract_status, update_time, id]
			await this.db.update_transactions(transaction_info);
			await this.db.update_trades(info);

			const trades = await this.db.transactions_trades([id]);
			const updates = [];
			for (const index in trades) {
				if( !trades[index]) continue
				const trade_amount = +trades[index].amount;

				let index_taker;
				const taker_ar = updates.find( (elem, index_tmp)=> {
					index_taker = index_tmp;

					return elem.info[3] === trades[index].taker_order_id;
				});

				let index_maker;
				const maker_ar = updates.find( (elem, index_tmp)=> {
					index_maker = index_tmp;
					return elem.info[3] === trades[index].maker_order_id;
				});

				if (!taker_ar) {

					const update_taker = {
						info: [+trade_amount, -trade_amount, update_time, trades[index].taker_order_id]
					}
					updates.push(update_taker);
				} else {

					updates[index_taker].info[0] = NP.plus(updates[index_taker].info[0], trade_amount);
					updates[index_taker].info[1] = NP.minus(updates[index_taker].info[1], trade_amount);
				}


				if (!maker_ar) {
					const update_maker = {
						info: [+trade_amount, -trade_amount, update_time, trades[index].maker_order_id]
					}
					updates.push(update_maker);
				} else {
					updates[index_maker].info[0] = NP.plus(updates[index_maker].info[0], trade_amount);
					updates[index_maker].info[1] = NP.minus(updates[index_maker].info[1], trade_amount);
				}
			}

			await this.db.update_order_confirm(updates);

		} else if (err) {
			await this.db.update_transactions(['failed', undefined, update_time, id]);
			console.error('Err', err);

		} else {
			console.log('[Watcher Pending] %s hasn\'t been confirmed yet',transaction[0].transaction_hash);
			// 找不到txid，可能是链底层问题比如双花的块删掉了，也可能是tx刚入块还没确认
			setTimeout(() => {
                this.loop.call(this)
            }, 500);
            return;
		}

		this.loop.call(this)
	}
}

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
});

export default new Watcher();
