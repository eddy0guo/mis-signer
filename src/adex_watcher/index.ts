import DBClient from '../adex/models/db'
import Utils from '../adex/api/utils'

import to from 'await-to-js'

import NP from 'number-precision'
import { Health } from '../common/Health'

class Watcher {

    private db:DBClient;
    private utils:Utils;

    constructor() {
        this.db = new DBClient();
        this.utils = new Utils();
    }

    async start() {
        this.loop()
    }

    async loop() {

        const [transaction_err, transaction] = await to(this.db.get_pending_transactions())
        if (!transaction) {
            console.error('[ADEX WATCHER] transaction_err Error:',transaction_err);
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

        const updateTime = this.utils.get_current_time();
        const status = 'successful';
        const [get_receipt_err, contract_status] = await to(this.utils.get_receipt_log(transaction[0].transaction_hash));
        if (get_receipt_err) {
            console.error(`[ADEX Watcher Pending]:get_receipt_err ${get_receipt_err}`);

            setTimeout(() => {
                this.loop.call(this)
            }, 1000);
            return;

        } else if (contract_status === 'failed') {
            console.log(`[ADEX Watcher Pending] ${transaction[0].transaction_hash} contract execution log is null`);
        } else {
            console.log(`[ADEX Watcher Pending]::now ${updateTime} get_receipt_log %o contract status %o`, transaction[0], contract_status)
        }

        const info = [status, updateTime, id]
        const transaction_info = [status, contract_status, updateTime, id]
        await this.db.update_transactions(transaction_info);
        await this.db.update_trades(info);

        const trades = await this.db.transactions_trades([id]);
        const updates = [];

        for (const trade of trades) {
			this.updateElement(updates, trade, updateTime,'taker_order_id');
			this.updateElement(updates, trade, updateTime,'maker_order_id');
		}

        setImmediate(()=>{
            this.loop.call(this)
        })
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
    console.log('[ADEX WATCHER]:Unhandled Rejection at: Promise', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
});

const health = new Health();
health.start();

const watcher =  new Watcher();
watcher.start();