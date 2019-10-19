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

		 let create_time = this.utils.get_current_time();
            let hash = this.utils.get_hash(message);

            message.id = hash;
            message.created_at= create_time;
            message.updated_at= create_time;
		let arr_message1 = this.utils.arr_values(message);	
            console.log("string111=",arr_message1.join("-"));

            let find_orders = await this.exchange.match(message);

            if(find_orders.length == 0){

            	let result = await this.db.insert_order(arr_message1);
				return result;
			}

            console.log("findorderssssss=",find_orders);

            let trades = await this.exchange.make_trades(find_orders,message);

            let transactions = await this.db.list_transactions();
            console.log("transactions=",transactions);
            let id = 0;

            if(transactions.length != 0){
                id = transactions[0].id;
            }

            let amount = 0;
            for(var i in trades){
                amount += trades[i].amount;
            }

            //插入之前直接计算好额度,防止orderbook出现买一大于卖一的情况
            message.available_amount -= amount;
            message.pending_amount  += amount;
			let order_status;
			if(message.pending_amount == 0){
				order_status = "pending";
			}else if(message.available_amount == 0){
				order_status = "full_filled";
			}else{
				order_status = "partial_filled";
			}
			message.status = order_status;
            let arr_message = this.utils.arr_values(message);
            console.log("string222=",arr_message.join("-"));
            let result = await this.db.insert_order(arr_message);

           //匹配订单后，同时更新taker和maker的order信息
          let txid = await this.exchange.call_asimov(trades)

		
		 for(var i in trades){
                trades[i].transaction_id = id + 1;
                trades[i].transaction_hash = txid;

                console.log("trades[i]=",trades[i]);
                await this.db.insert_trades(this.utils.arr_values(trades[i]));
            }


                console.log("trades[i]=22222222222222",trades);
            let TXinfo = [id+1,txid,message.market_id,"pending",create_time,create_time];
           this.db.insert_transactions(TXinfo);


            return result;
    }

    async cancle_order(message) {

            console.log("cancle_order--message=",message);
		let create_time = this.utils.get_current_time();
		let cancle_info = [-message.amount,0,message.amount,0,'cancled',create_time,message.id];
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



	async order_book(marketID) {

		let asks = await this.db.order_book(['sell',marketID]);
		let bids = await this.db.order_book(['buy',marketID]);
		
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
