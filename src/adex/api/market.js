import client from '../models/db'
import utils2 from './utils'
const crypto = require('crypto');
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
 

 
}
