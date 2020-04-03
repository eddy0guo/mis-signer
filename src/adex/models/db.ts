import to from 'await-to-js';
import mist_config from '../../cfg';
import {Pool} from 'pg';
import {
    IOrder, ITrade, IToken, IMarket, ITransaction,
    IBridge, IPrice, IMarketQuotation, IFreezeToken
} from '../interface';

const BRIDGE_SQL = 'id,address,token_name,cast(amount as float8),side,master_txid,master_txid_status,child_txid,child_txid_status,fee_asset,fee_amount,updated_at,created_at';

export default class DBClient {

    private clientDB: Pool;

    constructor() {
        this.createPool();
    }

    createPool() {
        console.log('[ADEX DB] create pool at:', new Date().toLocaleString());
        const client: Pool = new Pool({
            host: mist_config.pg_host,
            database: mist_config.pg_database,
            user: mist_config.pg_user,
            password: mist_config.pg_password,
            port: mist_config.pg_port,
        });
        client.on('error', async (err: any) => {
            console.error('An idle client has experienced an error,kill process and relaunch, goodbye...', err.stack)
            // Maybe you shold kill the process
            process.exit(-1);
            // await client.end();
            // this.createPool();
        })
        this.clientDB = client;
    }

    async queryWithLog(sql:string,params?:any[]):Promise<any[]> {
        const start = new Date().getTime();
        const [err, result]: [any, any] = await to(this.clientDB.query(sql, params));
        if (err) {
            console.error(`queryWithLog Error ${err}`);
            await this.handlePoolError(err);
        }
        const end = new Date().getTime();
        const second = (end - start)/1000;
        if( second > 1 ){
            console.log(`QueryWithLog Query_Time:${second}s sql:${sql} params:${params}`)
        }

        return result;
    }


