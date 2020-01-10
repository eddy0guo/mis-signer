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
			 console.log(`receive a message %o from OrderQueue${process.env.MIST_MODE} \n`,job.data);
             let message = job.data;
			
			 let create_time = this.utils.get_current_time();
			 message.created_at = create_time;
             message.updated_at = create_time;

            let find_orders = await this.exchange.match(message);

            if (find_orders.length == 0) {
				let arr_message = this.utils.arr_values(message);
				let result = await this.db.insert_order(arr_message);
                done();
                return
            }

            let trades = await this.exchange.make_trades(find_orders, message);

            let transactions = await this.db.list_transactions();
            let id = 0;

            if (transactions.length != 0) {
                id = transactions[0].id;
            }
            let amount = 0;
            for (var i in trades) {
                amount = NP.plus(amount,trades[i].amount);
            }

            message.available_amount = NP.minus(message.available_amount,amount);
            message.pending_amount = NP.plus(message.available_amount,amount);

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

            this.exchange.call_asimov(trades, id);

            done()
        });

    }


}

export default new enginer();
