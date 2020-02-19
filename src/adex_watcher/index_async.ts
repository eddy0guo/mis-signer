import to from 'await-to-js';
import NP from 'number-precision';

import DBClient from '../adex/models/db';
import Utils from '../adex/api/utils';
import { chain } from '../wallet/api/chain';

class Watcher {
	private db;
	private utils;

	constructor() {
		this.db = new DBClient();
		this.utils = new Utils();
		this.start();
	}

	start(ms: number = 100):void {
		setTimeout(async () => {
			await this.loop();
		}, ms);
	}

	async loop():Promise<void> {
		const [transaction_err, transactions] = await to(
			this.db.get_pending_transactions()
		);
		if (!transactions || transaction_err) {
			console.error(transaction_err);
			this.start(1000);
			return;
		}

		// 全部都是成功的,就睡眠1s
		if (transactions.length <= 0) {
			console.log('[ADEX WATCHER]: No pending transaction. Sleep 1000s.');
			this.start(1000);
			return;
		}

		const tx = transactions[0];
		const [err, result] = await to(
			chain.getrawtransaction(
				[tx.transaction_hash, true, true],
				'child_poa'
			)
		);
		if (!result || !result.confirmations) {
			console.error(`[ADEX WATCHER]: getrawtransaction error=${err},result=${result}`);
			this.start();
			return;
		}

		const update_time = this.utils.get_current_time();
		if (!err && result.confirmations > 0) {
			await this.updateState(tx, update_time);
		} else if (err) {
			await this.db.update_transactions(['failed', undefined, update_time, tx.id]);
			console.error('Err', err);
		} else {
			console.log(
				`[ADEX WATCHER]:[Watcher Pending] %s hasn't been confirmed yet`,
				tx.transaction_hash
			);
			// 找不到txid，可能是链底层问题比如双花的块删掉了，也可能是tx刚入块还没确认
			this.start(500);
			return;
		}

		this.start();
	}

	async updateState(transaction, update_time):Promise<boolean> {
		const [get_receipt_err, contract_status] = await to(
			this.utils.get_receipt_log(transaction.transaction_hash)
		);
		if (get_receipt_err) {
			console.error(`[ADEX WATCHER]: get_receipt_err ${get_receipt_err}`);
			return false;
		}
		const id = transaction.id;
		const status = 'successful';
		const info = [status, update_time, id];
		const transaction_info = [status, contract_status, update_time, id];
		await this.db.update_transactions(transaction_info);
		await this.db.update_trades(info);

		const trades = await this.db.transactions_trades([id]);
		const updates = [];

		for (const trade of trades) {
			this.updateElement(updates, trade, update_time,'taker_order_id');
			this.updateElement(updates, trade, update_time,'maker_order_id');
		}

		await this.db.update_order_confirm(updates);
		return true;
	}

	updateElement(updates, trade, update_time, key_order_id):void {
		const trade_amount: number = +trade.amount;

		let item_index;
		const result_array = updates.find((element, temp_index) => {
			item_index = temp_index;
			return element.info[3] === trade[key_order_id];
		});

		if (!result_array) {
			const update_element = {
				info: [
					+trade_amount,
					-trade_amount,
					update_time,
					trade[key_order_id],
				],
			};
			updates.push(update_element);
		} else {
			const update_element = updates[item_index];
			update_element.info[0] = NP.plus(
				update_element.info[0],
				trade_amount
			);
			update_element.info[1] = NP.minus(
				update_element.info[1],
				trade_amount
			);
		}

	}
}
export default new Watcher();
