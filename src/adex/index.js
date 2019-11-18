import to from 'await-to-js'
import TokenTest from '../wallet/contract/TokenTest'
import Token from '../wallet/contract/Token'

import walletHelper from '../wallet/lib/walletHelper'
import { Router } from 'express'
import order1 from './api/order'
import trades1 from './api/trades'
import market1 from './api/market'
import watcher1 from './cli/watcher'
import utils1 from './api/utils'
import user1 from './cli/users'
import asset1 from './cli/asset_info'
import Asset from '../wallet/asset/Asset'
import launcher1 from './cli/launcher'
import NP from 'number-precision'
import client1 from './models/db'

import mist_wallet1 from './api/mist_wallet'
const urllib = require('url');
import mist_config from '../cfg'

import apicache from 'apicache'
let cache = apicache.middleware

async function my_wallet(word){
                return await walletHelper.testWallet(word,'111111')
}


export default ({ config, db }) => {
	let adex  = Router();
	let client = new client1();
    let order = new order1(client);
    let trades = new trades1(client);
    let market = new market1();
    let wathcer = new watcher1(client);
    let user = new user1(client);
    let asset = new asset1();
    let mist_wallet = new mist_wallet1();
    let tokenTest = new TokenTest()
	let utils = new utils1();
	let launcher = new launcher1(client);
	wathcer.start();
	user.start();
	asset.status_flushing();
	launcher.start();

	adex.get('/mist_engine_info', async (req, res) => {
					 let result = await trades.get_engine_info();
                    console.log(result)
       res.json({result});
	});


	        
   	adex.get('/list_market_quotations', async (req, res) => {
					 let result = await market.list_market_quotations();
                    console.log(result)
       res.json({result});
	});

adex.get('/list_tokens', async (req, res) => {
					 let result = await mist_wallet.list_tokens();
                    console.log(result)
       res.json({result});
	});




 	adex.get('/get_token_price', async (req, res) => {
				var obj = urllib.parse(req.url,true).query;
 	 				  console.log("obj=",obj);
				let result = await mist_wallet.get_token_price2pi(obj.symbol);
                    console.log(result);


       res.json({result});
	});

	adex.get('/get_token_price2btc', async (req, res) => {
			var obj = urllib.parse(req.url,true).query;
 	 				  console.log("obj=",obj);
			let result = await mist_wallet.get_token_price2btc(obj.symbol);
                    console.log(result);


       res.json({result});
	});




    adex.get('/balances',async (req, res) => {
					var obj = urllib.parse(req.url,true).query;
 	 				  console.log("obj=",obj);
                    let token_arr = await mist_wallet.list_tokens();
					console.log("---env",process.env.MIST_MODE);
					console.log("---env",process.env);

					let balances = [];
 	 				  console.log("obj11111111133=",token_arr);
                    for(var i in token_arr){
                    	    let token = new Token(token_arr[i].address);
                            let [err,result] = await to(token.balanceOf(obj.address));
							console.log("444444444",mist_config);
							let [err3,allowance] = await to(token.allowance(obj.address,mist_config.ex_address));

							let asset = new Asset(token_arr[i].asim_assetid)
        					let [err4,assets_balance] = await to(asset.balanceOf(obj.address))
							let asset_balance=0;
							for(let j in assets_balance){
								if( token_arr[i].asim_assetid == assets_balance[j].asset){
									asset_balance = assets_balance[j].value;	
								}
							}

							let balance_info ={
								token_symbol: token_arr[i].symbol,   
								token_name: token_arr[i].name,   
								balance:result / (1 * 10 ** 8),
								allowance_ex:allowance / (1 * 10 ** 8),
								asim_assetid: token_arr[i].asim_assetid,
								asim_asset_balance: asset_balance
							};

 	 				  		console.log("obj111111111=",token_arr[i]);
							balances.push(balance_info);
                            console.log(balance_info);
                    }

                    res.json(balances);
                    });


    //所有token合约赋予所有地址权限
    adex.get('/approves',async (req, res) => {
                    
                   var obj = urllib.parse(req.url,true).query;
                      console.log("obj=",obj);
					let token_arr = await mist_wallet.list_tokens();
                    let txids =[];
                    for(let i in token_arr){
                                    let token  = new Token(token_arr[i].address);
                                    let wallet = await my_wallet(obj.word);
                                    let address = await wallet.getAddress();

                                    console.log("333--address",address);
                                    
                                     token.unlock(wallet,"111111")
                                   let [err,balance] = await to(token.balanceOf(address));
                                    let [err3,allowance] = await to(token.allowance(address,mist_config.ex_address));
                                    if(balance != allowance){
                                        await wallet.queryAllBalance()
                                        let [err2,txid] = await to(token.approve(mist_config.ex_address,9999999));

                                    console.log("333--address---",err2,txid);

                                        txids.push(txid);
                                        console.log("444--",err2,txid);

                                    }
                                    console.log("444--",balance,allowance);
                    }
                    res.json(txids);
                    });
 	/****
	
get_order_id，获取order_id,
did对order_id进行签名，获取rsv
新加个接口build_order加上order_id和rs的值去传rsv和orderid，后台去验证，通过才落表。
撮合完成之后relayer对trade信息的hash进行签名，然后合约用relayer的公钥对trade的密文rsv进行验签
	**/ 
	adex.get('/get_order_id', async (req, res) => {
	   
	     var obj = urllib.parse(req.url,true).query;
       console.log("obj=",obj);
       let message = {
                      id:obj.null,
                      trader_address: obj.trader_address,
                      market_id: obj.marketID,
                      side: obj.side,
                      price: obj.price,
                      amount: obj.amount,
                      status:'pending',
                      type:'limit',
                      available_amount:obj.amount,
                      confirmed_amount:0,
                      canceled_amount:0,
                      pending_amount:0,
                      updated_at:null,
                      created_at:null,
       };
	   let order_id = utils.get_hash(message);

       res.json(order_id);
	});


  

    adex.get('/build_order', async (req, res) => {
    	//打印键值对中的值
  		var obj = urllib.parse(req.url,true).query;
 	   console.log("obj=",obj);
	   //test model
	  /** 
		let result = utils.verify(obj.order_id,JSON.parse(obj.signature));
		if(!result){
			return res.json("verify failed");
		}
		**/
		if(!(utils.judge_legal_num(+obj.amount) && utils.judge_legal_num(+obj.price))){
			return res.json("amount or price is cannt support");
		}
		/*
		var arr = obj.market.toString().split("-");
		let token_info = mist_wallet.get_token(arr[1]);
		let token = new Token(token_info[0].address);
        let balance = await token.balanceOf(obj.address);
		if(NP.times(+obj.amount, +obj.price) > balance){
			return res.json("balance is not enoungh");
		}
		*/


       let message = {
                      id:obj.order_id,
                      trader_address: obj.trader_address,
                      market_id: obj.marketID,
                      side: obj.side,
                      price: +obj.price,
                      amount: +obj.amount,
                      status:'pending',
                      type:'limit',
                      available_amount: +obj.amount,
                      confirmed_amount:0,
                      canceled_amount:0,
                      pending_amount:0,
                      updated_at:null,
                      created_at:null,
       };


       let [err,result2] = await to(order.build(message))
       console.log(result2,err);
       res.json({ result2,err });
	});

	adex.get('/cancle_order', async (req, res) => {
	    var obj = urllib.parse(req.url,true).query;
       console.log("cancled_obj=",obj);
		let message = {
			 amount: obj.amount,
			 id: obj.orderID,
		   };


       let [err,result] = await to(order.cancle_order(message));
       res.json({result,err });
	});

	adex.get('/cancle_order', async (req, res) => {
	    var obj = urllib.parse(req.url,true).query;
       console.log("cancled_obj=",obj);
		let message = {
			 amount: obj.amount,
			 id: obj.orderID,
		   };


       let [err,result] = await to(order.cancle_order(message));
       res.json({result,err });
	});



	adex.get('/list_orders', async (req, res) => {
       

       let [err,result] = await to(order.list_orders());

       res.json({result,err });
	});

	adex.get('/my_orders', async (req, res) => {
       
	   /**
		let message = {address:"0x66b7637198aee4fffa103fc0082e7a093f81e05a64"}
		**/
		 var obj = urllib.parse(req.url,true).query;
       console.log("obj=",obj);
		let message = {address:obj.address}

       let [err,result] = await to(order.my_orders(message));

       res.json({result,err });
	});

	adex.get('/my_orders2/:address/:page/:perpage/:status1/:status2', async (req, res) => {
		//pending,partial_filled,当前委托
		//cancled，full_filled，历史委托
	   let {address,page,perpage,status1,status2} = req.params;
       let [err,result] = await to(order.my_orders2(address,page,perpage,status1,status2));
       res.json({result,err });
	});





	adex.get('/order_book', async (req, res) => {

		var obj = urllib.parse(req.url,true).query;
       console.log("obj=",obj);
	
       let [err,result] = await to(order.order_book(obj.marketID));
       res.json({result,err });
	});

	adex.get('/list_markets', async (req, res) => {

       let [err,result] = await to(market.list_markets());
       res.json({result,err });
	});

	adex.get('/list_trades', async (req, res) => {
       
		
		var obj = urllib.parse(req.url,true).query;
       console.log("obj=",obj);

       let [err,result] = await to(trades.list_trades(obj.marketID));

       res.json({result,err });
	});


    adex.get('/my_trades', async (req, res) => {
      /**
        let message = {address:"0x66b7637198aee4fffa103fc0082e7a093f81e05a64"}
**/
        var obj = urllib.parse(req.url,true).query;
       console.log("obj=",obj);
        let message = {address:obj.address};
       let [err,result] = await to(trades.my_trades(message));

       res.json({result,err });
    });


	adex.get('/my_trades2/address/page/perpage', async (req, res) => {
       let [err,result] = await to(trades.my_trades2(req.params.address,req.params.page,req.params.per_page));

       res.json({result,err });
	});



	// add 10 second memory cache ( change to redis later )
	adex.get('/trading_view',cache('10 second'), async (req, res) => {
		let current_time = Math.floor(new Date().getTime() / 1000);
/**
		let message = {
		market_id:"ASIM-PAI",   
		from: current_time - current_time%300 - 300*100,   //当前所在的时间区间不计算  
		to: current_time - current_time%300,
		granularity: 300,
		};
**/

		 var obj = urllib.parse(req.url,true).query;
       console.log("obj=",obj);


		let message = {
		market_id:obj.marketID,   
		from: current_time - current_time%obj.granularity - obj.granularity*obj.number,   //当前所在的时间区间不计算  
		to: current_time - current_time%obj.granularity,
		granularity: obj.granularity,
		};
	   

		let [err,result] = await to(trades.trading_view(message));
        res.json({result,err });
	});

	return adex;
};
