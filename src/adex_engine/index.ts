import * as Queue from 'bull';
import NP from 'number-precision';
import to from 'await-to-js';

import { Logger } from '../common/Logger';
import LogUnhandled from '../common/LogUnhandled';
import DBClient from '../adex/models/db';
import Engine from '../adex/api/engine';
import Order from '../adex/api/order';

import Utils from '../adex/api/utils';
import MistWallet from '../adex/api/mist_wallet';

import { IOrder, IOrderBook, ILastTrade } from '../adex/interface';

import { BullOption,OrderQueueConfig } from '../cfg';
import { get_available_erc20_amount } from '../adex';
import * as redis from 'redis';
import {promisify} from 'util';
import {errorCode} from '../error_code';

const QueueNames = {
    OrderQueue: 'OrderQueue' + process.env.MIST_MODE,
    AddOrderBookQueue: 'addOrderBookQueue',
    AddTradesQueue: 'addTradesQueue',
};


const FREEZE_PREFIX = 'freeze::';

async function updateFreeze(trader_address, amount, price, side, market_id, redisClient): Promise<void> {
    let [baseToken, quoteToken] = market_id.split('-');
    quoteToken = FREEZE_PREFIX + quoteToken;
    baseToken = FREEZE_PREFIX + baseToken;
    const hgetAsync = promisify(redisClient.hget).bind(redisClient);
    if (side === 'buy') {
        const quoteRes = await hgetAsync(trader_address, quoteToken);
        const quoteAmount = +quoteRes.toString();
        await redisClient.HMSET(trader_address, quoteToken, NP.plus(quoteAmount, NP.times(price, amount)));
    } else if (side === 'sell') {
        const baseRes = await hgetAsync(trader_address, baseToken);
        const baseAmount = +baseRes.toString();
        await redisClient.HMSET(trader_address, baseToken, NP.plus(baseAmount, amount));
        // tslint:disable-next-line:no-empty
    } else {
    }
    return;
}

// tslint:disable-next-line:no-shadowed-variable
function computeOrderBookUpdates(
    trades: ILastTrade[],
    order: IOrder
): IOrderBook {
    const book: IOrderBook = {
        asks: [],
        bids: [],
    };
    if (order.side === 'sell') {
        if(order.available_amount !== 0) {
            book.asks[0] = [order.price, order.available_amount];
        }
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
            if (!priceExsit && trade.amount !== 0) book.bids.push([trade.price, -trade.amount]);
        }
    } else if (order.side === 'buy') {
        if(order.available_amount !== 0) {
            book.bids[0] = [order.price, order.available_amount];
        }
        for (const trade of trades) {
            let priceExsit = false;
            for (const ask of book.asks) {
                if (trade.price === ask[0]) {
                    ask[1] = NP.minus(ask[1], trade.amount);
                    priceExsit = true;
                    break;
                }
            }
            if (!priceExsit && trade.amount !== 0) book.asks.push([trade.price, -trade.amount]);
        }
    } else {
        this.logger.log(`${order.side} must be sell or buy`);
    }
    return book;
}

interface IEngineStatus {
    totalMatched:number,
    waitingJobs:number,
    startTime:Date,
    workingTime:number,
    ordersPerMin:number,
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
    private order: Order;
    // 5分钟无log输出会杀死进程。
    private logger: Logger = new Logger(AdexEngine.name, 5 * 60 * 1000);
    private status: IEngineStatus = {
        totalMatched:0,
        waitingJobs:0,
        startTime:new Date(),
        workingTime:0,
        ordersPerMin:0,
    }
    private redisClient;

    constructor() {
        this.db = new DBClient();
        this.exchange = new Engine(this.db);
        this.utils = new Utils();
        this.mistWallat = new MistWallet(this.db);
        this.order = new Order(this.db);
        if (typeof BullOption.redis !== 'string') {
            this.redisClient = redis.createClient(BullOption.redis.port, BullOption.redis.host);
            this.redisClient.auth(BullOption.redis.password);
        }
    }

