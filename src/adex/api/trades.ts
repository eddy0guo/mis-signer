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
    async my_trades(message): Promise<ITrade[]> {
        return  await this.db.my_trades([message.address]);

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
