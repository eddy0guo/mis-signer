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
import Asset from '../wallet/asset/Asset'
import launcher1 from './cli/launcher'
import NP from 'number-precision'

import mist_wallet1 from './api/mist_wallet'
const urllib = require('url');

async function my_wallet(word){
                return await walletHelper.testWallet(word,'111111')
}


var mist_config = {
	ex_address:'0x633ef502d57e8cf443dab8fcd9a25dbd891bc20e83',
	//product
//	relayer:'0x66edd03c06441f8c2da19b90fcc42506dfa83226d3',
//	relayer_word:'ivory local this tooth occur glide wild wild few popular science horror',
//	relayer_prikey:'0xd2dd57d8969770fad230bf34cacc5ca60e2dc7e406f8f99ced0f59ccf56a19c2',
	//testmod
	relayer:'0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9',
	relayer_word:'enhance donor garment gospel loop purse pumpkin bag oven bone decide street',
	relayer_prikey:'0xcf238d72a2d82f3b0f4085fbfe926ec69ea739c43af2690b846f195c60337c49',
	//另外起服务的时候更换个orderhash打包的账户，避免和生产跑着的并发
	//take
	order_hash_word:'enhance donor garment gospel loop purse pumpkin bag oven bone decide street',
	fauct_address:'0x666234b6348c10fed282b95c1f1768aa3113eb96b2',
	fauct_word:'tag pear master thank vehicle gap medal eyebrow asthma paddle kiss cook',
	fauct_prikey:'0x47c98c143179d48664dfc2f029a8583cb6a394a94037e06f0658dcf18ed6c66a'
}
/*
var relayers = [
    {
        prikey:"0xbbb56da9edd3cac9e7c1e9f991d4bc51f5c9dde9a6e3122fbd53b5f8cce6799b",
        word:"eyebrow quantum rebel century just athlete rough chicken segment control scene obscure",
		address:"0x66f65201237e2a72c0414062cbfe3b161f20216c19"
    },
    {
        prikey:"0x68b6c5c8848b11cb3d9abc0bac5fd567812865f59522fba471c69e688991b3cd",
        word:"cream expire roof family input area ecology bench divert siege goat movie",
		address:"0x6649aaed990397e5c3add1b83f034e4e05349e92eb"
    },
    {
        prikey:"0x8a7135917364bfce158b44b68e7e67ab10bb02c852e0303d376003281cc5e0bd",
        word:"toss uniform manage bar circle shine project method danger replace capable bicycle",
		address:"0x66ac76c2aea20aafb807fa2ac7fbeba44507d0e4a0"
    }
]; 

*/
var relayers = [
    {
        prikey:"0xcf238d72a2d82f3b0f4085fbfe926ec69ea739c43af2690b846f195c60337c49",
        word:"enhance donor garment gospel loop purse pumpkin bag oven bone decide street",
		address:"0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9"
    },
    {
		prikey:"0xcf238d72a2d82f3b0f4085fbfe926ec69ea739c43af2690b846f195c60337c49",
        word:"enhance donor garment gospel loop purse pumpkin bag oven bone decide street",
		address:"0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9"
    },
    {
		prikey:"0xcf238d72a2d82f3b0f4085fbfe926ec69ea739c43af2690b846f195c60337c49",
        word:"enhance donor garment gospel loop purse pumpkin bag oven bone decide street",
		address:"0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9"
       
    }
]; 




export default ({ config, db }) => {
	let adex  = Router();
    let order = new order1();
    let trades = new trades1();
    let market = new market1();
    let wathcer = new watcher1();
    let user = new user1();
    let mist_wallet = new mist_wallet1();
    let tokenTest = new TokenTest()
	let utils = new utils1();
	let launcher = new launcher1();
	wathcer.start();
	user.start();
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



	adex.get('/trading_view', async (req, res) => {
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
export{mist_config,relayers};