    async initQueue(): Promise<void> {
        if (this.orderQueue) {
            await this.orderQueue.close();
        }
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
            return this.worker(job, done);
        });

        const queueReady = await this.orderQueue.isReady();
        if ( queueReady ) {
            // await this.orderQueue.resume();
            this.logger.log(`[ADEX ENGINE] started,order queue ready:`);
        }

    }

    async worker(job, done): Promise<any> {
        const jobStarted = new Date().getTime();
        this.status.workingTime = jobStarted - this.status.startTime.getTime();
        this.status.waitingJobs = await this.orderQueue.getWaitingCount();

        const message = job.data;
        if(message.status === 'cancled'){
            const orderInfo: IOrder[] = await this.order.get_order(message.id);
            if (!orderInfo || orderInfo.length <= 0) {
                console.error('[MIST_ENGINE]:get order failed',message.id);
                done();
                return;
            }
            if(orderInfo[0].available_amount <= 0){
                console.error('[MIST_ENGINE]:[CANCLE]:cancled order have no available amount ',orderInfo[0]);
                done();
                return;
            }
            // 取消金额以实际剩下的为准
            message.amount = orderInfo[0].available_amount;
            console.log('[CANCLE]cancleding cancled get order',orderInfo[0],this.utils.get_current_time());
            const [cancleOrderErr,cancleOrderRes] = await to(this.order.cancle_order(message,this.redisClient));
            if(cancleOrderErr){
                console.error('[MIST_ENGINE]:cancle_order failed',message);
            }
            console.log('[CANCLE]finished cancled',message,this.utils.get_current_time());
            done();
            return;
        }
        this.logger.log(
            `[ADEX ENGINE] Message ${message.market_id} from OrderQueue${process.env.MIST_MODE}`
        );


        let checkAvailableRes = true;
        if(this.status.waitingJobs < OrderQueueConfig.maxWaiting * 2 ){
            checkAvailableRes = await this.checkOrderAvailability(message);
        } else {
            // TODO 这里暂时当任务过多时候，跳过检测，并做了一些冗余的判断，HA进程小于 OrderQueueConfig.maxWaiting 个一般不会出现这问题
            if( this.status.waitingJobs > OrderQueueConfig.maxWaiting * 10 ){
                this.logger.log(`Warning Order list > ${OrderQueueConfig.maxWaiting * 10} ,cleanup all orders in queue!`);
                await this.orderQueue.pause();
                await this.orderQueue.empty();
                await this.orderQueue.resume();
                this.logger.log(`Order list cleanup finished.`);
                this.status.waitingJobs = 0;
                done();
                return;
            } else {
                // 跳过检测会导致撮合结果合约执行失败，目前对失败对的订单没有反向处理，直接标记failed。
                this.logger.log(`Warning too many jobs:${this.status.waitingJobs},balance checking skipped`);
            }

        }
        if (!checkAvailableRes) {
            // 直接抹掉非法订单
            this.logger.log(`[ADEX ENGINE]:order %o check available failed`, message);
            done();
            return;
        }

        await updateFreeze(message.trader_address, message.amount, message.price, message.side, message.market_id, this.redisClient);
        const create_time = this.utils.get_current_time();
        message.created_at = create_time;
        message.updated_at = create_time;
        const lastTrades = [];
        // 每次匹配100单，超过300的二次匹配直到匹配不到挂单
        await this.db.begin();
        while (message.available_amount > 0) {
            const [find_orders_err, find_orders] = await to(
                this.exchange.match(message,this.redisClient)
            );

            if (!find_orders) {
                this.logger.log(
                    '[ADEX ENGINE]:match orders error',
                    find_orders_err,
                    find_orders
                );
                await this.db.rollback();
                done(find_orders_err);
                return;
            }

            if (find_orders.length === 0) {
                break;
            }
            this.status.totalMatched += find_orders.length;

            const [trades_err, trades] = await to(
                this.exchange.makeTrades(find_orders, message)
            );
            if (!trades) {
                this.logger.log('make trades', trades_err, trades);
                await this.db.rollback();
                done(trades_err);
                return;
            }

            const [call_asimov_err, call_asimov_result] = await to(
                this.exchange.call_asimov(trades)
            );
            if (call_asimov_err) {
                this.logger.log('call asimov', call_asimov_err, call_asimov_result);
                await this.db.rollback();
                done(call_asimov_err);
                return;
            }

            let amount = 0;
            for (const item of trades) {
                amount = NP.plus(amount, item.amount);
                const trade: ILastTrade = {
                    price: item.price,
                    amount: item.amount,
                    taker_side: item.taker_side,
                    updated_at: new Date(),
                };
                lastTrades.push(trade);
            }

            message.available_amount = NP.minus(message.available_amount, amount);
            message.pending_amount = NP.plus(message.pending_amount, amount);
        }
        if (lastTrades.length > 0) {
            const marketLastTrades = {
                data: lastTrades,
                id: message.market_id,
            };
            const [lastTradesAddErr, lastTradesAddResult] = await to(
                this.addTradesQueue.add(marketLastTrades, { removeOnComplete: true })
            );
            this.logger.log(
                '[ADEX ENGINE] New Trades Matched %o,queue id %o ',
                marketLastTrades,
                lastTradesAddResult.id
            );
            if (lastTradesAddErr)
                this.logger.log(
                    '[ADEX ENGINE]:lastTrade add queue failed %o',
                    lastTradesAddErr
                );
        }
        const book = computeOrderBookUpdates(lastTrades, message);
        const marketUpdateBook = {
            data: book,
            id: message.market_id,
        };
        const [orderBookQueueErr, orderBookQueueResult] = await to(
            this.orderBookQueue.add(marketUpdateBook, { removeOnComplete: true })
        );
        if (orderBookQueueErr){
            this.logger.log(
                '[ADEX ENGINE]:orderBookUpdateQueue failed %o', orderBookQueueErr
            );
        }

        if (message.pending_amount === 0) {
            message.status = 'pending';
        } else if (message.available_amount === 0) {
            message.status = 'full_filled';
        } else {
            message.status = 'partial_filled';
        }
        const arr_message = this.utils.arr_values(message);
        const [insert_order_err, insert_order_result] = await to(
            this.db.insert_order_v2(arr_message)
        );
        if (!insert_order_result) {
            this.logger.log(
                `[ADEX ENGINE] insert_order_err`,
                insert_order_err,
                insert_order_result
            );
            await this.db.rollback();
            done(insert_order_err);
            return;
        }
        await this.db.commit();
        const jobFinished = new Date().getTime();
        this.status.ordersPerMin = this.status.totalMatched/(this.status.workingTime/1000/60)
        this.logger.log(`Job finished in ${jobFinished-jobStarted}ms,${this.status}`);

        done();
    }

    async checkOrderAvailability(order: IOrder): Promise<boolean> {
        const { trader_address, price, side, market_id, amount } = order;
        const [base_token, quota_token] = market_id.split('-');
        const checkToken = side === 'buy' ? quota_token : base_token;

        const availableCheckAmount = await get_available_erc20_amount(
            trader_address,
            checkToken,
            this.db,
            this.mistWallat,
            this.redisClient
        );

        const orderAmount = side === 'buy' ? amount * price : amount;
        return orderAmount <= availableCheckAmount ? true : false;
    }
}

LogUnhandled(AdexEngine.name);

const engine = new AdexEngine();
engine.initQueue();
