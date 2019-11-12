import client from '../models/db'
import utils2 from '../api/utils'
import {restore_order} from '../api/order'
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
		console.log("watche222 running11111111");
		this.loop()
	}


	async loop() {
		console.log("watche running11111111");
		let transaction = await this.db.get_pending_transactions()
		//全部都是成功的,就睡眠1s
		if (transaction.length == 0) {
			console.log("have not pending transaction");
			setTimeout(()=>{
            this.loop.call(this)
        	}, 1000);

			return;
		}
		
		let id =  transaction[0].id;
		
		console.log("watche running11111111",transaction);

		let [err, result] = await to(chain.getrawtransaction([transaction[0].transaction_hash, true, true]))

		//          console.log("chain.getrawtransaction",result,err);
		//检测txid失败之后，更新为failed就不再管了,暂定为8个区块确认
		//无论是失败还是成功，都会更新orders的confirm_amount,一个transaction确认成功，去更新一个taker和多个maker的order
		//多个进程同时走的话可能多次更新表信息，对于做了加减运算的地方，可能会导致出现负值
		let update_time = this.utils.get_current_time();
		if (!err && result.confirmations >= 8) {
			let status = 'successful';
			let info = [status, update_time, id]
			await this.db.update_transactions(info);
			await this.db.update_trades(info);

			let trades = await this.db.transactions_trades([id]);
				console.log("have n666666666666666666",trades);			
			for(var index in trades){
				let update_maker_orders_info = [0,+trades[index].amount,0,-+trades[index].amount,update_time,trades[index].maker_order_id];
            	let update_taker_orders_info = [0,+trades[index].amount,0,-+trades[index].amount,update_time,trades[index].taker_order_id];
				await this.db.update_order_confirm(update_maker_orders_info);
                await this.db.update_order_confirm(update_taker_orders_info);
			}

		} else if (err) {
			/**
			let status = 'failed';
			let info = [status, update_time, id]
			await this.db.update_transactions(info);
			await this.db.update_trades(info);

			let trades = await this.db.transactions_trades([id]);
				console.log("have n666666666666666666",trades);			
			//失败的交易更改可用数量和状态后重新放入交易池中
			for(var index in trades){
				restore_order(trades[index].taker_order_id,trades[index].amount);
				restore_order(trades[index].maker_order_id,trades[index].amount);
			console.log("chain.getrawtransaction-------restore_order--err",trades[index]);
			}**/
			//失败了订单状态重新改为matched，等待下次打包,此failed为中间状态
			await this.db.update_transactions(["failed", update_time, id]);
			await this.db.update_trades(["matched", update_time, id]);

			console.log("chain.getrawtransaction--err", err);
		} else {
			console.log("have n66666",id);
			console.log("pending transaction", transaction[0].transaction_hash);
		}



		setTimeout(()=>{
			this.loop.call(this)
		}, 1000);

	}


}
