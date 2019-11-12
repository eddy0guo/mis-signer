import client from '../models/db'
import utils2 from './utils'
import to from 'await-to-js'
import TokenTest from '../../wallet/contract/TokenTest'
import Token from '../../wallet/contract/Token'

import walletHelper from '../../wallet/lib/walletHelper'

const crypto = require('crypto');
var date = require("silly-datetime");

let walletInst;
async function getTestInst(){
        if( walletInst ) return walletInst;
                walletInst = await walletHelper.testWallet('ivory local this tooth occur glide wild wild few popular science horror','111111')
                                return walletInst
}

export default class mist_wallet{
    db;
    exchange;
    root_hash;
    constructor() {
         this.db =  new client();
         this.utils = new utils2;
    }
	


	async list_tokens() {
		 let result = await this.db.list_tokens();	
        console.log("cancle_order--result=",result);
        return result;
    }

	async get_token(symbol) {
		 let result = await this.db.get_token([symbol]);	
        console.log("cancle_order--result=");
        return result;
    }

	//寻找交易对的优先级依次为，PI,USDT,MT
	async get_token_price2pi(symbol) {
			if(symbol == 'PI'){
				return 1;
			}
			let marketID = symbol + "-PI";
			let [result,err] = await this.db.get_market_current_price([marketID]);	
			//如果24小时没有成交的交易对，对应的价格为0,如果交易对不存在也是这样判断,fixme
        	console.log("get_token_price2pi--result=",result,marketID,err);
			if(result.length == 0){
				marketID = symbol + "-USDT";
				let price2usdt = await this.db.get_market_current_price([marketID]);	
				let price_usdt2pi = await this.db.get_market_current_price(["USDT-PI"]);	


				if(price2usdt.length == 0){
					marketID = symbol + "-MT";
					let price2mt = await this.db.get_market_current_price([marketID]);
					let price_mt2pi = await this.db.get_market_current_price(["MT-PI"]);
					result = price2mt[0].price * price_mt2pi[0].price;
				}else{
					result = price2usdt[0].price * price_usdt2pi[0].price;
				}

			}else{
				result = result.price;
			}
		
        console.log("get_token_price2pi--result=",result);
        return result;
    }






	async get_token_price2btc(symbol) {
		 let price2pi = await this.get_token_price2pi(symbol);

		 let btc2pi = await this.get_token_price2pi("BTC");	

		 let price2btc = price2pi / btc2pi;

		 let result = price2btc.toFixed(6)
		 console.log("get_token_price2btc33---",result);
        return result;
    }
 
}
