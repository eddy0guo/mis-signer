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

            let message = job.data;
            let find_orders = await this.exchange.match(message);

            if (find_orders.length == 0) {
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

            //插入之前直接计算好额度,防止orderbook出现买一大于卖一的情况
            message.available_amount = NP.minus(message.available_amount,amount);
            message.pending_amount = NP.plus(message.available_amount,amount);
            console.log(`111${message.id}111--message=%o---matchedamount=%o---trades=%o---`,message,amount,trades);
            let order_status;
            if (message.pending_amount == 0) {
                order_status = "pending";
            } else if (message.available_amount == 0) {
                order_status = "full_filled";
            } else {
                order_status = "partial_filled";
            }
            message.status = order_status;


            let updated_at = this.utils.get_current_time();

            let update_info = [-amount, 0, 0, amount, order_status, updated_at, message.id];

            let result = await this.db.update_orders(update_info);

            //settimeout 的原因暂时不返回txid
            this.exchange.call_asimov(trades, id);

            done()
        });

    }


}

export default new enginer();
