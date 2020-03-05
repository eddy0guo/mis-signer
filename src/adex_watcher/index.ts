import DBClient from '../adex/models/db'
import Utils from '../adex/api/utils'

import to from 'await-to-js'

import NP from 'number-precision'
import {Health} from '../common/Health'

class Watcher {

    private db: DBClient;
    private utils: Utils;
    private getReceiptTimes: number;

    constructor() {
        this.db = new DBClient();
        this.utils = new Utils();
        this.getReceiptTimes = 0;
    }

    async start() {
        this.loop()
    }

    async loop() {

        const [transaction_err, transaction] = await to(this.db.get_pending_transactions())
        if (!transaction) {
            console.error('[ADEX WATCHER] transaction_err Error:', transaction_err);
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
        let status = 'successful';

        const updateTime = this.utils.get_current_time();
        const [get_receipt_err, contract_status] = await to(this.utils.get_receipt_log(transaction[0].transaction_hash));
        if (get_receipt_err && this.getReceiptTimes <= 120) {
            console.error(`[ADEX Watcher Pending]:get_receipt_err ${get_receipt_err},It's been retried ${this.getReceiptTimes} times`);
            setTimeout(() => {
                this.getReceiptTimes++;
                this.loop.call(this)
            }, 1000);
            return;

        } else if (get_receipt_err && this.getReceiptTimes > 120) {
            status = 'failed';
            console.error(`[ADEX Watcher Pending]:get_receipt_log failed,It's been retried ${this.getReceiptTimes} times,please check  block chain `);
        } else if (contract_status === 'failed') {
            console.log(`[ADEX Watcher Pending] ${transaction[0].transaction_hash} contract execution log is null`);
        } else {
            console.log(`[ADEX Watcher Pending]::now ${updateTime} get_receipt_log %o contract status %o`, transaction[0], contract_status)
        }

        this.getReceiptTimes = 0;
        await this.updateDB(status, contract_status, updateTime, id);

        setImmediate(() => {
            this.loop.call(this)
        })
    }

    async updateDB(status, contract_status, updateTime, id): Promise<void> {
        const info = [status, updateTime, id];
        const transaction_info = [status, contract_status, updateTime, id];
        await this.db.begin();

        const [updateTransactionsErr, updateTransactionsResult] = await to(this.db.update_transactions(transaction_info));
        if(!updateTransactionsResult) {
            await this.db.rollback();
            return;
        }
        const [updateTradesErr,updateTradesResult] = await to(this.db.update_trades(info));
        if(!updateTradesResult) {
            await this.db.rollback();
            return;
        }


        const trades = await this.db.transactions_trades([id]);
        for (const trade of trades) {
            let updates = [];
            updates = this.updateElement(updates, trade, updateTime, trade.taker_order_id);
            updates = this.updateElement(updates, trade, updateTime, trade.maker_order_id);
            const [updateConfirmErr,updateConfirmRes] = await to (this.db.update_order_confirm(updates));
            if(!updateConfirmRes) {
                await this.db.rollback();
                return ;
            }
        }
        await this.db.commit();
    }

    updateElement(updates, trade, updateTime, orderId) {
        const tradeAmount: number = +trade.amount;

        let itemIndex;
        const resultArray = updates.find((element, temp_index) => {
            itemIndex = temp_index;
            return element.info[3] === orderId;
        });

        if (!resultArray) {
            const updateElement = {
                info: [
                    +tradeAmount,
                    -tradeAmount,
                    updateTime,
                    orderId,
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
            updates[itemIndex] = updateElement;
        }

        return updates;

    }
}

process.on('unhandledRejection', (reason, p) => {
    console.log('[ADEX WATCHER]:Unhandled Rejection at: Promise', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
});

const health = new Health();
health.start();

const watcher = new Watcher();
watcher.start();
