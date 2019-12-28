import client from '../models/db'
import engine from './engine'
import utils2 from './utils'
const crypto = require('crypto');
var date = require("silly-datetime");
var Queue = require('bull');
var orderQueue = new Queue('OrderQueue'+process.env.MIST_MODE, 'redis://127.0.0.1:6379');

//require('babel-polyfill');
//require('babel-register');

export default class order{
    db;
    exchange;
    root_hash;
    constructor(client) {
         this.db = client;
         this.exchange = new engine(this.db);
         this.utils = new utils2;
    }


    async build(message) {

		 let create_time = this.utils.get_current_time();
		 //新订单创建后去users表匹配，找不到就插入新地址，这里偷懒其他字段都默认值让后台程序去更新
		let mist_user = await this.db.find_user([message.trader_address]);
		console.log("1111988888888",mist_user);
			if(!mist_user[0]){
				let address_info = {
					address:message.trader_address, 
				}
		console.log("11119999999999999",mist_user);
				let result = await this.db.insert_users(this.utils.arr_values(address_info));
				
			}


          //let hash = this.utils.get_hash(message);

          //  message.id = hash;
            message.created_at= create_time;
            message.updated_at= create_time;
			let arr_message1 = this.utils.arr_values(message);	
            console.log("string111=",arr_message1.join("-"));

			orderQueue.add(message);

			let result = await this.db.insert_order(arr_message1);
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

	async my_orders2(address,page,perpage,status1,status2) {
        let offset = (+page - 1) * perpage;
        let result = await this.db.my_orders2([address,offset,perpage,status1,status2]);
            console.log("my_orders2--result=",result,address,offset,perpage);
        return result;
    }

	async my_orders_length(address) {
        let result = await this.db.my_orders_length([address]);
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
				asks:asks_arr.reverse(),
				bids:bids_arr,
			};
        console.log("order_book--result=",order_book);
        return order_book;
    }

	async get_order(order_id){
           return await this.db.find_order([order_id]);
	}

	
}

//回滚没有打包成功的交易,不过吃单变成了挂单，等别人吃
export async function	 restore_order(order_id,amount){
				let utils = new utils2;
				let update_time =  utils.get_current_time();
				console.log("restore_order---gxy22222",order_id,amount);
				let db =  new client();
                let current_order = await db.find_order([order_id]);

				console.log("restore_order---gxy333--current_order",current_order);

                let status =  current_order[0].available_amount + amount < current_order[0].amount ? 'partial_filled' : 'pending';
                let update_orders_info = [amount,0,0,-amount,status,update_time,order_id];
                await db.update_orders(update_orders_info);
 }
