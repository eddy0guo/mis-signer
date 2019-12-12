import to from 'await-to-js'
import TokenTest from '../wallet/contract/TokenTest'
import Token from '../wallet/contract/Token'
import { chain } from '../wallet/api/chain'

import walletHelper from '../wallet/lib/walletHelper'
import { Router } from 'express'
import Asset from '../wallet//asset/Asset'
import utils1 from '../adex/api/utils'
import psql from './models/db'
import {get_price} from './index'

const urllib = require('url');
import NP from 'number-precision'

import mist_config from '../cfg'

import apicache from 'apicache'
let cache = apicache.middleware

async function my_wallet(word){
                return await walletHelper.testWallet(word,'111111')
}

export default class watcher{

	psql_db = new psql();
	utils = new utils1();

    async start() {
        this.loop();
    }

	//express.all('/sendrawtransaction/build_express/:base_token_name/:quote_token_name/:amount/:address/:sign_data',async (req, res) => {
	async loop() {

		let [err,pending_trade] = await to(this.psql_db.laucher_pending_trade());
		if(pending_trade.length == 0){
			
			console.log("have not pending trade");
            setTimeout(()=>{
            this.loop.call(this)
            }, 2000);

            return;
		}
		let {trade_id,address,quote_amount,quote_asset_name} = pending_trade[0];
		console.log("---------6666666",pending_trade[0])
		let current_time = this.utils.get_current_time();

		let walletInst = await my_wallet(mist_config.express_word);
		let tokens = await this.psql_db.get_tokens([quote_asset_name]);
		let asset = new Asset(tokens[0].asim_assetid);
		asset.unlock(walletInst,mist_config.wallet_default_passwd);
		await walletInst.queryAllBalance();
		let [quote_err,quote_txid] = await to(asset.transfer(address,quote_amount));
		let quote_tx_status = quote_txid == undefined ? "failed":"successful";

		let info = [quote_txid,quote_tx_status,current_time,trade_id];

		let [err3,result3] = await to(this.psql_db.update_quote(info));
		console.log("info123",err3,result3)
		setTimeout(()=>{
            this.loop.call(this)
        //间隔时间随着用户量的增长而降低
        },1000 * 10);


    }

};
