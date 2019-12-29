import to from 'await-to-js'
import TokenTest from '../wallet/contract/TokenTest'
import Token from '../wallet/contract/Token'

import walletHelper from '../wallet/lib/walletHelper'
import NP from 'number-precision'
import { Router } from 'express'
import client from '../adex/models/db'
import engine from '../adex/api/engine'


const urllib = require('url');
import mist_config from '../cfg'
import AsimovWallet from  '../../node_modules/asimov-wallet/lib/AsimovWallet'
import AsimovConst from  '../../node_modules/asimov-wallet/lib/lib/AsimovConst'

import apicache from 'apicache'
const crypto_sha256 = require('crypto');
let cache = apicache.middleware
import utils2 from '../adex/api/utils'


import Queue from 'bull'
class enginer {

	constructor() {
    this.orderQueue = new Queue('OrderQueue'+process.env.MIST_MODE, 'redis://127.0.0.1:6379');
	this.db = new client();
	this.exchange = new engine(this.db);
	this.utils = new utils2();
	this.start();
	}
	async start(){
		console.log("start ")
	 this.orderQueue.process(async (job, done) => {

        let message = job.data;
        console.log(`-----engine job---%o---------`, message)

 	//job.progress(42);
	
        let find_orders = await this.exchange.match(message);

        if (find_orders.length == 0) {
			done();
			return
        }

        let trades = await this.exchange.make_trades(find_orders, message);

        let transactions = await this.db.list_transactions();
        let id = 0;

        if (transactions.length != 0) {
            id = transactions[0].id;
        }
		console.log(`-----engine6666---%o-----111----`,message)
        let amount = 0;
        for (var i in trades) {
            amount += trades[i].amount;
        }

        //插入之前直接计算好额度,防止orderbook出现买一大于卖一的情况
        message.available_amount -= amount;
        message.pending_amount += amount;
        console.log("string33333=", message);
        let order_status;
        if (message.pending_amount == 0) {
            order_status = "pending";
        } else if (message.available_amount == 0) {
            order_status = "full_filled";
        } else {
            order_status = "partial_filled";
        }
        message.status = order_status;


		let updated_at = this.utils.get_current_time();

		let update_info = [-amount,0,0,amount,order_status,updated_at,message.id];

        let result = await this.db.update_orders(update_info);

        //settimeout 的原因暂时不返回txid
        this.exchange.call_asimov(trades, id);

		console.log(`-----engine6666---%o-----2222----`,message)
			done()
		});

		this.orderQueue.add({test:'First Job from Consumer'})
	 }


};
export default new enginer();
