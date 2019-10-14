import client from '../models/db'
import utils2 from './utils'
const crypto = require('crypto');
import to from 'await-to-js';

var date = require("silly-datetime");

export default class makets{
    db;
    exchange;
    root_hash;
    constructor() {
         this.db =  new client();
         this.utils = new utils2;
    }

	async list_markets() {

		let result = await this.db.list_markets();
        console.log("cancle_order--result=",result);
        return result;
    }

	async list_market_quotations() {

		let markets = await this.list_markets();
		let quotations = [];
        console.log("cancle_order--result22223333=",markets);
		for(var index in markets){
			let [err,result] = await to(this.db.get_market_quotations([markets[index].id]));
        	 console.log("get_market_quotations--result=",result,err);
			if(!err){
				quotations.push(result);	
			}
		}
        return quotations;
    }
 
 

 
}
