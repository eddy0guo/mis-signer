import to from 'await-to-js';
import NP from 'number-precision';

import DBClient from '../adex/models/db';
import Utils from '../adex/api/utils';
import { chain } from '../wallet/api/chain';

class Watcher {
	private db:DBClient;
	private utils:Utils;

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
		const [transactionErr, transactions] = await to(
			this.db.get_pending_transactions()
		);
		if (!transactions || transactionErr) {
			console.error(transactionErr);
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

		const updateTime = this.utils.get_current_time();
		if (!err && result.confirmations > 0) {
			await this.updateState(tx, updateTime);
		} else if (err) {
			await this.db.update_transactions(['failed', undefined, updateTime, tx.id]);
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

	async updateState(transaction, updateTime):Promise<boolean> {
		const [get_receipt_err, contract_status] = await to(
			this.utils.get_receipt_log(transaction.transaction_hash)
		);
		if (get_receipt_err) {
			console.error(`[ADEX WATCHER]: get_receipt_err ${get_receipt_err}`);
			return false;
		}
		const id = transaction.id;
		const status = 'successful';
		const info = [status, updateTime, id];
		const transaction_info = [status, contract_status, updateTime, id];
		await this.db.update_transactions(transaction_info);
		await this.db.update_trades(info);

		const trades = await this.db.transactions_trades([id]);
		const updates = [];

		for (const trade of trades) {
			this.updateElement(updates, trade, updateTime,'taker_order_id');
			this.updateElement(updates, trade, updateTime,'maker_order_id');
		}

		await this.db.update_order_confirm(updates);
		return true;
	}

	updateElement(updates, trade, updateTime, orderIdKey):void {
		const tradeAmount: number = +trade.amount;

		let itemIndex;
		const resultArray = updates.find((element, temp_index) => {
			itemIndex = temp_index;
			return element.info[3] === trade[orderIdKey];
		});

		if (!resultArray) {
			const updateElement = {
				info: [
					+tradeAmount,
					-tradeAmount,
					updateTime,
					trade[orderIdKey],
				],
			};
			updates.push(updateElement);
		} else {
			const updateElement = updates[itemIndex];
			updateElement.info[0] = NP.plus(
				updateElement.info[0],
				tradeAmount
			);
			updateElement.info[1] = NP.minus(
				updateElement.info[1],
				tradeAmount
			);
		}

	}
}

process.on('unhandledRejection', (reason, p) => {
    console.log('[ADEX WATCHER] Unhandled Rejection at: Promise', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
});

export default new Watcher();
