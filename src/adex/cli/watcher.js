import client from '../models/db'
import utils2 from '../api/utils'
import { chain } from '../../wallet/api/chain'
import to from 'await-to-js'
const crypto = require('crypto');
var date = require("silly-datetime");

export default class watcher {
	db;
	exchange;
	root_hash;
	constructor() {
		this.db = new client();
		this.utils = new utils2;
	}

	async start() {
		this.loop()
	}

	async loop() {
	
		let transactions = await this.db.list_successful_transactions()
		
		let id = 0;
		if (transactions.length != 0) {
			id = transactions[0].id;
		}

		let id_arr = [id + 1];
		let transaction = await this.db.get_transaction(id_arr);

		//全部都是成功的,就睡眠1s
		if (transaction.length == 0) {
			console.log("have not pending transaction");
			setTimeout(()=>{
            this.loop.call(this)
        	}, 1000);

			return;
		}

			console.log("have n555555555555555555",id_arr);
		let [err, result] = await to(chain.getrawtransaction([transaction[0].transaction_hash, true, true]))

		//          console.log("chain.getrawtransaction",result,err);
		//检测txid失败之后，更新为failed就不再管了,暂定为8个区块确认
		let update_time = this.utils.get_current_time();
		if (!err && result.confirmations >= 8) {
			let status = 'successful';
			let info = [status, update_time, id + 1]
			this.db.update_transactions(info);
			this.db.update_trades(info);
		} else if (err) {
			let status = 'failed';
			let info = [status, update_time, id + 1]
			this.db.update_transactions(info);
			this.db.update_trades(info);
			console.log("chain.getrawtransaction--err", err);
		} else {


			console.log("have n66666",id_arr);
			console.log("pending transaction", transaction[0].transaction_hash);
		}

		setTimeout(()=>{
			this.loop.call(this)
		}, 1000);

	}


}
