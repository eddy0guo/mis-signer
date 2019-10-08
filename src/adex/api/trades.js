import client from '../models/db'
import utils2 from './utils'
const crypto = require('crypto');
var date = require("silly-datetime");

export default class trades{
    db;
    exchange;
    root_hash;
    constructor() {
         this.db =  new client();
         this.utils = new utils2;
    }

	async list_trades() {

		let result = await this.db.list_trades();
        console.log("cancle_order--result=",result);
        return result;
    }


    async my_trades(message) {

            console.log("cancle_order--message=",message);
        let filter_info = [message.address];
        let result = await this.db.my_trades(filter_info);

            console.log("cancle_order--result=",result);
        return result;
    }
}
