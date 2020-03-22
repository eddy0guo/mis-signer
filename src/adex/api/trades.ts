import to from 'await-to-js';
import date = require('silly-datetime');

import {restore_order} from './order';
import {ITrade} from '../interface';
import DBClient from '../models/db';


export default class trades {
    private db:DBClient;


    constructor(client:DBClient) {
        this.db = client;
    }
    async list_trades(marketID: string): Promise<ITrade[]> {
        return await this.db.list_trades([marketID]);
    }

    async my_trades_length(address: string, start:string, end:string): Promise<number> {
        return await this.db.my_trades_length([address,start,end]);
    }

    async my_trades(message): Promise<ITrade[]> {
        return  await this.db.my_trades([message.address]);

    }

    async my_trades2(address:string, page:string, perPage:string,MarketID?: string | undefined) : Promise<ITrade[]> {
        const offset = (+page - 1) * +perPage;
        // tslint:disable-next-line:no-shadowed-variable
        let [err, trades] = [null,null];
        if(MarketID) {
            [err, trades] = await to(this.db.my_trades3([address, offset, perPage, MarketID]));
        }
        else{
            [err, trades] = await to(this.db.my_trades2([address, offset, perPage]));
        }
        if (!trades) console.error(err, trades);
        return trades;
    }
    // address, page, per_page,startDate, endDate, market_id, status
    async my_trades4(address:string, page:number, perPage:number,start:Date,end:Date,MarketID: string,status:string) : Promise<ITrade[]> {
        const offset = (page - 1) * perPage;
        const filter = [address, offset, perPage,start,end,MarketID,status];
        // tslint:disable-next-line:no-shadowed-variable
        const [err, trades] = await to(this.db.my_trades4(filter));
        if (!trades) console.error(err, trades);
        return trades;
    }

    async trading_view(message) {
        const bar_length = (message.to - message.from) / message.granularity;
        const bars = [];
        for (let i = 0; i < bar_length; i++) {
            const from = date.format(new Date((message.from + message.granularity * i) * 1000), 'YYYY-MM-DD HH:mm:ss');
            const to_time = date.format(new Date((message.from + message.granularity * (i + 1)) * 1000), 'YYYY-MM-DD HH:mm:ss');
            const filter_info = [message.market_id, from, to_time];
            const trades_by_time = await this.db.sort_trades(filter_info, 'created_at');
            const trades_by_price = await this.db.sort_trades(filter_info, 'price');

            let volume = 0;
            for (const item of trades_by_price) {
                volume += +item.amount;
            }

            let open = 0;
            let close = 0;
            let high = 0;
            let low = 0;

            if (trades_by_time.length !== 0) {
                open = trades_by_time[0].price;
                close = trades_by_time.pop().price;
                high = trades_by_price[0].price;
                low = trades_by_price.pop().price;
            }

            const bar = {
                time: from,
                open,
                close,
                low,
                high,
                volume,
            };
            bars.push(bar);
        }
        return bars;
    }

    // 应该先停laucher的线程，再回滚，否则可能出现已经launched的也回滚了
    async rollback_trades() : Promise<void>{
        let matchedNum = 0;
        do {
            console.log('Began to roll back');
            const matched_trades = await this.db.get_matched_trades();
            for (const item of matched_trades) {
                restore_order(this.db,item.taker_order_id, item.amount);
                restore_order(this.db,item.maker_order_id, item.amount);
            }
            await this.db.delete_matched_trades();
            matchedNum = matched_trades.length;
            console.log(`Complete 5,000 rolls back`)
        }while (matchedNum === 5000)
        console.log(`finished rollbacks`);
    }
    // tmp code
    async rollback_zero() : Promise<void>{
        let matchedNum = 0;
        do {
            console.log('Began to roll back');
            const matched_trades = await this.db.get_zero_trades();
            await this.db.delete_zero_trades();
            matchedNum = matched_trades.length;
            console.log(`Complete 5,000 rolls back`)
        }while (matchedNum === 5000)
        console.log(`finished rollbacks`);
    }
}
