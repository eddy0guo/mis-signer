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
			message.updated_at= create_time;
            
            let arr_message = this.utils.arr_values(message);


            console.log("string=",arr_message.join("-"));

            
           
            let result = await this.db.insert_order(arr_message);

            let find_orders = await this.exchange.match(message);

			if(find_orders.length == 0){return;}


            console.log("findorderssssss=",find_orders);

            let trades = await this.exchange.make_trades(find_orders,message);

           //匹配订单后，同时更新taker和maker的order信息 

            let txid = await this.exchange.call_asimov(trades)
//           目前先做打包交易完成后更新transaction的交易，launcher的暂时没必要做
			
            let transactions = await this.db.list_transactions();

            console.log("transactions=",transactions);
			let id = 0;
			
			if(transactions.length != 0){
				id = transactions[0].id;
			}
			
            	console.log("trades[i]=22222222222222",trades);
			for(var i in trades){
				trades[i].transaction_id = id + 1;
				trades[i].transaction_hash = txid;

            	console.log("trades[i]=",trades[i]);
				await this.db.insert_trades(this.utils.arr_values(trades[i]));
			}

			let TXinfo = [id+1,txid,message.market_id,"pending",create_time,create_time];
            this.db.insert_transactions(TXinfo);
//            this.db.insert_launchers(arr_message);

            return result;
    }

    async cancle_order(message) {

            console.log("cancle_order--message=",message);
		let create_time = this.utils.get_current_time();
		let cancle_info = [-message.amount,0,message.amount,0,create_time,message.id];
		let result = await this.db.update_orders(cancle_info);

            console.log("cancle_order--result=",result);
        return result;
    }

	async list_orders(message) {

		let result = await this.db.list_orders();

            console.log("cancle_order--result=",result);
        return result;
    }

	async my_orders(message) {

            console.log("cancle_order--message=",message);
		let filter_info = [message.address];
		let result = await this.db.my_orders(filter_info);

            console.log("cancle_order--result=",result);
        return result;
    }



	async order_book() {

		let asks = await this.db.order_book(['sell']);
		let bids = await this.db.order_book(['buy']);
		
		let asks_arr = [];
		let bids_arr = [];
		 for(var item in asks){

                    asks_arr.push(this.utils.arr_values(asks[item]));
         }

	  for(var item in bids){
                    bids_arr.push(this.utils.arr_values(bids[item]));
         }
	
		let order_book={
				asks:asks_arr,
				bids:bids_arr,
			};
        console.log("order_book--result=",order_book);
        return order_book;
    }
 

 
}
