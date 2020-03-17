import DBClient from '../models/db';
import NP from '../../common/NP';

import Utils from './utils';
import to from 'await-to-js';

import * as Queue from 'bull';
import * as process from 'process';
import {IOrder, IOrderBook} from '../interface';
import {BullOption} from '../../cfg';

export default class order {

    private db:DBClient;
    private orderQueue:Queue.Queue;
    private orderBookUpdateQueue:Queue.Queue;
    private utils:Utils;

    constructor(client) {
        this.db = client;
        this.utils = new Utils();
        this.createQueue();
    }

    createQueue() : Queue.Queue {
        this.orderQueue = new Queue('OrderQueue' + process.env.MIST_MODE,BullOption);
        this.orderBookUpdateQueue = new Queue('addOrderBookQueue',BullOption);

        this.orderQueue.on('error', async e => {
            console.log('[SIGNER_API] Queue on Error', e);
            console.log('[SIGNER_API] Goodbye...');

            // kill instance when queue on error
            process.exit(-1);
        });

        this.orderBookUpdateQueue.on('error', async e => {
            console.log('[SIGNER_API] Queue on Error', e);
            console.log('[SIGNER_API] Goodbye...');

            // kill instance when queue on error
            process.exit(-1);
        });

        return this.orderQueue;
    }

    private async checkQueueStatus() : Promise<boolean>{
        const job = await this.orderQueue.add(null, {removeOnComplete: true, delay: 9999});
        await job.remove();
        return true;
    }

    async queueWaitingCount() : Promise<number>{
        const [err, num] = await to(this.orderQueue.getWaitingCount());
        if( err ) {
            return Number.MAX_SAFE_INTEGER;
        }
        return num;
    }

    async build(message): Promise<any> {
        /*暂时这块业务没做先去掉此逻辑
        let mist_user = await this.db.find_user([message.trader_address]);
        if (!mist_user[0]) {
            let address_info = {
                address: message.trader_address,
            }
            let result = await this.db.insert_users(this.utils.arr_values(address_info));
        }
        */
       // Hack Status checking , remove first
        // const [statusErr, res] = await to(this.checkQueueStatus());
        // if (statusErr || !res) {
        //     console.log('[ADEX API] Queue Status Error:', statusErr);
        //     this.createQueue();
        // }

        const [err, job] = await to(this.orderQueue.add(message,{removeOnComplete: true}));
        if (err) {
            console.log('[ADEX API] Queue Error:', err);
            throw err;
        }
        return job;
    }

    async cancle_order(message) : Promise<any[]>{

        const create_time = this.utils.get_current_time();
        const cancle_info = [-message.amount, 0, message.amount, 0, 'cancled', create_time, message.id];
        const [err, result] = await to(this.db.update_orders(cancle_info));
        if (err) {
            console.error(err, result);
        }
        let book;
        if(message.side === 'buy'){
            book = {
                asks:[],
                bids:[[message.price,-message.amount]]
            }
        }else{
            book = {
                asks:[[message.price,-message.amount]],
                bids:[]
            }
        }

        const marketUpdateBook = {
            data: book,
            id:message.market_id,
        }
        const [orderBookUpdateQueueErr, orderBookUpdateQueueResult] = await to(this.orderBookUpdateQueue.add(marketUpdateBook,{removeOnComplete: true}));
        if (orderBookUpdateQueueErr) {
            console.error('[ADEX ENGINE]:orderBookUpdateQueue failed %o\n', orderBookUpdateQueueErr);
        }


        return result;
    }
    async my_orders(address:string, page:number, perPage:number, status1:string, status2:string,MarketID?: string | undefined):Promise<IOrder[]> {
        const offset = (page - 1) * perPage;
        // @ts-ignore
        let [err,orders] = [null,null];
        if(MarketID) {
            [err, orders] = await to(this.db.my_orders3([address, offset, perPage, status1, status2,MarketID]));
        }
        else{
            [err, orders] = await to(this.db.my_orders2([address, offset, perPage, status1, status2]));
        }
        if (!orders) {
            console.error(err, orders);
            return orders;
        }

        for (const oneOrder of orders) {

            const trades:any[] = await this.db.order_trades([oneOrder.id]);
            if (trades.length === 0) {
                oneOrder.average_price = '--';
                oneOrder.confirm_value = '--';
                continue;
            }
            let amount = 0;
            let value = 0;
            for (const trade of trades) {
                amount = NP.plus(amount, trade.amount);
                const trade_value = NP.times(trade.amount, trade.price);
                value = NP.plus(value, trade_value);
            }
            oneOrder.average_price = NP.divide(value, amount).toFixed(8);
            oneOrder.confirm_value = value.toFixed(8);
        }

        return orders;
    }

    async my_orders_length(address:string, status1:string, status2:string) : Promise<number>{
        const result = await this.db.my_orders_length([address, status1, status2]);
        return result;
    }

    async order_book(marketID:string, precision:string) : Promise<IOrderBook>{
        const result =  await this.db.get_order_book_tmp([marketID,precision]);
        const bookObj = JSON.parse(result[0].order_book);
        return bookObj;
    }

    async order_book_v2(marketID:string, precision:string) : Promise<IOrderBook>{

        const asks = await this.db.order_book(['sell', marketID, precision]);
        const bids = await this.db.order_book(['buy', marketID, precision]);

        const asks_arr = [];
        const bids_arr = [];
        for (const item of asks) {
            if (!item) continue
            const askPriceAdd  =  NP.divide(1, Math.pow(10, +precision));
            item.price = NP.plus(item.price, askPriceAdd).toFixed(+precision).toString();
            asks_arr.push(this.utils.arr_values(item));
        }

        for (const item2 of bids) {
            if (!item2) continue
            bids_arr.push(this.utils.arr_values(item2));
        }

        const order_book = {
            asks: asks_arr.reverse(),
            bids: bids_arr,
        };
     //   console.log(order_book);
        return order_book;
    }

    async get_order(order_id:string) : Promise<IOrder[]>{
        return await this.db.find_order([order_id]);
    }

}

// 回滚没有打包成功的交易,不过吃单变成了挂单，等别人吃
export async function restore_order(db, order_id, amount) {
    const utils = new Utils();
    const update_time = utils.get_current_time();
    const current_order = await db.find_order([order_id]);

    const status = current_order[0].available_amount + amount < current_order[0].amount ? 'partial_filled' : 'pending';
    const update_orders_info = [amount, 0, 0, -amount, status, update_time, order_id];
    await db.update_orders(update_orders_info);
}