    async compat_query(sql): Promise<object[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog(sql));
        if (err) {
            console.error('compat_query failed', err, sql);
            throw new Error(err);
        }
        return result.rows;

    }

    async handlePoolError(err: Error) {
        // await this.clientDB.end();
        // this.createPool();
        throw err;
    }

    async begin(): Promise<IFreezeToken[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('begin'));
        if (!result) {
            console.error('begin_failed', err);
            process.exit(-1);
        }
        return;
    }

    async commit(): Promise<void> {
        const [err, result]: [any, any] = await to(this.queryWithLog('commit'));
        if (!result) {
            console.error('commit_failed', err);
            process.exit(-1);
        }
        return;
    }

    async rollback(): Promise<void> {
        const [err, result]: [any, any] = await to(this.queryWithLog('rollback'));
        if (!result) {
            console.error('rollback_failed,', err);
            await this.handlePoolError(err);
            process.exit(-1);
        }
        return;
    }

    async cleanupTempOrders() {
        // 临时表trade数据不能删完，保留一组定序
        const topTradeSql = `select * from mist_trades_tmp order by created_at desc limit 1`;
        const topTrade = await this.queryWithLog(topTradeSql);
        const sql1 = `delete from mist_trades_tmp where (current_timestamp - created_at) > '25 hours' and transaction_id < ${topTrade[0].transaction_id}`;
        const sql2 = `delete from mist_orders_tmp where available_amount=0;`
        await this.queryWithLog(sql1);
        await this.queryWithLog(sql2);
    }

    /**
     *orders
     *
     */
    async insert_order(orderMessage: any[]): Promise<string> {
        const [err, result]: [any, any] = await to(this.queryWithLog('insert into mist_orders values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)', orderMessage));
        if (err) {
            console.error(`insert_order_faied ${err},insert data= ${orderMessage}`);
            await this.handlePoolError(err);
        }

        const [err_tmp, result_tmp]: [any, any] = await to(this.queryWithLog('insert into mist_orders_tmp values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)', orderMessage));
        if (err_tmp) {
            console.error(`insert_order_tmp_faied ${err_tmp},insert data= ${orderMessage}`, result_tmp);
            await this.handlePoolError(err_tmp);
        }

        return JSON.stringify(result.rows);
    }

    async insert_order_v2(orderMessage: any[]): Promise<string> {
        const [err, result]: [any, any] = await to(this.queryWithLog('insert into mist_orders values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)', orderMessage));
        if (err) {
            console.error(`insert_order_v2 faied ${err},insert data= ${orderMessage}`);
            await this.handlePoolError(err);
        }

        const [err_tmp, result_tmp]: [any, any] = await to(this.queryWithLog('insert into mist_orders_tmp values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)', orderMessage));
        if (err_tmp) {
            console.error(`insert_order_v2_tmp faied ${err_tmp},insert data= ${orderMessage}`, result_tmp);
            await this.handlePoolError(err_tmp);
        }

        return JSON.stringify(result.rows);
    }


    async my_orders(address): Promise<IOrder[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('SELECT * FROM mist_orders where trader_address=$1 order by updated_at desc limit 30', address));
        if (err) {
            console.error('my_order_failed', err, address);
            await this.handlePoolError(err);
        }
        return result.rows;
    }

    async my_orders_length(info): Promise<number> {
        const [err, result]: [any, any] = await to(this.queryWithLog('SELECT count(1) FROM mist_orders where trader_address=$1 and status in ($2,$3) and created_at>$4 and created_at<$5', info));
        if (err) {
            console.error('my_order_length failed', err);
            await this.handlePoolError(err);
        }

        return result.rows[0].count;

    }
    // [address, status1, status2, startDate, endDate,market_id, side];
    async my_orders_length_v2(filter): Promise<number> {
        let marketFilter = 'and market_id=$6 ';
        if(filter[5] === ''){
            filter.splice(5,1);
            marketFilter = '';
        }

        let sideFilter = 'and side=$7 ';
        if(filter[6] === ''){
            filter.splice(6,1);
            sideFilter = '';
        }

        const sql = `SELECT count(1) FROM mist_orders where trader_address=$1 and status in ($2,$3) and created_at>$4 and created_at<$5 ${marketFilter} ${sideFilter}`;
        const [err, result]: [any, any] = await to(this.queryWithLog(sql, filter));
        if (err) {
            console.error('my_orders_length_v2 failed', err);
            await this.handlePoolError(err);
        }

        return result.rows[0].count;

    }


    async my_bridge_length(filter): Promise<number> {
        const [err, result]: [any, any] = await to(this.queryWithLog('SELECT count(1) FROM mist_bridge where address=$1 and created_at>$2 and created_at<$3', filter));
        if (err) {
            console.error('my_bridge_length failed ', err, filter);
            await this.handlePoolError(err);
        }

        return result.rows[0].count;

    }


    async my_bridge_length_v2(filter): Promise<number> {
        let tokenFilter = 'and token_name=$4 ';
        if(filter[3] === ''){
            filter.splice(3,1);
            tokenFilter = '';
        }
        const sql = `SELECT count(1) FROM mist_bridge where address=$1 and created_at>$2 and created_at<$3 ${tokenFilter}`;
        const [err, result]: [any, any] = await to(this.queryWithLog(sql, filter));
        if (err) {
            console.error('my_bridge_length_v2 failed ', err, sql,filter);
            await this.handlePoolError(err);
        }

        return result.rows[0].count;

    }

    async my_trades_length(info): Promise<number> {
        const [err, result]: [any, any] = await to(this.queryWithLog('SELECT count(1) FROM mist_trades where created_at>$2 and created_at<$3 and (taker=$1 or maker=$1)', info));
        if (err) {
            console.error('my_trades_length failed', err);
            await this.handlePoolError(err);
        }

        return result.rows[0].count;

    }
    // address, startDate, endDate, market_id, status
    async my_trades_length_v2(filter): Promise<number> {
        let marketFilter = 'and market_id=$4 ';
        if(filter[3] === ''){
            filter.splice(3,1);
            marketFilter = '';
        }

        let statusFilter = 'and status=$5 ';
        if(filter[4] === ''){
            filter.splice(4,1);
            statusFilter = '';
        }
        const sql = `SELECT count(1) FROM mist_trades where (taker=$1 or maker=$1) and created_at>$2 and created_at<$3 ${marketFilter} ${statusFilter}`;

        const [err, result]: [any, any] = await to(this.queryWithLog(sql, filter));
        if (err) {
            console.error('my_trades_length_v2 failed', err);
            await this.handlePoolError(err);
        }

        return result.rows[0].count;

    }

    async my_orders2(filter_info): Promise<IOrder[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('SELECT * FROM mist_orders where trader_address=$1 and (status=$4 or status=$5)order by updated_at desc limit $3 offset $2', filter_info));
        if (err) {
            console.error('my_orders2 failed ', err, filter_info);
            await this.handlePoolError(err);
        }
        return result.rows;

    }

    async my_orders3(filter_info): Promise<IOrder[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('SELECT * FROM mist_orders where trader_address=$1 and side=$6 and (status=$4 or status=$5)order by updated_at desc limit $3 offset $2', filter_info));
        if (err) {
            console.error('my_orders2 failed ', err, filter_info);
            await this.handlePoolError(err);
        }
        return result.rows;

    }

    async my_orders4(filter_info): Promise<IOrder[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('SELECT * FROM mist_orders where trader_address=$1 and market_id=$6 and (status=$4 or status=$5)order by updated_at desc limit $3 offset $2', filter_info));
        if (err) {
            console.error('my_orders2 failed ', err, filter_info);
            await this.handlePoolError(err);
        }
        return result.rows;

    }

    async my_orders5(filter_info): Promise<IOrder[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('SELECT * FROM mist_orders where trader_address=$1 and market_id=$6 and side=$7 and (status=$4 or status=$5)order by updated_at desc limit $3 offset $2', filter_info));
        if (err) {
            console.error('my_orders2 failed ', err, filter_info);
            await this.handlePoolError(err);
        }
        return result.rows;

    }
    // address, offset, perPage, status1, status2, start,end,MarketID,side]
    async my_orders6(filter): Promise<IOrder[]> {
        let marketFilter = 'and market_id=$8 ';
        if(filter[7] === ''){
            filter.splice(7,1);
            marketFilter = '';
        }

        let sideFilter = 'and side=$9 ';
        if(filter[8] === ''){
            filter.splice(8,1);
            sideFilter = '';
        }

        const sql = `SELECT * FROM mist_orders where trader_address=$1 ${marketFilter} ${sideFilter} and (status=$4 or status=$5)  and created_at>$6 and created_at<$7 order by created_at desc limit $3 offset $2`;
        const [err, result]: [any, any] = await to(this.queryWithLog(sql, filter));
        if (err) {
            console.error('my_orders6 failed ', err, filter);
            await this.handlePoolError(err);
        }
        return result.rows;

    }

    async find_order(order_id: string[]): Promise<IOrder[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('SELECT * FROM mist_orders where id=$1', order_id));
        if (err) {
            console.error('find_order_failed', err, order_id);
            await this.handlePoolError(err);
        }
        // 返回结果可能是空数组[]，使用时注意判断长度
        return result.rows;

    }

    async listAvailableOrders(): Promise<IOrder[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('select * from mist_orders_tmp where available_amount>0 limit 1000'));
        if (err) {
            console.error('listAvailableOrders failed', err);
            await this.handlePoolError(err);
        }
        // 返回结果可能是空数组[]，使用时注意判断长度
        return result.rows;

    }

    async filter_orders(filter): Promise<IOrder[]> {

        let err: any;
        let result: any;
        if (filter[1] === 'sell') {
            [err, result] = await to(this.queryWithLog('SELECT * FROM mist_orders_tmp where price<=$1 and side=$2 and available_amount>0 and market_id=$3 order by price asc limit 100', filter));
        } else {

            [err, result] = await to(this.queryWithLog('SELECT * FROM mist_orders_tmp where price>=$1 and side=$2 and available_amount>0 and market_id=$3 order by price desc limit 100', filter));
        }
        if (err) {
            console.error('filter_orders failed', err, filter);
            await this.handlePoolError(err);
        }
        return result.rows;

    }

    async update_orders(update_info): Promise<object[]> {
        const [err, result]: [any, any] = await to(this.clientDB
            .query('UPDATE mist_orders SET (available_amount,confirmed_amount,canceled_amount,\
                pending_amount,status,updated_at)=\
                (available_amount+$1,confirmed_amount+$2,canceled_amount+$3,pending_amount+$4,$5,$6) WHERE id=$7', update_info));

        if (err) {
            console.error('update_orders failed', err, update_info);
            await this.handlePoolError(err);
        }

        const [err_tmp, result_tmp]: [any, any] = await to(this.clientDB
            .query('UPDATE mist_orders_tmp SET (available_amount,confirmed_amount,canceled_amount,\
                pending_amount,status,updated_at)=\
                (available_amount+$1,confirmed_amount+$2,canceled_amount+$3,pending_amount+$4,$5,$6) WHERE id=$7', update_info));

        if (err_tmp) {
            console.error('update_orders failed', err_tmp, result_tmp);
            await this.handlePoolError(err_tmp);
        }

        return result.rows;

    }

    // FIXME : 不要拼接SQL
    async update_order_confirm(updatesInfo): Promise<object[]> {
        let query = 'set (confirmed_amount,pending_amount,updated_at)=(mist_orders.confirmed_amount+tmp.confirmed_amount,mist_orders.pending_amount+tmp.pending_amount,tmp.updated_at) from (values (';
        for (const index in updatesInfo as any[]) {
            if (updatesInfo[index]) {
                const tempValue = updatesInfo[index].info[0] + ','
                    + updatesInfo[index].info[1] + ',now()' + ',\'' + updatesInfo[index].info[3] + '\'';
                if (Number(index) < updatesInfo.length - 1) {
                    query = query + tempValue + '),(';
                } else {
                    query = query + tempValue + ')';
                }
            }
        }
        query += ') as tmp (confirmed_amount,pending_amount,updated_at,id) where mist_orders.id=tmp.id';

        const [err, result]: [any, any] = await to(this.queryWithLog('update mist_orders ' + query));

        if (err) {
            console.error('update_order_confirm failed ', err, updatesInfo);
            await this.handlePoolError(err);
        }

        const [err_tmp, result_tmp]: [any, any] = await to(this.queryWithLog('update mist_orders_tmp as mist_orders ' + query));

        if (err_tmp) {
            console.error('update_order_confirm failed ', err_tmp, result_tmp);
            await this.handlePoolError(err_tmp);
        }
        return result.rows;

    }

    async order_book(filter: [string, string, string]): Promise<any> {
        let err: any;
        let result: any;
        if (filter[0] === 'sell') {
            [err, result] = await to(this.queryWithLog('SELECT  trunc(price-0.00000001,$3) as price,sum(available_amount) as amount FROM mist_orders_tmp\
            where market_id=$2 and available_amount>0  and side=$1 group by  trunc(price-0.00000001,$3) order by price asc limit 100', filter));
        } else {
            [err, result] = await to(this.queryWithLog('SELECT  trunc(price,$3) as price,sum(available_amount) as amount FROM mist_orders_tmp\
            where market_id=$2 and available_amount>0  and side=$1 group by  trunc(price,$3) order by price desc limit 100',filter));
        }
        if (err) {
            console.error('order_book failed', err, filter);
            await this.handlePoolError(err);
        }
        return result.rows;
    }

    /*
     *tokens
     *
     * */

    async list_tokens(): Promise<IToken[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('select * from mist_tokens'));
        if (err) {
            console.error('list_tokens_failed', err,);
            await this.handlePoolError(err);
        }
        return result.rows;

    }


    async get_tokens(filter): Promise<IToken[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('select * from mist_tokens where symbol=$1 or asim_assetid=$1 or address=$1', filter));
        if (err) {
            console.error('get_tokens_failed', err, filter);
            await this.handlePoolError(err);
        }
        return result.rows;

    }

    async insert_token(info): Promise<any> {
        const [err, result]: [any, any] = await to(this.queryWithLog('insert into mist_tokens values($1,$2,$3,$4,$5,$6,$7)', info));
        if (err) {
            console.error('insert tokens failed', err, info);
            await this.handlePoolError(err);
        }
        return result.rows;

    }

    /*
    *makkets
    *
    * */

    async list_online_markets(): Promise<IMarket[]> {
        // const [err, result]: [any, any] = await to(this.queryWithLog('select * from mist_markets where online=true and current_timestamp > up_at and current_timestamp < down_at'));
        // 需且仅需要上下线时间来判断是否在线，online暂时留
        const [err, result]: [any, any] = await to(this.queryWithLog('select * from mist_markets where current_timestamp > up_at and current_timestamp < down_at'));
        if (err) {
            console.error('list online markets failed', err);
            await this.handlePoolError(err);
        }
        return result.rows;

    }


    async list_markets(): Promise<IMarket[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('select * from mist_markets'));
        if (err) {
            console.error('list markets failed', err);
            await this.handlePoolError(err);
        }
        return result.rows;

    }

    async market_up(info): Promise<object[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('update mist_markets set (online,up_at,down_at,updated_at)=(\'true\',$1,down_at + \'10 years\',$3) where id=$2', info));
        if (err) {
            console.error('market_up failed', err, info);
            await this.handlePoolError(err);
        }
        return result.rows;
    }

    async market_down(info): Promise<object[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('update mist_markets set (online,down_at,updated_at)=(\'false\',$1,$3) where id=$2', info));
        if (err) {
            console.error('market_down failed', err, info);
            await this.handlePoolError(err);
        }
        return result.rows;
    }

    async market_add(info): Promise<object[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('insert into mist_markets values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', info));
        if (err) {
            console.error('list markets failed', err, info);
            await this.handlePoolError(err);
        }
        return result.rows;

    }

    async get_market(marketID): Promise<IMarket[]> {
        // TODO: 线上版本暂时去掉up_at等判断
        // const [err, result]: [any, any] = await to(this.queryWithLog('select * from mist_markets where id=$1 and online=true and current_timestamp > up_at and current_timestamp < down_at', marketID));
        const [err, result]: [any, any] = await to(this.queryWithLog('select * from mist_markets where id=$1 and online=true', marketID));
        if (err) {
            console.error('get_market_faied', err, marketID);
            await this.handlePoolError(err);
        }
        return result.rows;

    }

    async get_existed_market(marketID): Promise<IMarket[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('select * from mist_markets where id=$1', marketID));
        if (err) {
            console.error('get existed market faied', err, marketID);
            await this.handlePoolError(err);
        }
        return result.rows;

    }


    async get_market_current_price(marketID): Promise<IPrice[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('select cast(price as float8) from mist_trades_tmp where created_at > (current_timestamp - interval \'24 hours\') and market_id=$1 order by created_at desc limit 1', marketID));
        if (err) {
            console.error('get_market_current_price_ failed', err, marketID);
            await this.handlePoolError(err);
        }
        if (result.rows.length === 0) {
            return [{price: 0}];
        }
        return result.rows;

    }

    async get_market_max_price(marketID): Promise<IPrice[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('select cast(price as float8) from mist_trades_tmp where created_at > (current_timestamp - interval \'24 hours\') and market_id=$1 order by price desc limit 1', marketID));
        if (err) {
            console.error('get_market_max_price failed', err, marketID);
            await this.handlePoolError(err);
        }
        if (result.rows.length === 0) {
            return [{price: 0}];
        }
        return result.rows;

    }

    async get_market_min_price(marketID): Promise<IPrice[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('select cast(price as float8) from mist_trades_tmp where created_at > (current_timestamp - interval \'24 hours\') and market_id=$1 order by price limit 1', marketID));
        if (err) {
            console.error('get_market_min_price failed', err, marketID);
            await this.handlePoolError(err);
        }
        if (result.rows.length === 0) {
            return [{price: 0}];
        }
        return result.rows;

    }

    async get_market_quotations(marketID): Promise<IMarketQuotation[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('select k.market_id,k.price,k.ratio,m.volume from (select s.market_id,s.price,cast((s.price-t.price)/t.price as decimal(10,8)) ratio from (select * from mist_trades_tmp where market_id=$1 and created_at > (current_timestamp - interval \'24 hours\') order by created_at desc limit 1)s left join (select price,market_id from mist_trades_tmp where market_id=$1 and created_at > (current_timestamp - interval \'24 hours\') order by created_at asc  limit 1)t on s.market_id=t.market_id)k left join (select market_id,sum(amount) as volume from mist_trades_tmp where market_id=$1 and created_at > (current_timestamp - interval \'24 hours\') group by market_id)m on k.market_id=m.market_id', marketID));
        if (err) {
            console.error('get_market_quotations_ failed', err, marketID);
            await this.handlePoolError(err);
        }

        return result.rows;

    }

    async list_market_quotations(): Promise<any[]> {
        const sql = 'select * from mist_market_quotation_tmp';
        const [err, result]: [any, any] = await to(this.queryWithLog(sql));
        if(!result){
            console.error('list_market_quotations failed', err);
            await this.handlePoolError(err);
        }

        return result.rows;

    }

    /*
     *
     *
     *trades
     */

    // FIXME:批量插入和查询暂时用原生sql
    async insert_trades(tradesInfo): Promise<string> {
        let query = 'values(';
        let tradesArr: any[] = [];
        for (const index in tradesInfo as any[]) {
            if (tradesInfo[index]) {
                let temp_value = '';
                for (let i = 1; i <= 15; i++) {
                    if (i < 15) {
                        temp_value += '$' + (i + 15 * Number(index)) + ',';
                    } else {
                        temp_value += '$' + (i + 15 * Number(index));
                    }
                }
                if (Number(index) < tradesInfo.length - 1) {
                    query = query + temp_value + '),(';
                } else {
                    query = query + temp_value + ')';
                }
                tradesArr = tradesArr.concat(tradesInfo[index]);
            }
        }

        const [err, result]: [any, any] = await to(this.queryWithLog('insert into mist_trades ' + query, tradesArr));
        if (err) {
            console.error('insert_traders_ failed', err, tradesInfo);
            await this.handlePoolError(err);
        }

        const [err_tmp, result_tmp]: [any, any] = await to(this.queryWithLog('insert into mist_trades_tmp ' + query, tradesArr));
        if (err_tmp) {
            console.error('insert_traders_tmp failed', err_tmp, result_tmp);
            await this.handlePoolError(err_tmp);
        }

        return JSON.stringify(result.rows);

    }

    async list_trades(marketID): Promise<ITrade[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('SELECT * FROM mist_trades where market_id=$1 order by created_at desc limit 30', marketID));
        if (err) {
            console.error('list trades failed', err, marketID);
            await this.handlePoolError(err);
        }
        return result.rows;

    }

    async my_trades(address): Promise<ITrade[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('SELECT * FROM mist_trades where taker=$1 or maker=$1 order by created_at desc limit 30', address));
        if (err) {
            console.error('my trades failed', err, address);
            await this.handlePoolError(err);
        }
        return result.rows;

    }

    async order_trades(order_id): Promise<object[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('SELECT price,amount FROM mist_trades where taker_order_id=$1 or maker_order_id=$1', order_id));
        if (err) {
            console.error('my trades failed', err);
            await this.handlePoolError(err);
        }
        return result.rows;

    }

    async my_trades2(filter_info): Promise<ITrade[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('SELECT * FROM mist_trades where taker=$1 or maker=$1 order by created_at desc limit $3 offset $2', filter_info));
        if (err) {
            console.error('my trades2 failed', err, filter_info);
            await this.handlePoolError(err);
        }
        return result.rows;

    }

    async my_trades3(filter_info): Promise<ITrade[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('SELECT * FROM mist_trades where market_id=$4 and (taker=$1 or maker=$1) order by created_at desc limit $3 offset $2', filter_info));
        if (err) {
            console.error('my trades2 failed', err, filter_info);
            await this.handlePoolError(err);
        }
        return result.rows;

    }


    async my_trades4(filter): Promise<ITrade[]> {
        let marketFilter = 'and market_id=$6 ';
        if(filter[5] === ''){
            filter.splice(5,1);
            marketFilter = '';
        }

        let statusFilter = 'and status=$7 ';
        if(filter[6] === ''){
            filter.splice(6,1);
            statusFilter = '';
        }
       //  address, offset, perPage,start,end,MarketID,status
        const sql = `SELECT * FROM mist_trades where (taker=$1 or maker=$1) and created_at>$4 and created_at<$5 ${marketFilter} ${statusFilter} order by created_at desc limit $3 offset $2`
        const [err, result]: [any, any] = await to(this.queryWithLog(sql, filter));
        if (err) {
            console.error('my_trades4 failed', err, filter);
            await this.handlePoolError(err);
        }
        return result.rows;

    }

    async transactions_trades(id): Promise<ITrade[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('SELECT * FROM mist_trades_tmp where transaction_id=$1', id));
        if (err) {
            console.error('transactions trades failed', err, id);
            await this.handlePoolError(err);
        }
        return result.rows;

    }

    async list_all_trades(): Promise<ITrade[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('SELECT * FROM mist_trades where status!=\'matched\'  order by transaction_id desc limit 1'));
        if (err) {
            console.error('list all trades failed', err);
            await this.handlePoolError(err);
        }
        return result.rows;

    }

    async list_matched_trades(): Promise<number> {
        const [err, result]: [any, any] = await to(this.queryWithLog('SELECT count(1) FROM mist_trades_tmp where status=\'matched\''));
        if (err) {
            console.error('list matched trades failed', err);
            await this.handlePoolError(err);
        }
        return result.rows[0].count;

    }

    async sort_trades(message, sort_by): Promise<ITrade[]> {
        // 最近一天的k线从这里拿，在远的之前应该已经缓存了？
        const sql = 'SELECT * FROM mist_trades_tmp where market_id=$1  and created_at>=$2 and  created_at<=$3 order by ' + sort_by + ' desc limit 30';
        const [err, result]: [any, any] = await to(this.queryWithLog(sql, message));
        if (err) {
            console.error('sort trades failed', err, message, sort_by);
            await this.handlePoolError(err);
        }
        return result.rows;

    }


    // todo:所有两表同时更新的操作应该保证原子性，现在先不管
    async update_trades(update_info): Promise<object[]> {
        const [err, result]: [any, any] = await to(this.clientDB
            .query('UPDATE mist_trades SET (status,updated_at)=($1,$2) WHERE  transaction_id=$3', update_info));

        if (err) {
            console.error('update trades failed', err, update_info);
            await this.handlePoolError(err);
        }

        const [err_tmp, result_tmp]: [any, any] = await to(this.clientDB
            .query('UPDATE mist_trades_tmp SET (status,updated_at)=($1,$2) WHERE  transaction_id=$3', update_info));

        if (err_tmp) {
            console.error('update trades failed', err_tmp, result_tmp);
            await this.handlePoolError(err_tmp);
        }

        return result.rows;

    }

    async launch_update_trades(update_info): Promise<object[]> {
        const [err, result]: [any, any] = await to(this.clientDB
            .query('UPDATE mist_trades SET (status,transaction_hash,updated_at)=($1,$2,$3) WHERE  transaction_id=$4', update_info));

        if (err) {
            console.error('launch update trades failed', err, update_info);
            await this.handlePoolError(err);
        }

        const [err_tmp, result_tmp]: [any, any] = await to(this.clientDB
            .query('UPDATE mist_trades_tmp SET (status,transaction_hash,updated_at)=($1,$2,$3) WHERE  transaction_id=$4', update_info));

        if (err_tmp) {
            console.error('launch update trades failed', err_tmp, result_tmp);
            await this.handlePoolError(err_tmp);
        }

        return result.rows;

    }

    async get_laucher_trades(): Promise<any[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog(' SELECT distinct(transaction_id)  FROM mist_trades_tmp where status in (\'pending\',\'matched\') and transaction_hash is null order by transaction_id  limit 1'));
        if (err) {
            console.error('get laucher trades failed', err);
            await this.handlePoolError(err);
        }

        return result.rows;

    }

    async get_matched_trades(): Promise<ITrade[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('SELECT *  FROM mist_trades where status=\'matched\' or (status=\'pending\' and transaction_hash is null) order by created_at desc limit 5000'));
        if (err) {
            console.error('get matched trades failed', err);
            await this.handlePoolError(err);
        }
        return result.rows;

    }
    // tmp code
    async get_zero_trades(): Promise<ITrade[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('SELECT *  FROM mist_trades where status=\'matched\' and transaction_id=\'0\' order by created_at desc limit 5000'));
        if (err) {
            console.error('get matched trades failed', err);
            await this.handlePoolError(err);
        }
        return result.rows;

    }

    async delete_matched_trades(): Promise<object[]> {
        // tslint:disable-next-line:max-line-length
        const [err, result]: [any, any] = await to(this.queryWithLog('delete from mist_trades where id in (select id from mist_trades where status=\'matched\'  or (status=\'pending\' and transaction_hash is null) order by created_at desc limit 5000)'));
        if (err) {
            console.error('delete matched trade failed', err);
            await this.handlePoolError(err);
        }

        const [tmpErr, tmpResult]: [any, any] = await to(this.queryWithLog('delete from mist_trades_tmp where id in (select id from mist_trades_tmp where status=\'matched\' or (status=\'pending\' and transaction_hash is null) order by created_at desc limit 5000)'));
        if (tmpErr) {
            console.error('delete matched trade failed', err);
            await this.handlePoolError(err);
        }
        return result.rows;

    }
    // 临时代码
    async delete_zero_trades(): Promise<object[]> {
        // tslint:disable-next-line:max-line-length
        const [err, result]: [any, any] = await to(this.queryWithLog('delete from mist_trades where id in (select id from mist_trades where status=\'matched\'  and transaction_id=\'0\' limit 5000)'));
        if (err) {
            console.error('delete matched trade failed', err);
            await this.handlePoolError(err);
        }
        return result.rows;
    }

    /**
     *transactions
     *
     *
     * */
    async insert_transactions(TXinfo): Promise<string> {
        const [err, result]: [any, any] = await to(this.queryWithLog('insert into mist_transactions values($1,$2,$3,$4,$5,$6,$7)', TXinfo));
        if (err) {
            console.error('insert transactions failed', err, TXinfo);
            await this.handlePoolError(err);
        }
        return JSON.stringify(result.rows);
    }
    async get_pending_transactions(): Promise<ITransaction[]> {
        const sql = 'SELECT * FROM mist_transactions where created_at > (current_timestamp - interval \'24 hours\') ' +
            'and  created_at < (current_timestamp - interval \'10 seconds\') ' +
            'and status not in (\'successful\',\'failed\') and transaction_hash is not null order by created_at  limit 1';
        const [err, result]: [any, any] = await to(this.queryWithLog(sql));
        if (err) {
            console.error('get pending transactions failed', err,);
            await this.handlePoolError(err);
        }
        return result.rows;
    }

    async list_transactions(): Promise<ITransaction[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('SELECT * FROM mist_transactions  order by id desc limit 30'));
        if (err) {
            console.error('list transactions failed', err);
            await this.handlePoolError(err);
        }
        return result.rows;

    }


    async get_transaction(id): Promise<ITransaction[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('SELECT * FROM mist_transactions where id=$1', id));
        if (err) {
            console.error('get transaction failed', err, id);
            await this.handlePoolError(err);
        }
        return result.rows;

    }


    async update_transactions(update_info): Promise<object[]> {
        const [err, result]: [any, any] = await to(this.clientDB
            .query('UPDATE mist_transactions SET (status,contract_status,updated_at)=($1,$2,$3) WHERE  id=$4', update_info));

        if (err) {
            console.error('update transactions failed', err, update_info);
            await this.handlePoolError(err);
        }
        return result.rows;

    }

    /*
    *
    *users
    *
    *
    */
    async update_user_token(update_info): Promise<object[]> {
        const [err, result]: [any, any] = await to(this.clientDB
            .query('UPDATE mist_users SET (pi,asim,btc,usdt,eth,mt,pi_valuation,asim_valuation,btc_valuation,usdt_valuation,eth_valuation,mt_valuation,updated_at)=($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) WHERE  address=$14', update_info));
        if (err) {
            console.error('update user token failed', err.update_info);
            await this.handlePoolError(err);
        }
        return result.rows;

    }

    async update_user_total(update_info): Promise<object[]> {
        const [err, result]: [any, any] = await to(this.clientDB
            .query('UPDATE mist_users SET (total_value_1day,total_value_2day,total_value_3day,total_value_4day,total_value_5day,total_value_6day,\
				total_value_7day,updated_at)=($1,total_value_1day,total_value_2day,total_value_3day,total_value_4day,total_value_5day,total_value_6day,$2) WHERE  address=$3', update_info));
        if (err) {
            console.error('update user total failed', err, update_info);
            await this.handlePoolError(err);
        }
        return result.rows;

    }


    async find_user(address): Promise<object[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('SELECT * FROM mist_users  where address=$1', address));
        if (err) {
            console.error('find user failed', err, address);
            await this.handlePoolError(err);
        }
        return result.rows;
    }

    async list_users(): Promise<object[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('SELECT * FROM mist_users'));
        if (err) {
            console.error('list users failed', err);
            await this.handlePoolError(err);
        }
        return result.rows;
    }

    /*
        coin convert
    */


    async find_bridge(filter_info): Promise<IBridge[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog(`SELECT ${BRIDGE_SQL} FROM mist_bridge  where id=$1`, filter_info));
        if (err) {
            console.error('find bridge failed', err, filter_info);
            await this.handlePoolError(err);
        }

        return result.rows;

    }

    async my_bridge(filter_info): Promise<IBridge[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog(`SELECT ${BRIDGE_SQL} FROM mist_bridge  where address=$1 order by created_at desc limit $3 offset $2`, filter_info));
        if (err) {
            console.error('my bridge failed', err, filter_info);
            await this.handlePoolError(err);
        }

        return result.rows;

    }


    async getBridgeMint(symbol:[string]): Promise<number> {
        const sql = 'select sum(amount) from mist_bridge where side=\'asset2coin\' and token_name=$1';
        const [err, result]: [any, any] = await to(this.queryWithLog(sql,symbol));
        if (err) {
            console.error('getBridgeMint failed', err);
            await this.handlePoolError(err);
        }

        return result.rows[0].sum;

    }

    async getBridgeBurn(symbol:[string]): Promise<number> {
        const sql = 'select sum(amount + to_number(fee_amount, \'9999999.99999999\')) from ' +
            'mist_bridge where side=\'coin2asset\' and token_name=$1';
        const [err, result]: [any, any] = await to(this.queryWithLog(sql,symbol));
        if (err) {
            console.error('getBridgeBurn failed', err);
            await this.handlePoolError(err);
        }

        return result.rows[0].sum;

    }

    async getBridgeFee(symbol:[string]): Promise<number> {
        const sql = 'select sum(to_number(fee_amount, \'99999999999.99999999\')) from' +
            ' mist_bridge where side=\'coin2asset\' and token_name=$1';
        const [err, result]: [any, any] = await to(this.queryWithLog(sql,symbol));
        if (err) {
            console.error('getBridgeFee failed', err);
            await this.handlePoolError(err);
        }

        return result.rows[0].sum;

    }



    async get_pending_decode_bridge(): Promise<IBridge[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('SELECT * from  mist_bridge  where address is null  and master_txid_status=\'pending\' and (current_timestamp - created_at) > \'10 seconds\' order by created_at desc limit 1'));
        if (err) {
            console.error('get pending decode bridge failed', err);
            await this.handlePoolError(err);
        }

        return result.rows;

    }


    async filter_bridge(filter_info): Promise<IBridge[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('SELECT * FROM mist_bridge  where side=$1 and master_txid_status=$2 and child_txid_status=$3 order by created_at desc limit 1', filter_info));
        if (err) {
            console.error('filter bridge failed', err, filter_info);
            await this.handlePoolError(err);
        }

        return result.rows;

    }

    async update_asset2coin_bridge(info): Promise<object[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('UPDATE mist_bridge SET (child_txid,child_txid_status,updated_at)=($1,$2,$3) WHERE id=$4', info));
        if (err) {
            console.error('update asset2coin bridge failed', err, info);
            await this.handlePoolError(err);
        }

        return result.rows;

    }

    async update_asset2coin_decode(info): Promise<object[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('UPDATE mist_bridge SET (address,token_name,amount,master_txid_status,child_txid_status,fee_asset,fee_amount,updated_at)=($1,$2,$3,$4,$5,$6,$7,$8) WHERE id=$9', info));
        if (err) {
            console.error('update asset2coin decode failed', err, info);
            await this.handlePoolError(err);
        }

        return result.rows;

    }

    async update_coin2asset_bridge(info): Promise<object[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('UPDATE mist_bridge SET (master_txid,master_txid_status,child_txid,child_txid_status,updated_at)=($1,$2,$3,$4,$5) WHERE id=$6', info));
        if (err) {
            console.error('update coin2asset bridge', err, info);
            await this.handlePoolError(err);
        }

        return result.rows;

    }

    async update_coin2asset_failed(info): Promise<object[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('UPDATE mist_bridge SET (master_txid,master_txid_status,updated_at)=($1,$2,$3) WHERE id=$4', info));
        if (err) {
            console.error('update coin2asset failed', err, info);
            await this.handlePoolError(err);
        }

        return result.rows;

    }

    async my_bridge_v3(filter_info): Promise<IBridge[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog(`SELECT ${BRIDGE_SQL} FROM mist_bridge  where address=$1 and token_name=$2 order by created_at desc limit $4 offset $3`, filter_info));
        if (err) {
            console.error('my bridge_v3 failed', err, filter_info);
            await this.handlePoolError(err);
        }

        return result.rows;

    }

    async my_bridge_v4(filter): Promise<IBridge[]> {
        let tokenFilter = 'and token_name=$6 ';
        if(filter[5] === ''){
            filter.splice(5,1);
            tokenFilter = '';
        }
        const sql = `SELECT ${BRIDGE_SQL} FROM mist_bridge  where address=$1  and created_at>$4 and created_at<$5  ${tokenFilter} order by created_at desc limit $3 offset $2`;
        const [err, result]: [any, any] = await to(this.queryWithLog(sql, filter));
        if (err) {
            console.error('my my_bridge_v4 failed', err,sql,filter);
            await this.handlePoolError(err);
        }

        return result.rows;

    }

    async insert_converts(info): Promise<string> {
        const [err, result]: [any, any] = await to(this.queryWithLog('insert into mist_token_convert values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)', info));
        if (err) {
            console.error('insert converts failed', err);
            await this.handlePoolError(err);
        }
        return JSON.stringify(result.rows);
    }

    async insert_bridge(info): Promise<string> {
        const [err, result]: [any, any] = await to(this.queryWithLog('insert into mist_bridge values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)', info));
        if (err) {
            console.error('insert bridge failed', err);
            await this.handlePoolError(err);
        }
        return JSON.stringify(result.rows);
    }
    async get_freeze_amount(filter_info): Promise<IFreezeToken[]> {
        const sql = `select market_id,side,
            sum(pending_amount+available_amount) as base_amount,
            sum((pending_amount+available_amount) * price) as quote_amount
        from mist_orders_tmp
        where trader_address=$1 and status in ('pending','partial_filled')
        group by market_id,side
        having (position($2 in market_id)=1 and side='sell') or (position($2 in market_id)>1 and side='buy')
        `
        const [err, result]: [any, any] = await to(this.queryWithLog(sql, filter_info));
        if (err) {
            console.error('get freeze amount failed', err, filter_info);
            await this.handlePoolError(err);
        }
        return result.rows;
    }

    /*
    * ADMIN
    * */

    async get_engine_progress(): Promise<IFreezeToken[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog('select t.*,s.id,s.contract_status from (select status,transaction_hash,transaction_id,count(1) from mist_trades_tmp  where status!=\'successful\' group by transaction_hash,transaction_id,status)t left join (select * from mist_transactions)s on t.transaction_id=s.id   order by t.transaction_id desc limit 50;'));
        if (!result) {
            console.error('get_engine_info', err);
            await this.handlePoolError(err);
        }
        return result.rows;
    }

    async get_bridger_progress(): Promise<IFreezeToken[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog(' select * from mist_bridge where master_txid_status!=\'successful\' and child_txid_status!=\'successful\' order by created_at limit 100'));
        if (!result) {
            console.error('get_bridger_info', err);
            await this.handlePoolError(err);
        }
        return result.rows;
    }

    async get_express_progress(): Promise<IFreezeToken[]> {
        const [err, result]: [any, any] = await to(this.queryWithLog(' select * from asim_express_records where base_tx_status!=\'successful\' or quote_tx_status!=\'successful\' order by created_at desc limit 100;'));
        if (!result) {
            console.error('get_express_progress', err);
            await this.handlePoolError(err);
        }
        return result.rows;
    }

    async insert_market_quotation(info): Promise<string> {
        const [err, result]: [any, any] = await to(this.queryWithLog('insert into mist_market_quotation_tmp values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)', info));
        if (err) {
            console.error('insert_market_quotation failed', err, info);
            await this.handlePoolError(err);
        }
        return JSON.stringify(result.rows);
    }

    async get_market_quotation_tmp(info): Promise<string> {
    const [err, result]: [any, any] = await to(this.queryWithLog('select * from mist_market_quotation_tmp where market_id=$1 limit 1', info));
        if (err) {
            console.error('get_market_quotation failed', err, info);
            await this.handlePoolError(err);
        }
        return result.rows;
    }

    async update_market_quotation(update_info): Promise<object[]> {
        const [err, result]: [any, any] = await to(this.clientDB.query('UPDATE mist_market_quotation_tmp SET ' +
                '(price,ratio,volume,CNYC_price,maxprice,minprice,min_CNYC_price,max_CNYC_price,symbol,updated_at)=' +
                '($2,$3,$4,$5,$6,$7,$8,$9,$10,$11) WHERE  market_id=$1', update_info));

        if (err) {
            console.error('update_market_quotation  failed', err, update_info);
            await this.handlePoolError(err);
        }
        return result.rows;

    }

    async insert_order_book_tmp(info): Promise<string> {
        const [err, result]: [any, any] = await to(this.queryWithLog('insert into mist_order_book_tmp values($1,$2,$3,$4,$5)', info));
        if (err) {
            console.error('insert_order_book_tmp failed', err, info);
            await this.handlePoolError(err);
        }
        return JSON.stringify(result.rows);
    }

    async get_order_book_tmp(info): Promise<any> {
        const [err, result]: [any, any] = await to(this.queryWithLog('select * from mist_order_book_tmp where market_id=$1 and precision=$2 limit 1', info));
        if (err) {
            console.error('get_order_book_tmp failed', err, info);
            await this.handlePoolError(err);
        }
        return result.rows;
    }
    async update_order_book_tmp(update_info): Promise<object[]> {
        const [err, result]: [any, any] = await to(this.clientDB.query('UPDATE mist_order_book_tmp SET ' +
            '(order_book,updated_at)=($3,$4) WHERE  market_id=$1 and precision=$2', update_info));

        if (err) {
            console.error('update update_order_book_tmp failed', err, update_info);
            await this.handlePoolError(err);
        }
        return result.rows;

    }

}
