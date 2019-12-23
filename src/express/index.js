import to from 'await-to-js'
import TokenTest from '../wallet/contract/TokenTest'
import Token from '../wallet/contract/Token'
import { chain } from '../wallet/api/chain'

import walletHelper from '../wallet/lib/walletHelper'
import { Router } from 'express'
import Asset from '../wallet//asset/Asset'

import client1 from './models/db'
import watcher1 from './watcher'

import mist_wallet1 from '../adex/api/mist_wallet'
import order1 from '../adex/api/order'
import utils1 from '../adex/api/utils'
import psql from './models/db'

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

async function get_price(base_token_name,quote_token_name,amount,order){
		let base_value = 0;
        let base_amount = 0;
		if(base_token_name != 'CNYc'){
			  let base_book = await order.order_book(base_token_name + '-CNYc');
			  let base_bids = base_book.bids;
			  //模拟先卖掉所有base，再全部买quote
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
		}else{
			base_value = NP.times(amount,1);		
		}

		let quote_value = 0;
		let quote_amount = 0;	
		if(quote_token_name != 'CNYc'){
		  console.log("123123-base_value-",base_value);
		  let quote_book = await order.order_book(quote_token_name + '-CNYc');
		  let quote_asks = quote_book.asks.reverse();

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
		}else{
			quote_amount = NP.divide(base_value,1)		 
		}
		let price = NP.divide(quote_amount,amount).toFixed(8);
		console.log("base_value--",price,quote_amount,amount);
		return price;
}

