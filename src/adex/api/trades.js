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


	async get_engine_info() {

		let result = await this.db.get_engine_info();
        return result;
    }



	async list_trades(marketID) {

        console.log("list_trades--result=",[marketID]);
		let result = await this.db.list_trades([marketID]);
        console.log("list_trades--result=",result);
        return result;
    }

	async my_trades(message) {

            console.log("cancle_order--message=",message);
        let filter_info = [message.address];
        let result = await this.db.my_trades(filter_info);

            console.log("cancle_order--result=",result);
        return result;
    }



    async my_trades2(address,page,perpage) {
		let offset = (+page - 1) * perpage;
        let result = await this.db.my_trades2([address,offset,perpage]);
            console.log("cancle_order--result=",result);
        return result;
    }

	async trading_view(message){ 
		let bar_length = (message.to - message.from) / message.granularity;
		let bars = [];
		for(var i=0;i < bar_length;i++){
			var from = date.format(new Date((message.from + message.granularity * i) * 1000),'YYYY-MM-DD HH:mm:ss');
			var to = date.format(new Date((message.from + message.granularity * (i+1)) * 1000),'YYYY-MM-DD HH:mm:ss');
			let filter_info = [message.market_id,from,to];
			let trades_by_time = await this.db.sort_trades(filter_info,"created_at");
			let trades_by_price = await this.db.sort_trades(filter_info,"price");
			
			let volume  = 0;
			     for(var index in trades_by_price){
                 	volume  += +trades_by_price[index].amount;
				}

		 	let open = 0;
			let close = 0;
			let high = 0
			let low = 0

			if(trades_by_time.length != 0){
			open = trades_by_time[0].price;
			close = trades_by_time.pop().price; 
			high = trades_by_price[0].price;
			low = trades_by_price.pop().price; 
			}

			let bar = {
				time:from,
				open:open,
				close:close,
				low:low,
				high:high,
				volume:volume,
			}
			bars.push(bar);
        	console.log("trading_view--result=",trades_by_time);
		}
		 console.log("bars---",bars);
        return bars;
    }


}
