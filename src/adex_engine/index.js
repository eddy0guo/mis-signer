import client from '../adex/models/db'
import engine from '../adex/api/engine'
import utils2 from '../adex/api/utils'
import Queue from 'bull'
import NP from 'number-precision'

class enginer {

    constructor() {
        this.orderQueue = new Queue('OrderQueue' + process.env.MIST_MODE, 'redis://127.0.0.1:6379');
        this.db = new client();
        this.exchange = new engine(this.db);
        this.utils = new utils2();
        this.start();
    }

    async start() {
        this.orderQueue.process(async (job, done) => {
			 //console.log(`receive a message %o from OrderQueue${process.env.MIST_MODE} \n`,job.data);
             let message = job.data;
			
			 let create_time = this.utils.get_current_time();
			 message.created_at = create_time;
             message.updated_at = create_time;

			//每次匹配100单，超过300的二次匹配知道匹配不到挂单
			 while(true){

				let find_orders = await this.exchange.match(message);

				if (find_orders.length == 0) {
					break;
				}

				let trades = await this.exchange.make_trades(find_orders, message);
				await this.exchange.call_asimov(trades);

				let amount = 0;
				for (var i in trades) {
					amount = NP.plus(amount,trades[i].amount);
				}
	
    	        message.available_amount = NP.minus(message.available_amount,amount);
        	    message.pending_amount = NP.plus(message.pending_amount,amount);
				if( message.available_amount == 0){break;}
				
			}
           
            //console.log(`111${message.id}111--message=%o---matchedamount=%o---trades=%o---`,message,amount,trades);
            if (message.pending_amount == 0) {
                message.status   = "pending";
            } else if (message.available_amount == 0) {
                message.status  = "full_filled";
            } else {
                message.status  = "partial_filled";
            }

			let arr_message = this.utils.arr_values(message);
			let result = await this.db.insert_order(arr_message);


            done()
        });

    }


}

export default new enginer();
