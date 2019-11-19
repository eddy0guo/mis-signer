import to from 'await-to-js'
import TokenTest from '../wallet/contract/TokenTest'
import Token from '../wallet/contract/Token'
import { chain } from '../wallet/api/chain'

import walletHelper from '../wallet/lib/walletHelper'
import { Router } from 'express'
import Asset from '../wallet//asset/Asset'

import client1 from './models/db'

import mist_wallet1 from '../adex/api/mist_wallet'
import utils1 from '../adex/api/utils'
import psql from './models/db'

const urllib = require('url');
import NP from 'number-precision'

import mist_config from '../cfg'

import apicache from 'apicache'
let cache = apicache.middleware

async function my_wallet(word){
                return await walletHelper.testWallet(word,'111111')
}


export default ({ config, db }) => {
	 let express  = Router();
	let mist_wallet = new mist_wallet1();
	let psql_db = new psql();
	let utils = new utils1();


	express.get('/my_records/:address/:page/:perpage', async (req, res) => {
		  let {address,page,perpage} = req.params;
            let offset = (+page - 1) * +perpage;
			 let [err,result] = await to(psql_db.my_express([address,offset,perpage]));
            res.json({ result:result,err:err});
	});


	express.get('/sendrawtransaction/build_express/:base_token_name/:quote_token_name/:amount/:address/:row',async (req, res) => {
		console.log("1111",req.params)
		let {base_token_name,quote_token_name,amount,address,row} = req.params;
		let [err,result] = await to(chain.sendrawtransaction([row]));
		console.log("express----",err,result)
		if(!err){
				let current_time = utils.get_current_time();
				let base_token_price =  await mist_wallet.get_token_price2pi(base_token_name);
				let quote_token_price =  await mist_wallet.get_token_price2pi(quote_token_name);
				let price = NP.divide(base_token_price,quote_token_price);

				let quote_amount = NP.times(amount,price,0.995);
				let fee_amount = NP.times(amount,price,0.005);

			let walletInst = await my_wallet(mist_config.express_word);
            let tokens = await psql_db.get_tokens([quote_token_name])
            let asset = new Asset(tokens[0].asim_assetid)
            asset.unlock(walletInst,mist_config.wallet_default_passwd)
            await walletInst.queryAllBalance()
            let [err2,quote_txid] = await to(asset.transfer(address,quote_amount));

			let quote_status = quote_txid == undefined ? "failed":"success";


				let info = {
					 trade_id:null,       
					 address:address,
					 base_asset_name:base_token_name,
					 base_amount:amount, 
					 price:price,          
					 quote_asset_name: quote_token_name,
					 quote_amount:quote_amount,  
					 fee_rate:0.005,        
					 fee_token: quote_token_name,      
					 fee_amount:fee_amount,      
					 base_txid:result,       
					 base_tx_status:"success",  
					 quote_txid:quote_txid,      
					 quote_tx_status:quote_status
					 //updated_at:current_time,
					 //created_at:current_time      
				};
				info.trade_id = utils.get_hash(info);
				 let info_arr = utils.arr_values(info);

				 console.log("info")
				let [err3,result3] = await to(psql_db.insert_express(info_arr));
		}

            res.json({ result:result,err:err});
    });

	return express;
};
