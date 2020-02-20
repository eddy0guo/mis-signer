import to from 'await-to-js';
import mist_config from '../../cfg';

const BRIDGE_SQL = 'id,address,token_name,cast(amount as float8),side,master_txid,master_txid_status,child_txid,child_txid_status,fee_asset,fee_amount,updated_at,created_at';

export default class db {

    private clientDB;

    constructor() {
        const { Pool } = require('postgres-pool');
        const client = new Pool({
            host: mist_config.pg_host,
            database: mist_config.pg_database,
            user: mist_config.pg_user,
            password: mist_config.pg_password,
            port: mist_config.pg_port,
        });
        client.on('error', (err: any) => {
            console.error('An idle client has experienced an error', err.stack)
        })
        this.clientDB = client;
    }


	async compat_query(sql) : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB.query(sql));
        if (err) {
            console.error('compat_query failed', err,sql);
			throw new Error(err);
        }
        return result.rows;

    }


    /**
     *orders
     *
     *
     *
     */
    async insert_order(ordermessage) {
        const [err, result]:[any,any] = await to(this.clientDB.query('insert into mist_orders values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)', ordermessage));
        if (err) {
            console.error(`insert_order_faied ${err},insert data= ${ordermessage}`);
			throw new Error(err);
        }

        const [err_tmp, result_tmp]:[any,any] = await to(this.clientDB.query('insert into mist_orders_tmp values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)', ordermessage));
        if (err_tmp) {
            console.error(`insert_order_tmp_faied ${err_tmp},insert data= ${ordermessage}`, result_tmp);
			throw new Error(err_tmp);
        }

        return JSON.stringify(result.rows);
    }

    async list_orders() : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB.query('SELECT * FROM mist_orders_tmp order by create_at desc limit 30'));
        if (err) {
            console.error('list_order failed', err);
			throw new Error(err);
        }
        return result.rows;

    }

    async my_orders(address) : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB.query('SELECT * FROM mist_orders where trader_address=$1 order by updated_at desc limit 30', address));
        if (err) {
           	console.error('my_order_failed', err, address);
			throw new Error(err);
        }
		if(result.rows){
        return result.rows;
		}else{
			return  result;
		}

    }

    async my_orders_length(info) : Promise<any>  {
        const [err, result]: [any,any]= await to(this.clientDB.query('SELECT count(1) FROM mist_orders where trader_address=$1 and status in ($2,$3)', info));
        if (err) {
            console.error('my_order_length failed', err);
			throw new Error(err);
        }

        return result.rows[0].count;

    }

    async my_trades_length(address) : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB.query('SELECT count(1) FROM mist_trades where taker=$1 or maker=$1', address));
        if (err) {
            console.error('my_trades_length failed', err, address);
			throw new Error(err);
        }

        return result.rows[0].count;

    }

    async my_bridge_length(address) : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB.query('SELECT count(1) FROM mist_bridge where address=$1', address));
        if (err) {
            console.error('my_bridge_length failed ', err, address);
			throw new Error(err);
        }

        return result.rows[0].count;

    }

    async my_orders2(filter_info) : Promise<any>  {
        const [err, result]: [any,any] = await to(this.clientDB.query('SELECT * FROM mist_orders where trader_address=$1 and (status=$4 or status=$5)order by updated_at desc limit $3 offset $2', filter_info));
        if (err) {
            console.error('my_orders2 failed ', err, filter_info);
			throw new Error(err);
        }
        return result.rows;

    }

    async find_order(order_id) : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB.query('SELECT * FROM mist_orders where id=$1', order_id));
        if (err) {
            console.error('find_order_failed', err, order_id);
			throw new Error(err);
        }
        return result.rows;

    }

    async filter_orders(filter) : Promise<any> {

        let err: any;
        let result: any;
        if (filter[1] === 'sell') {
            [err, result] = await to(this.clientDB.query('SELECT * FROM mist_orders_tmp where price<=$1 and side=$2 and available_amount>0 and market_id=$3 order by price asc limit 100', filter));
        } else {

            [err, result] = await to(this.clientDB.query('SELECT * FROM mist_orders_tmp where price>=$1 and side=$2 and available_amount>0 and market_id=$3 order by price desc limit 100', filter));
        }
        if (err) {
            console.error('filter_orders failed', err, filter);
			throw new Error(err);
        }
        return result.rows;

    }

    async update_orders(update_info) : Promise<any> {
        const [err, result] : [any,any]= await to(this.clientDB
            .query('UPDATE mist_orders SET (available_amount,confirmed_amount,canceled_amount,\
                pending_amount,status,updated_at)=\
                (available_amount+$1,confirmed_amount+$2,canceled_amount+$3,pending_amount+$4,$5,$6) WHERE id=$7', update_info));

        if (err) {
            console.error('update_orders failed', err, update_info);
			throw new Error(err);
        }

        const [err_tmp, result_tmp]: [any,any] = await to(this.clientDB
            .query('UPDATE mist_orders_tmp SET (available_amount,confirmed_amount,canceled_amount,\
                pending_amount,status,updated_at)=\
                (available_amount+$1,confirmed_amount+$2,canceled_amount+$3,pending_amount+$4,$5,$6) WHERE id=$7', update_info));

        if (err_tmp) {
            console.error('update_orders failed', err_tmp, result_tmp);
			throw new Error(err_tmp);
        }

        return result.rows;

    }

    // FIXME : 不要拼接SQL
    async update_order_confirm(updatesInfo) : Promise<any> {
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

        const [err, result] : [any,any] = await to(this.clientDB.query('update mist_orders ' + query));

        if (err) {
            console.error('update_order_confirm failed ', err, updatesInfo);
			throw new Error(err);
        }

        const [err_tmp, result_tmp]: [any,any] = await to(this.clientDB.query('update mist_orders_tmp as mist_orders ' + query));

        if (err_tmp) {
            console.error('update_order_confirm failed ', err_tmp, result_tmp);
			throw new Error(err_tmp);
        }
        return result.rows;

    }

    async order_book(filter) : Promise<any> {
        let err: any;
        let result: any;
        if (filter[0] === 'sell') {
            [err, result] = await to(this.clientDB.query('SELECT price,sum(available_amount) as amount FROM mist_orders_tmp\
            where market_id=$2 and available_amount>0  and side=$1 group by price order by price asc limit 100', filter));
        } else {

            [err, result] = await to(this.clientDB.query('SELECT price,sum(available_amount) as amount FROM mist_orders_tmp\
            where market_id=$2 and available_amount>0  and side=$1 group by price order by price desc limit 100', filter));
        }
        if (err) {
            console.error('order_book failed', err, filter);
			throw new Error(err);
        }
        return result.rows;
    }

    /*
     *tokens
     *
     * */
    async list_tokens(tradeid) : Promise<any> {
        const [err, result]: [any,any]  = await to(this.clientDB.query('select * from mist_tokens'));
        if (err) {
            console.error('list_tokens_failed', err, tradeid);
			throw new Error(err);
        }
        return result.rows;

    }

    async get_tokens(filter) : Promise<any> {
        const [err, result]: [any,any]  = await to(this.clientDB.query('select * from mist_tokens where symbol=$1 or asim_assetid=$1 or address=$1', filter));
        if (err) {
            console.error('get_tokens_failed', err, filter);
			throw new Error(err);
        }
        return result.rows;

    }

	/**
	async insert_tokens(info) : Promise<any> {
		//insert into mist_markets values($1,$2,$3,$4,$5,$6,$7,$8)
        const [err, result]: [any,any]  = await to(this.clientDB.query('insert into mist_tokens values($1,$2,$3,$4,$5,$6,$7,$8)', info));
        if (err) {
            console.error('insert tokens failed', err, filter);
			throw new Error(err);
        }
        return result.rows;

    }
	**/

    /*
    *makkets
    *
    * */
    async list_online_markets() : Promise<any> {
        const [err, result]: [any,any]  = await to(this.clientDB.query('select * from mist_markets where online=true'));
        if (err) {
            console.error('list online markets failed', err);
			throw new Error(err);
        }
        return result.rows;

    }

	async list_markets() : Promise<any> {
        const [err, result]: [any,any]  = await to(this.clientDB.query('select * from mist_markets'));
        if (err) {
            console.error('list markets failed', err);
			throw new Error(err);
        }
        return result.rows;

    }

	async update_market(info) : Promise<any> {
        const [err, result]: [any,any]  = await to(this.clientDB.query('update mist_markets set (online,updated_at)=($1,$3) where id=$2',info));
        if (err) {
            console.error('update market failed', err,info);
			throw new Error(err);
        }
        return result.rows;
    }

	async market_add(info) : Promise<any> {
        const [err, result]: [any,any]  = await to(this.clientDB.query('insert into mist_markets values($1,$2,$3,$4,$5,$6,$7,$8)',info));
        if (err) {
            console.error('list markets failed', err,info);
			throw new Error(err);
        }
        return result.rows;

    }

    async get_market(marketID) : Promise<any> {
        const [err, result]: [any,any]  = await to(this.clientDB.query('select * from mist_markets where id=$1 and online=true', marketID));
        if (err) {
            console.error('get_market_faied', err, marketID);
			throw new Error(err);
        }
        return result.rows;

    }

	async get_existed_market(marketID) : Promise<any> {
        const [err, result]: [any,any]  = await to(this.clientDB.query('select * from mist_markets where id=$1', marketID));
        if (err) {
            console.error('get existed market faied', err, marketID);
			throw new Error(err);
        }
        return result.rows;

    }


    async get_market_current_price(marketID) : Promise<any> {
        const [err, result]: [any,any]  = await to(this.clientDB.query('select cast(price as float8) from mist_trades_tmp where (current_timestamp - created_at) < \'24 hours\' and market_id=$1 order by created_at desc limit 1', marketID));
        if (err) {
            console.error('get_market_current_price_ failed', err, marketID);
			throw new Error(err);
        }
        if (result.rows.length === 0) {
            return [{ price: 0 }];
        }
        return result.rows;

    }

    async get_market_quotations(marketID) : Promise<any> {

        const [err, result] : [any,any] = await to(this.clientDB.query('select * from (select s.market_id,s.price,cast((s.price-t.price)/t.price as decimal(10,8)) ratio from (select * from mist_trades_tmp where market_id=$1 order by created_at desc limit 1)s left join (select price,market_id from mist_trades_tmp where market_id=$1 and (current_timestamp - created_at) < \'24 hours\' order by created_at asc  limit 1)t on s.market_id=t.market_id)k left join (select market_id,sum(amount) as volume from mist_trades_tmp where market_id=$1 and (current_timestamp - created_at) < \'24 hours\' group by market_id)m on k.market_id=m.market_id', marketID));
        if (err) {
            console.error('get_market_quotations_ failed', err, marketID);
			throw new Error(err);
        }

        return result.rows;

    }

    /*
     *
     *
     *trades
     */
	 // FIXME:批量插入和查询暂时用原生sql
    async insert_trades(tradesInfo) : Promise<any> {
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

        const [err, result]: [any,any] = await to(this.clientDB.query('insert into mist_trades ' + query, tradesArr));
        if (err) {
            console.error('insert_traders_ failed', err, tradesInfo);
			throw new Error(err);
        }

        const [err_tmp, result_tmp]: [any,any]  = await to(this.clientDB.query('insert into mist_trades_tmp ' + query, tradesArr));
        if (err_tmp) {
            console.error('insert_traders_tmp failed', err_tmp, result_tmp);
			throw new Error(err_tmp);
        }

        return JSON.stringify(result.rows);

    }

    async list_trades(marketID) : Promise<any> {
        const [err, result]: [any,any]  = await to(this.clientDB.query('SELECT * FROM mist_trades_tmp where market_id=$1 order by created_at desc limit 30', marketID));
        if (err) {
            console.error('list trades failed', err, marketID);
			throw new Error(err);
        }
        return result.rows;

    }

    async my_trades(address) : Promise<any> {
        const [err, result]: [any,any]  = await to(this.clientDB.query('SELECT * FROM mist_trades where taker=$1 or maker=$1 order by created_at desc limit 30', address));
        if (err) {
            console.error('my trades failed', err, address);
			throw new Error(err);
        }
        return result.rows;

    }

    async order_trades(order_id) : Promise<any> {
        const [err, result]: [any,any]  = await to(this.clientDB.query('SELECT price,amount FROM mist_trades where taker_order_id=$1 or maker_order_id=$1', order_id));
        if (err) {
            console.error('my trades failed', err);
			throw new Error(err);
        }
        return result.rows;

    }

    async my_trades2(filter_info) : Promise<any> {
        const [err, result]: [any,any]  = await to(this.clientDB.query('SELECT * FROM mist_trades where taker=$1 or maker=$1 order by created_at desc limit $3 offset $2', filter_info));
        if (err) {
            console.error('my trades2 failed', err, filter_info);
			throw new Error(err);
        }
        return result.rows;

    }

    async transactions_trades(id) : Promise<any> {
        const [err, result]: [any,any]  = await to(this.clientDB.query('SELECT * FROM mist_trades_tmp where transaction_id=$1', id));
        if (err) {
            console.error('transactions trades failed', err, id);
			throw new Error(err);
        }
        return result.rows;

    }

    async list_all_trades() : Promise<any> {
        const [err, result]: [any,any]  = await to(this.clientDB.query('SELECT * FROM mist_trades_tmp where status!=\'matched\' and (current_timestamp - created_at) < \'100 hours\' order by transaction_id desc limit 1'));
        if (err) {
            console.error('list all trades failed', err);
			throw new Error(err);
        }
        return result.rows;

    }

    async list_matched_trades() : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB.query('SELECT count(1) FROM mist_trades_tmp where status=\'matched\''));
        if (err) {
            console.error('list matched trades failed', err);
			throw new Error(err);
        }
        return result.rows;

    }

    async sort_trades(message, sort_by) : Promise<any> {
        // 最近一天的k线从这里拿，在远的之前应该已经缓存了？
        const sql = 'SELECT * FROM mist_trades_tmp where market_id=$1  and created_at>=$2 and  created_at<=$3 order by ' + sort_by + ' desc limit 30';
        const [err, result]: [any,any] = await to(this.clientDB.query(sql, message));
        if (err) {
            console.error('sort trades failed', err, message, sort_by);
			throw new Error(err);
        }
        return result.rows;

    }

    // todo:所有两表同时更新的操作应该保证原子性，现在先不管
    async update_trades(update_info) : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB
            .query('UPDATE mist_trades SET (status,updated_at)=($1,$2) WHERE  transaction_id=$3', update_info));

        if (err) {
            console.error('update trades failed', err, update_info);
			throw new Error(err);
        }

        const [err_tmp, result_tmp]: [any,any] = await to(this.clientDB
            .query('UPDATE mist_trades_tmp SET (status,updated_at)=($1,$2) WHERE  transaction_id=$3', update_info));

        if (err_tmp) {
            console.error('update trades failed', err_tmp, result_tmp);
			throw new Error(err_tmp);
        }

        return result.rows;

    }

    async launch_update_trades(update_info) : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB
            .query('UPDATE mist_trades SET (status,transaction_hash,updated_at)=($1,$2,$3) WHERE  transaction_id=$4', update_info));

        if (err) {
            console.error('launch update trades failed', err, update_info);
			throw new Error(err);
        }

        const [err_tmp, result_tmp]: [any,any] = await to(this.clientDB
            .query('UPDATE mist_trades_tmp SET (status,transaction_hash,updated_at)=($1,$2,$3) WHERE  transaction_id=$4', update_info));

        if (err_tmp) {
            console.error('launch update trades failed', err_tmp, result_tmp);
			throw new Error(err_tmp);
        }

        return result.rows;

    }

    async get_laucher_trades() : Promise<any> {
        // 容错laucher过程中进程重启的情况
        // let [err,result]: [any,any] = await to(this.clientDB.query('select t.*,s.right_id from (select * from mist_trades where status!=\'successful\'
        // and transaction_hash is null)t left join (SELECT transaction_id as right_id  FROM mist_trades where status!=\'successful\'
        // and transaction_hash is null order by transaction_id  limit 1)s on t.transaction_id=s.right_id where s.right_id is not null'));
        const [err, result]: [any,any] = await to(this.clientDB.query(' SELECT distinct(transaction_id)  FROM mist_trades_tmp where status in (\'pending\',\'matched\') and transaction_hash is null order by transaction_id  limit 1'));
        if (err) {
            console.error('get laucher trades failed', err);
			throw new Error(err);
        }

        return result.rows;

    }

    async get_matched_trades() : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB.query('SELECT *  FROM mist_trades_tmp where status=\'matched\''));
        if (err) {
            console.error('get matched trades failed', err);
			throw new Error(err);
        }
        return result.rows;

    }

    async delete_matched_trades() : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB.query('delete FROM mist_trades where status=\'matched\''));
        if (err) {
            console.error('delete matched trade failed', err);
			throw new Error(err);
        }
        return result.rows;

    }

    /**
     *transactions
     *
     *
     * */
    async insert_transactions(TXinfo) : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB.query('insert into mist_transactions values($1,$2,$3,$4,$5,$6,$7)', TXinfo));
        if (err) {
            console.error('insert transactions failed', err, TXinfo);
			throw new Error(err);
        }
        return JSON.stringify(result.rows);
    }

    async list_transactions() : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB.query('SELECT * FROM mist_transactions  order by id desc limit 30'));
        if (err) {
            console.error('list transactions failed', err);
			throw new Error(err);
        }
        return result.rows;

    }

    async get_pending_transactions() : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB.query('SELECT * FROM mist_transactions where (current_timestamp - created_at) < \'24 hours\'  and status!=\'successful\' and transaction_hash is not null order by id  limit 1'));
        if (err) {
            console.error('get pending transactions failed', err,);
			throw new Error(err);
        }
        return result.rows;

    }

    async get_transaction(id)  : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB.query('SELECT * FROM mist_transactions where id=$1', id));
        if (err) {
            console.error('get transaction failed', err, id);
			throw new Error(err);
        }
        return result.rows;

    }

    async update_transactions(update_info) : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB
            .query('UPDATE mist_transactions SET (status,contract_status,updated_at)=($1,$2,$3) WHERE  id=$4', update_info));

        if (err) {
            console.error('update transactions failed', err, update_info);
			throw new Error(err);
        }
        return result.rows;

    }

    /*
    *
    *users
    *
    *
    */
    async update_user_token(update_info) : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB
            .query('UPDATE mist_users SET (pi,asim,btc,usdt,eth,mt,pi_valuation,asim_valuation,btc_valuation,usdt_valuation,eth_valuation,mt_valuation,updated_at)=($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) WHERE  address=$14', update_info));
        if (err) {
            console.error('update user token failed', err.update_info);
			throw new Error(err);
        }
        return result.rows;

    }

    async update_user_total(update_info) : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB
            .query('UPDATE mist_users SET (total_value_1day,total_value_2day,total_value_3day,total_value_4day,total_value_5day,total_value_6day,\
				total_value_7day,updated_at)=($1,total_value_1day,total_value_2day,total_value_3day,total_value_4day,total_value_5day,total_value_6day,$2) WHERE  address=$3', update_info));
        if (err) {
            console.error('update user total failed', err, update_info);
			throw new Error(err);
        }
        return result.rows;

    }

    async insert_users(address_info) : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB.query('insert into mist_users values($1)', address_info));
        if (err) {
            console.error('insert users failed', err, address_info);
			throw new Error(err);
        }
        return JSON.stringify(result.rows);
    }

    async find_user(address) : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB.query('SELECT * FROM mist_users  where address=$1', address));
        if (err) {
            console.error('find user failed', err, address);
			throw new Error(err);
        }
        return result.rows;
    }

    async list_users() : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB.query('SELECT * FROM mist_users'));
        if (err) {
            console.error('list users failed', err);
			throw new Error(err);
        }
        return result.rows;
    }

    /*
        coin convert
    */

    async my_converts(address) : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB.query('SELECT * FROM mist_token_convert  where address=$1 order by created_at desc limit 30', address));
        if (err) {
            console.error('my converts  failed', err, address);
			throw new Error(err);
        }
        return result.rows;

    }

    async my_converts2(filter_info) : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB.query('SELECT * FROM mist_token_convert  where address=$1 order by created_at desc limit $3 offset $2', filter_info));
        if (err) {
            console.error('my converts2 failed', err, filter_info);
			throw new Error(err);
        }

        return result.rows;

    }

    async find_bridge(filter_info) : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB.query(`SELECT ${BRIDGE_SQL} FROM mist_bridge  where id=$1`, filter_info));
        if (err) {
            console.error('find bridge failed', err, filter_info);
			throw new Error(err);
        }

        return result.rows;

    }

    async my_bridge(filter_info) : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB.query(`SELECT ${BRIDGE_SQL} FROM mist_bridge  where address=$1 order by created_at desc limit $3 offset $2`, filter_info));
        if (err) {
          	 console.error('my bridge failed', err, filter_info);
			 throw new Error(err);
        }

        return result.rows;

    }

	async get_pending_decode_bridge() : Promise<any[]> {
        const [err, result]: [any,any] = await to(this.clientDB.query('SELECT * from  mist_bridge  where address is null  and master_txid_status=\'pending\' and (current_timestamp - created_at) > \'10 seconds\' order by created_at desc limit 1'));
        if (err) {
          	 console.error('get pending decode bridge failed', err);
			 throw new Error(err);
        }

        return result.rows;

    }


    async filter_bridge(filter_info) : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB.query('SELECT * FROM mist_bridge  where side=$1 and master_txid_status=$2 and child_txid_status=$3 order by created_at desc limit 1', filter_info));
        if (err) {
            console.error('filter bridge failed', err, filter_info);
			throw new Error(err);
        }

        return result.rows;

    }

    async update_asset2coin_bridge(info) : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB.query('UPDATE mist_bridge SET (child_txid,child_txid_status,updated_at)=($1,$2,$3) WHERE id=$4', info));
        if (err) {
            console.error('update asset2coin bridge failed', err, info);
			throw new Error(err);
        }

        return result.rows;

    }

    async update_asset2coin_decode(info) : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB.query('UPDATE mist_bridge SET (address,token_name,amount,master_txid_status,child_txid_status,fee_asset,fee_amount,updated_at)=($1,$2,$3,$4,$5,$6,$7,$8) WHERE id=$9', info));
        if (err) {
            console.error('update asset2coin decode failed', err, info);
			throw new Error(err);
        }

        return result.rows;

    }

    async update_coin2asset_bridge(info) : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB.query('UPDATE mist_bridge SET (master_txid,master_txid_status,child_txid,child_txid_status,updated_at)=($1,$2,$3,$4,$5) WHERE id=$6', info));
        if (err) {
            console.error('update coin2asset bridge', err, info);
			throw new Error(err);
        }

        return result.rows;

    }

    async update_coin2asset_failed(info) : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB.query('UPDATE mist_bridge SET (master_txid,master_txid_status,updated_at)=($1,$2,$3) WHERE id=$4', info));
        if (err) {
            console.error('update coin2asset failed', err, info);
			throw new Error(err);
        }

        return result.rows;

    }

    async my_bridge_v3(filter_info) : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB.query(`SELECT ${BRIDGE_SQL} FROM mist_bridge  where address=$1 and token_name=$2 order by created_at desc limit $4 offset $3`, filter_info));
        if (err) {
            console.error('my bridge_v3 failed', err, filter_info);
			throw new Error(err);
        }

        return result.rows;

    }

    async insert_converts(info) : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB.query('insert into mist_token_convert values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)', info));
        if (err) {
            console.error('insert converts failed', err);
			throw new Error(err);
        }
        return JSON.stringify(result.rows);
    }

    async insert_bridge(info) : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB.query('insert into mist_bridge values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)', info));
        if (err) {
            console.error('insert bridge failed', err);
			throw new Error(err);
        }
        return JSON.stringify(result.rows);
    }

    async get_engine_info() : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB.query('select status,count(1) from mist_trades_tmp group by status'));
        if (err) {
            console.error('get engine info failed', err);
			throw new Error(err);
        }
        return JSON.stringify(result.rows);
    }

    async get_freeze_amount(filter_info) : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB.query('select market_id,side,sum(pending_amount+available_amount) as base_amount,sum((pending_amount+available_amount) * price) as quote_amount from mist_orders_tmp where trader_address=$1 group by market_id,side having (position($2 in market_id)=1 and side=\'sell\') or (position($2 in market_id)>1 and side=\'buy\')', filter_info));
        if (err) {
            console.error('get freeze amount failed', err, filter_info);
			throw new Error(err);
        }
        return result.rows;
    }

    /*
    assets
    */
    async list_assets_info() : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB.query('select s.*,m.circulation_amount as old_circulation_amount   from (select * from asim_assets_info order by created_at desc limit 5)s left join (select * from asim_assets_info where created_at - current_timestamp < \'24 minutes\' order by created_at limit 5)m on s.asset_id=m.asset_id'));
        if (err) {
            console.error('list assets info failed', err);
			throw new Error(err);
        }
        return JSON.stringify(result.rows);

    }

    async insert_assets_info(info) : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB.query('insert into asim_assets_info  values($1,$2,$3,$4,$5,$6,$7,$8)', info));
        if (err) {
            console.error('insert assets info failed', err, info);
			throw new Error(err);
        }
        return JSON.stringify(result.rows);
    }

    async update_assets_total(info) : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB.query('UPDATE asim_assets_info SET (total,updated_at)=($1,$2) WHERE asset_name=$3', info));
        if (err) {
          	 console.error('update assets total failed', err, info);
			 throw new Error(err);
        }

        return result.rows;

    }

    async update_assets_yesterday_total(info) : Promise<any> {
        const [err, result]: [any,any] = await to(this.clientDB.query('UPDATE asim_assets_info SET (yesterday_total,updated_at)=($1,$2) WHERE asset_name=$3', info));
        if (err) {
            console.error('update assets yesterday total failed', err, info);
			throw new Error(err);
        }

        return result.rows;

    }

}
