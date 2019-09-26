import client from '../models/db'
import engine from './engine'
import utils2 from './utils'
const crypto = require('crypto');
var date = require("silly-datetime");
//require('babel-polyfill');
//require('babel-register');

export default class order{
    db;
    exchange;
    root_hash;
    constructor() {
         this.db =  new client();
         this.exchange = new engine(this.db);
         this.root_hash = crypto.createHmac('sha256', '123')
         this.utils = new utils2;
    }


    async build(message) {

            var create_time = date.format(new Date(),'YYYY-MM-DD HH:mm:ss'); 
            
            let arr = this.utils.arr_values(message);
            arr.push(create_time);
            let str = arr.join("");
            let hash = this.root_hash.update(str, 'utf8').digest('hex'); // a65014c0dfa57751a749866e844b6c42266b9b7d54d5c59f7f7067d973f77817


             message.id = hash;
            message.created_at= create_time;
            
            let arr_message = this.utils.arr_values(message);


            console.log("string=",arr_message.join("-"));

            
           
            let result = await this.db.insert_order(arr_message);

            let find_orders = await this.exchange.match(message);


            console.log("findorderssssss=",find_orders);

            let trades = await this .exchange.make_trades(find_orders);

           

            console.log("findorders=",find_orders);
            return result;
    }

    async cancle(walletInst) {
        return this.contract.callContract(abiInfo)
    }
 
}
