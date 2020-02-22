import * as Queue from 'bull'
import NP from 'number-precision'
import to from 'await-to-js'

import DBClient from '../adex/models/db'
import Engine from '../adex/api/engine'
import Utils from '../adex/api/utils'

class AdexEngine {

    private orderQueue: Queue.Queue;
    private db:DBClient;
    private exchange:Engine;
    private utils:Utils;

    constructor() {
        this.db = new DBClient();
        this.exchange = new Engine(this.db);
        this.utils = new Utils();

        this.initQueue();
    }

    async initQueue():Promise<void>{
        if( this.orderQueue ){
            await this.orderQueue.close();
        }

        this.orderQueue = new Queue('OrderQueue' + process.env.MIST_MODE,
            {
                redis: {
                    port: Number(process.env.REDIS_PORT),
                    host: process.env.REDIS_URL,
                    password: process.env.REDIS_PWD
                }
            });
        this.orderQueue.on('error',async e => {
            console.log('[ADEX ENGINE] Queue on Error', e);
            console.log('[ADEX ENGINE] Trying initQueue...')
            await this.initQueue();
        })

        this.start();
    }

    async start():Promise<void> {
        this.orderQueue.process(async (job, done) => {
            console.log(`[ADEX ENGINE]receive a message %o from OrderQueue${process.env.MIST_MODE} \n`, job.data);
            const message = job.data;

            const create_time = this.utils.get_current_time();
            message.created_at = create_time;
            message.updated_at = create_time;

            // 每次匹配100单，超过300的二次匹配直到匹配不到挂单
            while (message.available_amount > 0) {

                const [find_orders_err, find_orders] = await to(this.exchange.match(message));

                if (!find_orders) {
                    console.error('match orders', find_orders_err, find_orders);
                    done();
                    return;
                }

                if (find_orders.length === 0) {
                    break;
                }

                const [trades_err, trades] = await to(this.exchange.make_trades(find_orders, message));
                if (!trades) {
                    console.error('make trades', trades_err, trades);
                    done();
                    return;
                }

                const [call_asimov_err, call_asimov_result] = await to(this.exchange.call_asimov(trades));
                if (call_asimov_err) {
                    console.error('call asimov', call_asimov_err, call_asimov_result);
                    done();
                    return;
                }

                let amount = 0;
                for (const item of trades) {
                    amount = NP.plus(amount, item.amount);
                }

                message.available_amount = NP.minus(message.available_amount, amount);
                message.pending_amount = NP.plus(message.pending_amount, amount);
            }

            if (message.pending_amount === 0) {
                message.status = 'pending';
            } else if (message.available_amount === 0) {
                message.status = 'full_filled';
            } else {
                message.status = 'partial_filled';
            }

            const arr_message = this.utils.arr_values(message);
            const [insert_order_err, insert_order_result] = await to(this.db.insert_order(arr_message));
            if (!insert_order_result) {
                console.error(insert_order_err, insert_order_result);
            }

            done()
        });
        const queueReady = await this.orderQueue.isReady();

        console.log(`[ADEX ENGINE] started,order queue ready:`, queueReady);
    }

}

process.on('unhandledRejection', (reason, p) => {
    console.log('[ADEX ENGINE] Unhandled Rejection at: Promise', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
});

export default new AdexEngine();