export default ({ config, db }) => {
	 let express  = Router();
	let mist_wallet = new mist_wallet1();
	let psql_db = new psql();
	let utils = new utils1();
	let watcher = new watcher1();
	let order = new order1(psql_db);
	watcher.start()


	express.all('/my_records/:address/:page/:perpage', async (req, res) => {
		  let {address,page,perpage} = req.params;
            let offset = (+page - 1) * +perpage;
			let [err,records] = await to(psql_db.my_express([address,offset,perpage]));

			for(let record of records){
				record.base_token_icon =  'https://www.mist.exchange/res/icons/logo_' + record.base_asset_name.toLowerCase() + '@1x.png'
				record.quote_token_icon = 'https://www.mist.exchange/res/icons/logo_' + record.quote_asset_name.toLowerCase() + '@1x.png'
			}
			res.json({
            success: records == undefined ? false:true,
            result: records,
            err:err
        });
	});

	express.all('/get_express_trade/:trade_id', async (req, res) => {
		  let {trade_id} = req.params;
			let [err,record] = await to(psql_db.find_express([trade_id]));
			if(err){
				return res.json({
				success: false,
				err:err
				})
			}

			if(record.length == 0 ){
				return res.json({
				success: false,
				err:'cann\'t find this trade'
				})
			}
			record[0].base_token_icon =  'https://www.mist.exchange/res/icons/logo_' + record[0].base_asset_name.toLowerCase() + '@1x.png'
			record[0].quote_token_icon = 'https://www.mist.exchange/res/icons/logo_' + record[0].quote_asset_name.toLowerCase() + '@1x.png'
			res.json({
            success: record == undefined ? false:true,
            result: record[0],
            err:err
        });
	});


	express.all('/config', async (req, res) => {
		 res.json({
            success: true,
            result: express_config
        });
	});



	express.all('/get_price/:base_token_name/:quote_token_name/:base_amount', async (req, res) => {
		let {base_token_name,quote_token_name,base_amount} = req.params;
		let [err,price] = await to(get_price(base_token_name,quote_token_name,base_amount,order))
		res.json({
            success: price == undefined ? false:true,
            result: price,
			err:err
        });

	});

	express.all('/my_express_length/:address', async (req, res) => {
		let {address} = req.params;
		let [err,result] = await to(psql_db.my_express_length([address]))
		res.json({
            success: result == undefined ? false:true,
            result: result,
			err:err
        });

	});



	express.all('/get_pool_info', async (req, res) => {
		  let token_arr = await mist_wallet.list_tokens();
		
                    let balances = [];
                      console.log("obj11111111133=",token_arr);
                    for(var i in token_arr){
                            let asset = new Asset(token_arr[i].asim_assetid)
                            let [err4,assets_balance] = await to(asset.balanceOf(mist_config.express_address))
                            let asset_balance=0;
                            for(let j in assets_balance){
                                if( token_arr[i].asim_assetid == assets_balance[j].asset){
                                    asset_balance = assets_balance[j].value;
                                }
                            }
							let icon = 'https://www.mist.exchange/res/icons/logo_' + token_arr[i].symbol.toLowerCase() + '@1x.png'
                            let balance_info ={
                                token_symbol: token_arr[i].symbol,
                                asim_asset_id: token_arr[i].asim_assetid,
                                asim_asset_balance: asset_balance,
								icon:icon
                            };

                            console.log("obj111111111=",token_arr[i]);
                            balances.push(balance_info);
                            console.log(balance_info);
                    }
		res.json({
            success: true,
            result: balances,
        });

	});


	express.all('/sendrawtransaction/build_express/:base_token_name/:quote_token_name/:amount/:address/:sign_data',async (req, res) => {
		console.log("1111",req.params)
		let {base_token_name,quote_token_name,amount,address,sign_data} = req.params;
		let [base_err,base_txid] = await to(chain.sendrawtransaction([sign_data]));
		console.log("express----",base_err,base_txid)
		let base_tx_status =  base_txid == undefined ? "failed":"successful";

		//失败的记录也入表
		let current_time = utils.get_current_time();
		let base_token_price =  await mist_wallet.get_token_price2pi(base_token_name);
		let quote_token_price =  await mist_wallet.get_token_price2pi(quote_token_name);
		//let price = NP.divide(base_token_price,quote_token_price);
		//根据深度取价格
		let [err,price] = await to(get_price(base_token_name,quote_token_name,amount,order));

		let quote_amount = NP.times(amount,price,0.995);
		let fee_amount = NP.times(amount,price,0.005);
		
		let quote_tx_status,quote_err,quote_txid;
		if(!base_err){
			let walletInst = await my_wallet(mist_config.express_word);
            let tokens = await psql_db.get_tokens([quote_token_name]);
            let asset = new Asset(tokens[0].asim_assetid);
            asset.unlock(walletInst,mist_config.wallet_default_passwd);
            await walletInst.queryAllBalance();
            [quote_err,quote_txid] = await to(asset.transfer(address,quote_amount));
			 quote_tx_status = quote_txid == undefined ? "failed":"successful";
		}


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
			 base_txid:base_txid,       
			 base_tx_status:base_tx_status,  
			 quote_txid:quote_txid,      
			 quote_tx_status:quote_tx_status
			 //updated_at:current_time,
			 //created_at:current_time      
		};
		info.trade_id = utils.get_hash(info);
		let info_arr = utils.arr_values(info);

		let [err3,result3] = await to(psql_db.insert_express(info_arr));
		console.log("info123",err3,result3)
		let success;
		if(base_tx_status == 'successful' &&  quote_tx_status == 'successful' && !err3){
			success = true;
		}else{
			success = false;
		}
		 res.json({
            success: success,
			trade_id: info.trade_id,
			base_err:base_err,
			quote_err:quote_err
        });
    });


	express.all('/sendrawtransaction/build_express_v2/:quote_token_name/:sign_data',async (req, res) => {
		console.log("1111",req.params)
		let {quote_token_name,sign_data} = req.params;
		let [base_err,base_txid] = await to(chain.sendrawtransaction([sign_data]));
		console.log("express----",base_err,base_txid)
		let trade_id,success,base_tx_status;


		if(base_txid){
			//只有decode成功才是成功
			base_tx_status = "pending";
			let info = {
					 trade_id:null,       
					 address:null,
					 base_asset_name:null,
					 base_amount:null, 
					 price:null,          
					 quote_asset_name: quote_token_name,
					 quote_amount:null,  
					 fee_rate:0.005,        
					 fee_token: quote_token_name,      
					 fee_amount:null,      
					 base_txid:base_txid,       
					 base_tx_status:'pending',
					 quote_txid:null,      
					 quote_tx_status:null
					 //updated_at:current_time,
					 //created_at:current_time      
				};
				info.trade_id = utils.get_hash(info);
				trade_id = info.trade_id;
				let info_arr = utils.arr_values(info);

				let [err3,result3] = await to(psql_db.insert_express(info_arr));
				console.log("info123",err3,result3)
				res.json({
							success: true,
							trade_id: info.trade_id,
				});
		}else{
			res.json({
				success: false,
				err: base_err
			});
			
		}
		setTimeout(async ()=>{
				//失败的记录也入表
				let [decode_err,decode_info] = await to(utils.decode_transfer_info(base_txid));
                console.log("---------------",decode_err,decode_info)
                let {from,asset_id,vin_amount,to_amount,remain_amount} = decode_info;
				let base_tx_status;
                if(!decode_err){
                  base_tx_status = 'successful' 
                }else{
                  base_tx_status = 'illegaled' 
				}

                if(decode_info.to  != mist_config.express_address){
					 base_tx_status = 'illegaled';
                            console.error(`reciver ${decode_info.to}  is not official address`)
                }

				let [err3,base_token] = await to(psql_db.get_tokens([asset_id]));
				if(err3 || base_token.length == 0){
					base_tx_status = 'illegaled';
                    console.error(`asset ${asset_id}  is not support`)	
				}

				console.log("--------------",base_token[0].symbol,quote_token_name,to_amount);
				let [err,price] = await to(get_price(base_token[0].symbol,quote_token_name,to_amount,order));
				let current_time = utils.get_current_time();

				console.log("--------------",to_amount,price);
				let quote_amount = NP.times(to_amount,price,0.995);
				let fee_amount = NP.times(to_amount,price,0.005);
				
				let info = {
					 address:from,
					 base_asset_name:base_token[0].symbol,
					 base_amount:to_amount, 
					 price:price,          
					 quote_amount:quote_amount,  
					 fee_amount:fee_amount,      
					 base_tx_status:base_tx_status,  
					 quote_tx_status:"pending",
					 updated_at:current_time,
					 trade_id:trade_id    
				};
				let info_arr = utils.arr_values(info);
				console.log("------",info);

				let [err4,result4] = await to(psql_db.update_base(info_arr));
				console.log("info1234444",err4,result4)
				
		},10000);
		 
    });


	return express;
};
