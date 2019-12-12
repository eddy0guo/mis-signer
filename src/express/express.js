import to from 'await-to-js'
import TokenTest from '../wallet/contract/TokenTest'
import Token from '../wallet/contract/Token'
import { chain } from '../wallet/api/chain'

import walletHelper from '../wallet/lib/walletHelper'
import { Router } from 'express'
import Asset from '../wallet//asset/Asset'

import client1 from './models/db'

import mist_wallet1 from '../adex/api/mist_wallet'
import order1 from '../adex/api/order'
import utils1 from '../adex/api/utils'
import psql from './models/db'
import {get_price} from './index'

const urllib = require('url');
import NP from 'number-precision'

import mist_config from '../cfg'

import apicache from 'apicache'
let cache = apicache.middleware

let express_config = [
	{
		token:"CNYc",
		min: 60,
		max: 60000,
	},{
		token:"USDT",
        min: 10,
        max: 10000,
	},{
		 token:"ASIM",
        min: 1,
        max: 1000,
	},{
		 token:"MT",
        min: 1,
        max: 1000,
	},{
		 token:"ETH",
        min: 0.06,
        max: 60,
	},{
		 token:"BTC",
        min: 0.001,
        max: 1,
	}
]

async function my_wallet(word){
                return await walletHelper.testWallet(word,'111111')
}

export default class express{
	 let express  = Router();
	let mist_wallet = new mist_wallet1();
	let psql_db = new psql();
	let utils = new utils1();
	let order = new order1(psql_db);

	   constructor() {
        this.db = new client();
        this.utils = new utils2;
        this.mist_wallet = new mist_wallet1();
    }

    async start{
        this.loop();
    }

	//express.all('/sendrawtransaction/build_express/:base_token_name/:quote_token_name/:amount/:address/:sign_data',async (req, res) => {
	async loop() {

		let [err,pending_trade] = await to(psql_db.laucher_pending_trade());
		let {trade_id,address,quote_amount,quote_token_name} = pending_trade[0];
		let current_time = utils.get_current_time();

			let walletInst = await my_wallet(mist_config.express_word);
            let tokens = await psql_db.get_tokens([quote_token_name]);
            let asset = new Asset(tokens[0].asim_assetid);
            asset.unlock(walletInst,mist_config.wallet_default_passwd);
            await walletInst.queryAllBalance();
            let [quote_err,quote_txid] = await to(asset.transfer(address,quote_amount));
			let quote_tx_status = quote_txid == undefined ? "failed":"successful";

		let info = [quote_txid,quote_tx_status,current_time,trade_id];

		let [err3,result3] = await to(psql_db.update_quote(info));
		console.log("info123",err3,result3)
		setTimeout(()=>{
            this.loop.call(this)
        //间隔时间随着用户量的增长而降低
        },1000 * 10);


    });

};
