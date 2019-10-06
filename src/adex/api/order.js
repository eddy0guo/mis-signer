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
         this.utils = new utils2;
    }


    async build(message) {

          //  var create_time = date.format(new Date(),'YYYY-MM-DD HH:mm:ss.SSS'); 
		  	let create_time = this.utils.get_current_time();
            
            let hash = this.utils.get_hash(message); // a65014c0dfa57751a749866e844b6c42266b9b7d54d5c59f7f7067d973f77817


             message.id = hash;
            message.created_at= create_time;
            
            let arr_message = this.utils.arr_values(message);


            console.log("string=",arr_message.join("-"));

            
           
            let result = await this.db.insert_order(arr_message);

            let find_orders = await this.exchange.match(message);


            console.log("findorderssssss=",find_orders);

            let trades = await this.exchange.make_trades(find_orders,message);

           //匹配订单后，同时更新taker和maker的order信息 

            let txid = await this.exchange.call_asimov(trades)
//           目前先做打包交易完成后更新transaction的交易，launcher的暂时没必要做
//            this.db.insert_transactions(arr_message);
//            this.db.insert_launchers(arr_message);

            return result;
    }

    async cancle(walletInst) {
        return this.contract.callContract(abiInfo)
    }
 
}
