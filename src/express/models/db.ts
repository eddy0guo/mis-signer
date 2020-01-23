import to from 'await-to-js'
import { Pool } from 'postgres-pool';
import mist_config from '../../cfg'

const express_params = 'trade_id,address,base_asset_name,cast(base_amount as float8),cast(price as float8),quote_asset_name,cast(quote_amount as float8),cast(fee_rate as float8),fee_token,cast(fee_amount as float8),base_txid,base_tx_status,quote_txid,quote_tx_status,updated_at,created_at';

export default class db {
	private clientDB:any;

	constructor() {

		const client = new Pool({
			host: mist_config.pg_host,
			database: mist_config.pg_database,
			user: mist_config.pg_user,
			password: mist_config.pg_password,
			port: mist_config.pg_port,
		});

		this.clientDB = client;

	}

	async my_express(filter_info) {
		const [err, result] = await to(this.clientDB.query(`SELECT ${express_params} FROM asim_express_records  where address=$1 order by created_at desc limit $3 offset $2`, filter_info));
		if (err) {
			return console.error('list_borrows_查询失败', err);
		}

		return result.rows;

	}

	async find_express(trade_id) {
		const [err, result] = await to(this.clientDB.query(`SELECT ${express_params} FROM asim_express_records  where trade_id=$1`, trade_id));
		if (err) {
			return console.error('list_borrows_查询失败', err);
		}

		return result.rows;

	}

	async my_express_length(address) {
		const [err, result] = await to(this.clientDB.query(`SELECT count(1) FROM asim_express_records  where address=$1`, address));
		if (err) {
			return console.error('list_borrows_查询失败', err);
		}

		return result.rows[0].count;

	}

	async laucher_pending_trade() {
		const [err, result] = await to(this.clientDB.query('SELECT * FROM asim_express_records  where base_tx_status=\'successful\' and quote_tx_status in (\'pending\',\'failed\') order by created_at limit 1'));
		if (err) {
			return console.error('list_borrows_查询失败', err);
		}

		return result.rows;

	}


	async insert_express(info) {
		const [err, result] = await to(this.clientDB.query('insert into asim_express_records values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)', info));
		if (err) {
			return console.error('insert_traders_查询失败', err, info);
		}
		return JSON.stringify(result.rows);
	}


	async update_quote(info) {
		const [err, result] = await to(this.clientDB.query('UPDATE asim_express_records SET (quote_txid,quote_tx_status,updated_at)=($1,$2,$3) WHERE  trade_id=$4', info));
		if (err) {
			return console.error('insert_traders_查询失败', err, info);
		}
		return JSON.stringify(result.rows);
	}

	async update_base(info) {
		const [err, result] = await to(this.clientDB.query('UPDATE asim_express_records SET \
		(address,base_asset_name,base_amount,price,quote_amount,fee_amount,base_tx_status,quote_tx_status,updated_at)=\
		($1,$2,$3,$4,$5,$6,$7,$8,$9) WHERE  trade_id=$10', info));
		if (err) {
			return console.error('insert_traders_查询失败', err, info);
		}
		return JSON.stringify(result.rows);
	}


	async get_tokens(filter) {
		const [err, result] = await to(this.clientDB.query('select * from mist_tokens where symbol=$1 or asim_assetid=$1 or address=$1', filter));
		if (err) {
			return console.error('get_tokens_查询失败', err, filter);
		}
		return result.rows;

	}

	async order_book(filter) {
		let err;
		let result;
		if (filter[0] === 'sell') {
			[err, result] = await to(this.clientDB.query('SELECT price,sum(available_amount) as amount FROM mist_orders_tmp\
            where market_id=$2 and available_amount>0  and side=$1 group by price  order by price asc limit 100', filter));
		} else {

			[err, result] = await to(this.clientDB.query('SELECT price,sum(available_amount) as amount FROM mist_orders_tmp\
            where market_id=$2 and available_amount>0  and side=$1  group by price order by price desc limit 100', filter));
		}
		if (err) {
			return console.error('filter_orders_查询失败11', err, filter);
		}
		return result.rows;
	}

}
