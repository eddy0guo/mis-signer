import to from 'await-to-js'
import TokenTest from '../wallet/contract/TokenTest'
import Token from '../wallet/contract/Token'

import walletHelper from '../wallet/lib/walletHelper'
import { Router } from 'express'
import order1 from './api/order'
import trades1 from './api/trades'
import market1 from './api/market'
import watcher1 from './cli/watcher'
import mist_wallet1 from './api/mist_wallet'
const urllib = require('url');

let walletInst;
let wallet_taker;
let wallet_maker;
async function getTestInst(){
        if( walletInst ) return walletInst;
                walletInst = await walletHelper.testWallet('ivory local this tooth occur glide wild wild few popular science horror','111111')
                                return walletInst
}

async function taker_wallet(){
        if( walletInst ) return walletInst;
                wallet_taker = await walletHelper.testWallet('enhance donor garment gospel loop purse pumpkin bag oven bone decide street','111111')
                                return wallet_taker
}

async function my_wallet(word){
                return await walletHelper.testWallet(word,'111111')
}



var    GXY = '0x631f62ca646771cd0c78e80e4eaf1d2ddf8fe414bf'; //ASIM
var    PAI = '0x63429bfcfdfbfa0048d1aeaa471be84675f1324a02';
var XRP = '0x6388e9a82e400a5da6ce837a045d812baea3a1f1e5';
var BTC = '0x63b543f99847bd77bb378a77ca216cdc749ebf8494';
var VLS = '0x6386db063e10ef893138e560c55eb42bb9e13ac7dc';
var ex_address = '0x63d2007ae83b2853d85c5bd556197e09ca4d52d9c9';
var relayer = '0x66edd03c06441f8c2da19b90fcc42506dfa83226d3';


let addr0 = '0x66edd03c06441f8c2da19b90fcc42506dfa83226d3';
let word0 = 'ivory local this tooth occur glide wild wild few popular science horror';

            
let taker = '0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9';
let taker_word = 'enhance donor garment gospel loop purse pumpkin bag oven bone decide street';

let maker = '0x66b7637198aee4fffa103fc0082e7a093f81e05a64';
let maker_word = 'one concert capable dolphin useful earth betray absurd price nerve morning danger';

let addr_chenfei = '0x668191f35bcc9d4c834e06bdbcb773609c40ba4cea';
let addr_xuwei = '0x6611f5fa2927e607d3452753d3a41e24a23e0b947f';

export default ({ config, db }) => {
	let adex  = Router();
    let order = new order1();
    let trades = new trades1();
    let market = new market1();
    let wathcer = new watcher1();
    let mist_wallet = new mist_wallet1();
    let tokenTest = new TokenTest()
	wathcer.start();

	        
   	adex.get('/faucet', async (req, res) => {
                    await walletInst.queryAllBalance()
				 walletInst = await getTestInst();
                    let [err,result] = await to(tokenTest.testTransfer(walletInst))
                    console.log(result,err);

       res.json({result,err });
	});


    adex.get('/balances',async (req, res) => {
					var obj = urllib.parse(req.url,true).query;
 	 				  console.log("obj=",obj);
                    let token_arr = await mist_wallet.list_tokens();

					let balances = [];
 	 				  console.log("obj11111111133=",token_arr);
                    for(var i in token_arr){
 	 				  console.log("obj111111111=",token_arr[i]);
                    	    let token = new Token(token_arr[i].address);
                            let [err,result] = await to(token.balanceOf(obj.address));
							let balance_info ={
								token_symbol: token_arr[i].symbol,   
								token_name: token_arr[i].name,   
								balance:result,
							};
							balances.push(balance_info);
                            console.log(balance_info);
                    }

                    res.json(balances);
                    });

    adex.get('/list_balance',async (req, res) => {
                    
                    let token_arr = [GXY,PAI,XRP,BTC,VLS];
                    let tokenname_arr = ["GXY","PAI","XRP","BTC","VLS"];
                    let addr_arr = [taker,maker,addr_xuwei];
					let balances = [];
                    for(var i in token_arr){
                        let token = new Token(token_arr[i]);
                        for(var m in addr_arr){
                            let [err,result] = await to(token.balanceOf(addr_arr[m]));
							let balance_info = 'tokenname:' + tokenname_arr[i] + '    useraddr:' + addr_arr[m] + '       balance:' + result;
							balances.push(balance_info);
                            console.log(balance_info);
                        } 
                    }

					res.json(balances);
                    });

    //所有token合约赋予所有地址权限
    adex.get('/all_approve',async (req, res) => {
                    
                    let token_arr = [GXY,PAI];
                    let word_arr = [maker_word,taker_word];

                    for(var i in token_arr){
                        let token  = new Token(token_arr[i]);
                        for(var n in word_arr){
                                let wallet = await my_wallet(word_arr[n]);
                                
                                    console.log("approve wallet =",wallet);

                                     token.unlock(wallet,"111111")

                                    await wallet.queryAllBalance()
                                    let [err,result] = await to(token.approve(relayer,100000));
                                    console.log("approve result=",result,err);
                        }
                    }

                    res.json("sss");
                    });


  
  

    adex.get('/build_order', async (req, res) => {
    	//打印键值对中的值
  		var obj = urllib.parse(req.url,true).query;
 	   console.log("obj=",obj);
       let message = {
                      id:null,
                      trader_address: obj.trader_address,
                      market_id: obj.marketID,
                      side: obj.side,
                      price: obj.price,
                      amount: obj.amount,
//                      side: "buy",
//                      price: 11.000000000000000,
//                      amount: 5.00000000000000,
//					   side: "sell",
//                     price: 1.13000000000000000,
//                     amount: 11.00000000000000,
                      status:'pending',
                      type:'limit',
                      available_amount:obj.amount,
                      confirmed_amount:0,
                      canceled_amount:0,
                      pending_amount:0,
                      updated_at:null,
                      created_at:null,
       };


       let [err,result] = await to(order.build(message))
       console.log(result,err);
       res.json({ result,err });
	});

	adex.get('/cancle_order', async (req, res) => {
/**
       let message = {
			 amount: 0.233300000000000000,
			 id: "67d4259b990f1a0f36543a04142e8126bc92c3d1263d0b0435364d4c06749a65",
		   };
**/
	    var obj = urllib.parse(req.url,true).query;
       console.log("obj=",obj);
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
export{GXY,PAI,relayer};
