import * as Queue from 'bull';
import NP from 'number-precision';
import to from 'await-to-js';

import {Logger} from '../common/Logger';

import DBClient from '../adex/models/db';
import Engine from '../adex/api/engine';
import Utils from '../adex/api/utils';
import MistWallet from '../adex/api/mist_wallet';


import {
    IOrder, IOrderBook, ILastTrade,
} from '../adex/interface';
import {Health} from '../common/Health'

import {BullOption} from '../cfg';
import {get_available_erc20_amount} from '../adex';

const QueueNames = {
    OrderQueue: 'OrderQueue' + process.env.MIST_MODE,
    AddOrderBookQueue: 'addOrderBookQueue',
    AddTradesQueue: 'addTradesQueue',
}

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
                    bid[1] = NP.minus(bid[1], trade.amount);
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
                    ask[1] = NP.minus(ask[1], trade.amount);
                    priceExsit = true;
                    break;
                }
            }
            if (!priceExsit) book.asks.push([trade.price, -trade.amount]);
        }

    } else {
        this.logger.log(`${order.side} must be sell or buy`)

    }
    return book;
}

/**
 * Order flow : client->[signer]->[OrderQueue]->[adex-engine]->[adex-launch]->[adex-watcher]
 *
 * OrderQueue Consumer.
 * It pushes new jobs into 'addOrderBookQueue' and 'addTradesQueue' before new record insterted into db.
 *
 * The Consumer of 'addOrderBookQueue' and 'addTradesQueue' is 'Mist-Socket-Server'
 *
 */
class AdexEngine {

    private orderQueue: Queue.Queue;
    private orderBookQueue: Queue.Queue;
    private addTradesQueue: Queue.Queue;
    private db: DBClient;
    private exchange: Engine;
    private utils: Utils;
    private mistWallat: MistWallet;
    // 5分钟无log输出会杀死进程。
    private logger:Logger = new Logger(AdexEngine.name,5*60*1000);

    constructor() {
        this.db = new DBClient();
        this.exchange = new Engine(this.db);
        this.utils = new Utils();
        this.mistWallat = new MistWallet(this.db);
    }

    async initQueue(): Promise<void> {
        if (this.orderQueue) {
            await this.orderQueue.close();
        }
        ;

        const option: Queue.QueueOptions = BullOption;

        this.orderQueue = new Queue(QueueNames.OrderQueue, option);
        this.orderBookQueue = new Queue(QueueNames.AddOrderBookQueue, option);
        this.addTradesQueue = new Queue(QueueNames.AddTradesQueue, option);

        this.orderQueue.on('error', async e => {
            this.logger.log('[ADEX ENGINE] Queue on Error', e);
            this.logger.log('[ADEX ENGINE] Goodbye...');

            // kill instance when queue on error
            process.exit(-1);
        });

        this.start();
    }

    async start(): Promise<void> {
        this.orderQueue.process(async (job, done) => {

            const message = job.data;
            this.logger.log(`[ADEX ENGINE] Message %o from OrderQueue${process.env.MIST_MODE} \n`, message.market_id);
            const checkAvailableRes =  await  this.checkOrderAvailability(message);
            if(!checkAvailableRes){
                // todo:临时方案直接抹掉
                this.logger.log(`[ADEX ENGINE]:order %o check available failed`,message);
                done();
                return;
            }

            const create_time = this.utils.get_current_time();
            message.created_at = create_time;
            message.updated_at = create_time;
            const lastTrades = [];
            // 每次匹配100单，超过300的二次匹配直到匹配不到挂单
            await this.db.begin();
            while (message.available_amount > 0) {

                const [find_orders_err, find_orders] = await to(this.exchange.match(message));

                if (!find_orders) {
                    this.logger.log('[ADEX ENGINE]:match orders', find_orders_err, find_orders);
                    await this.db.rollback();
                    done(new Error(find_orders_err));
                    return;
                }

                if (find_orders.length === 0) {
                    break;
                }

                const [trades_err, trades] = await to(this.exchange.make_trades(find_orders, message));
                if (!trades) {
                    this.logger.log('make trades', trades_err, trades);
                    await this.db.rollback();
                    done(new Error(trades_err));
                    return;
                }

                const [call_asimov_err, call_asimov_result] = await to(this.exchange.call_asimov(trades));
                if (call_asimov_err) {
                    this.logger.log('call asimov', call_asimov_err, call_asimov_result);
                    await this.db.rollback();
                    done(new Error(call_asimov_err));
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
            if (lastTrades.length > 0) {
                const marketLastTrades = {
                    data: lastTrades,
                    id: message.market_id,
                }
                const [lastTradesAddErr, lastTradesAddResult] = await to(this.addTradesQueue.add(marketLastTrades,{removeOnComplete: true}));
                this.logger.log('[ADEX ENGINE] New Trades Matched %o,queue id %o ', marketLastTrades, lastTradesAddResult.id);
                if (lastTradesAddErr) this.logger.log('[ADEX ENGINE]:lastTrade add queue failed %o\n', lastTradesAddErr);
            }
            const book = computeOrderBookUpdates(lastTrades, message);
            const marketUpdateBook = {
                data: book,
                id: message.market_id,
            }
            const [orderBookQueueErr, orderBookQueueResult] = await to(this.orderBookQueue.add(marketUpdateBook,{removeOnComplete: true}));
            if (orderBookQueueErr) this.logger.log('[ADEX ENGINE]:orderBookUpdateQueue failed %o\n', orderBookQueueErr);
            this.logger.log('[ADEX ENGINE] New orderBookQueue %o,queue id  %o', marketUpdateBook, orderBookQueueResult.id);
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
                this.logger.log(`[ADEX ENGINE] insert_order_err`, insert_order_err, insert_order_result);
                await this.db.rollback();
                done(new Error(insert_order_err));
                return;
            }
            await this.db.commit();
            done()
        });
        const queueReady = await this.orderQueue.isReady();

        if (queueReady) {
            this.logger.log(`[ADEX ENGINE] started,order queue ready:`);
        }
    }
    async checkOrderAvailability(order:IOrder) : Promise<boolean>{
        const {trader_address,price,side,market_id,amount} = order;
        const [base_token, quota_token] = market_id.split('-');
        const checkToken =  side === 'buy' ? quota_token:base_token;

        const availableCheckAmount = await get_available_erc20_amount(
            trader_address,
            checkToken,
            this.db,
            this.mistWallat
        );

        const orderAmount = side === 'buy' ? (amount * price):amount;
        return orderAmount <= availableCheckAmount ? true : false;
    }

}

process.on('unhandledRejection', (reason, p) => {
    this.logger.log('[ADEX ENGINE] Unhandled Rejection at: Promise reason:', reason);
    // application specific logging, throwing an error, or other logic here
});

const health = new Health();
health.start();

const engine = new AdexEngine();
engine.initQueue();
