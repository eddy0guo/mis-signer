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

const urllib = require('url');
import NP from 'number-precision'

import mist_config from '../cfg'

import apicache from 'apicache'
let cache = apicache.middleware

async function my_wallet(word){
                return await walletHelper.testWallet(word,'111111')
}

async function get_price(base_token_name,quote_token_name,amount,order){
 		  let base_book = await order.order_book(base_token_name + '-PI');
		  let quote_book = await order.order_book(quote_token_name + '-PI');
		  let base_bids = base_book.bids;
		  let quote_asks = quote_book.asks.reverse();

		  
		  //模拟先卖掉所有base，再全部买quote
		  let base_value = 0;
		  let base_amount = 0;
		  for(let index in base_bids){
			  let tmp_amount = base_amount; 
			  base_amount += (+base_bids[index][1]);
			  if(base_amount >= amount){
				base_value += NP.times(amount - tmp_amount,base_bids[index][0])
				break;
			  }else{
			    //amount * price
			     base_value += NP.times(base_bids[index][1],base_bids[index][0]) 	  
			  }

		  }

			console.log("123123-base_value-",base_value);
		  let quote_value = 0;
		  let quote_amount = 0;
		  for(let index in quote_asks){
			  let tmp_value = quote_value; 
				quote_value += NP.times(quote_asks[index][1],quote_asks[index][0])

			  if(quote_value >= base_value){
				console.log("123123--quote_asks",quote_asks[index],index);
			  	quote_amount += NP.divide(base_value - tmp_value,quote_asks[index][0]);
				break;
			  }else{
			    //amount * price
			  	quote_amount += (+quote_asks[index][1]);
			  }

		  }
		  let price = NP.divide(quote_amount,amount).toFixed(4);
		  return price;
}

export default ({ config, db }) => {
	 let express  = Router();
	let mist_wallet = new mist_wallet1();
	let psql_db = new psql();
	let utils = new utils1();
	let order = new order1(psql_db);


	express.get('/my_records/:address/:page/:perpage', async (req, res) => {
		  let {address,page,perpage} = req.params;
            let offset = (+page - 1) * +perpage;
			 let [err,result] = await to(psql_db.my_express([address,offset,perpage]));
            res.json({ result:result,err:err});
	});

	express.get('/get_price/:base_token_name/:quote_token_name/:base_amount', async (req, res) => {
		let {base_token_name,quote_token_name,base_amount} = req.params;
		let [err,price] = await to(get_price(base_token_name,quote_token_name,base_amount,order))
		res.json({
            success: price == undefined ? false:true,
            result: price,
			err:err
        });

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
				//let price = NP.divide(base_token_price,quote_token_price);
				//根据深度取价格
				let [err,price] = await to(get_price(base_token_name,quote_token_name,amount,order));

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