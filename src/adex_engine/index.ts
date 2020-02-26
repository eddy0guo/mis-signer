import * as Queue from 'bull'
import NP from 'number-precision'
import to from 'await-to-js'

import DBClient from '../adex/models/db'
import Engine from '../adex/api/engine'
import Utils from '../adex/api/utils'
import order from '../adex/api/order';
import {
    IOrder, ITrade, IOrderBook, ILastTrade, ITransaction,
    IBridge, IPrice, IMarketQuotation, IFreezeToken
} from '../adex/interface';
import {number} from 'bitcoinjs-lib/types/script';

// tslint:disable-next-line:no-shadowed-variable
function computeOrderBookUpdates(trades: ILastTrade[], order: IOrder): IOrderBook {
    const book: IOrderBook = {
        asks: [],
        bids: []
    };
    if (order.side === 'sell') {
        book.asks[0] = [order.price, order.available_amount];
        // +，-表示深度的增减
        for (const trade of trades) {
            let priceExsit = false;
            for (const bid of book.bids) {
                if (trade.price === bid[0]) {
                    bid[1] = NP.minus(bid[1],trade.amount);
                    priceExsit = true;
                    break;
                }
            }
            if (!priceExsit) book.bids.push([trade.price, -trade.amount]);
        }
    } else if (order.side === 'buy') {
        book.bids[0] = [order.price, order.available_amount];
        for (const trade of trades) {
            let priceExsit = false;
            for (const ask of book.asks) {
                if (trade.price === ask[0]) {
                    ask[1] = NP.minus(ask[1],trade.amount);
                    priceExsit = true;
                    break;
                }
            }
            if (!priceExsit) book.asks.push([trade.price, -trade.amount]);
        }

    } else {
        console.error(`${order.side} must be sell or buy`)

    }
    return book;
}

class AdexEngine {

    private orderQueue: Queue.Queue;
    private orderBookUpdateQueue: Queue.Queue;
    private lastTradesQueue: Queue.Queue;
    private db: DBClient;
    private exchange: Engine;
    private utils: Utils;

    constructor() {
        this.db = new DBClient();
        this.exchange = new Engine(this.db);
        this.utils = new Utils();
        this.initQueue();
    }

    async initQueue(): Promise<void> {
        if (this.orderQueue) {
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

        this.orderBookUpdateQueue = new Queue('OrderBookUpdate' + process.env.MIST_MODE,
            {
                redis: {
                    port: Number(process.env.REDIS_PORT),
                    host: process.env.REDIS_URL,
                    password: process.env.REDIS_PWD
                }
            });

        this.lastTradesQueue = new Queue('LastTrades' + process.env.MIST_MODE,
            {
                redis: {
                    port: Number(process.env.REDIS_PORT),
                    host: process.env.REDIS_URL,
                    password: process.env.REDIS_PWD
                }
            });

        this.orderQueue.on('error', async e => {
            console.log('[ADEX ENGINE] Queue on Error', e);
            console.log('[ADEX ENGINE] Trying initQueue...')
            await this.initQueue();
        })

        this.start();
    }

    async start(): Promise<void> {
        this.orderQueue.process(async (job, done) => {
            console.log(`[ADEX ENGINE]receive a message %o from OrderQueue${process.env.MIST_MODE} \n`, job.data);
            const message = job.data;

            const create_time = this.utils.get_current_time();
            message.created_at = create_time;
            message.updated_at = create_time;
            const lastTrades = [];
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
                    const trade: ILastTrade = {
                        price: item.price,
                        amount: item.amount,
                        taker_side: item.taker_side,
                        updated_at: item.updated_at
                    }
                    lastTrades.push(trade);
                }

                message.available_amount = NP.minus(message.available_amount, amount);
                message.pending_amount = NP.plus(message.pending_amount, amount);
            }
            const marketLastTrades = {
                data:lastTrades,
                id:message.market_id,
            }
            const [lastTradesAddErr, lastTradesAddResult] = await to(this.lastTradesQueue.add(marketLastTrades));
            if (lastTradesAddErr) console.error('[ADEX ENGINE]:lastTrade add queue failed %o\n', lastTradesAddErr);

            const book = computeOrderBookUpdates(lastTrades, message);
            const  marketUpdateBook = {
                data: book,
                id:message.market_id,
            }
            const [orderBookUpdateQueueErr, orderBookUpdateQueueResult] = await to(this.orderBookUpdateQueue.add(marketUpdateBook));
            if (orderBookUpdateQueueErr) console.error('[ADEX ENGINE]:orderBookUpdateQueue failed %o\n', orderBookUpdateQueueErr);

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

        if (queueReady) {
            console.log(`[ADEX ENGINE] started,order queue ready:`);
        }
    }

}

process.on('unhandledRejection', (reason, p) => {
    console.log('[ADEX ENGINE] Unhandled Rejection at: Promise', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
});

export default new AdexEngine();
