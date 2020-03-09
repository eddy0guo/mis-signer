import to from 'await-to-js'
import {Pool} from 'pg';
import mist_config from '../../cfg'
import {ITrade,IToken} from '../interface'

const express_params = 'trade_id,address,base_asset_name,cast(base_amount as float8),cast(price as float8),quote_asset_name,cast(quote_amount as float8),cast(fee_rate as float8),fee_token,cast(fee_amount as float8),base_txid,base_tx_status,quote_txid,quote_tx_status,updated_at,created_at';

export default class ExpressDBClient {
	private clientDB:Pool;

	constructor() {
		this.createPool();
	}

	createPool(){
		console.log('[EXPRESS DB] create pool at:',new Date());

        const client: Pool = new Pool({
            host: mist_config.pg_host,
            database: mist_config.pg_database,
            user: mist_config.pg_user,
            password: mist_config.pg_password,
            port: mist_config.pg_port,
        });
        client.on('error', async(err: any) => {
			console.error('An idle client has experienced an error', err.stack)
			// Maybe you shold kill the process
            process.exit(-1);
            // await client.end();
            // this.createPool();
        })
        this.clientDB = client;
	}

	async handlePoolError(err:Error) {
		// await this.clientDB.end();
		// this.createPool();
		throw err;
	}

	async my_express(filter_info) : Promise<ITrade[]> {
		const [err, result]: [any,any] = await to(this.clientDB.query(`SELECT ${express_params} FROM asim_express_records  where address=$1 order by created_at desc limit $3 offset $2`, filter_info));
		if (err) {
			console.error('my express failed', err,result);
			await this.handlePoolError(err);
		}

		return result.rows;

	}

	async find_express(trade_id) : Promise<ITrade[]> {
		const [err, result]: [any,any] = await to(this.clientDB.query(`SELECT ${express_params} FROM asim_express_records  where trade_id=$1`, trade_id));
		if (err) {
			console.error('find express failed', err,result);
			await this.handlePoolError(err);
		}

		return result.rows;

	}

	async my_express_length(address) : Promise<number> {
		const [err, result]: [any,any] = await to(this.clientDB.query(`SELECT count(1) FROM asim_express_records  where address=$1`, address));
		if (err) {
			console.error('my express length', err,result);
			await this.handlePoolError(err);
		}

		return result.rows[0].count;

	}

	async laucher_pending_trade() : Promise<ITrade[]> {
		const [err, result]: [any,any] = await to(this.clientDB.query('SELECT * FROM asim_express_records  where base_tx_status=\'successful\' and quote_tx_status in (\'pending\',\'failed\') order by created_at desc limit 1'));
		if (err) {
			console.error('laucher pending trade failed',err,result);
			await this.handlePoolError(err);
		}

		return result.rows;

	}


	async insert_express(info) : Promise<string>  {
		const [err, result]: [any,any] = await to(this.clientDB.query('insert into asim_express_records values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)', info));
		if (err) {
			console.error('insert express failed', err, info);
			await this.handlePoolError(err);
		}
		return JSON.stringify(result.rows);
	}


	async update_quote(info) : Promise<string> {
		const [err, result]: [any,any] = await to(this.clientDB.query('UPDATE asim_express_records SET (quote_txid,quote_tx_status,updated_at)=($1,$2,$3) WHERE  trade_id=$4', info));
		if (err) {
			console.error('update quote failed', err, info);
			await this.handlePoolError(err);
		}
		return JSON.stringify(result.rows);
	}

	async update_base(info) : Promise<string> {
		const [err, result]: [any,any] = await to(this.clientDB.query('UPDATE asim_express_records SET \
		(address,base_asset_name,base_amount,price,quote_asset_name,quote_amount,fee_amount,base_tx_status,quote_tx_status,updated_at)=\
		($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) WHERE  trade_id=$11', info));
		if (err) {
			console.error('update base failed', err, info);
			await this.handlePoolError(err);
		}
		return JSON.stringify(result.rows);
	}


	async get_tokens(filter) : Promise<IToken[]> {
		const [err, result]: [any,any] = await to(this.clientDB.query('select * from mist_tokens where symbol=$1 or asim_assetid=$1 or address=$1', filter));
		if (err) {
			console.error('get tokens failed', err, filter);
			await this.handlePoolError(err);
		}
		return result.rows;

	}

    async order_book(filter:[string,string,string]) : Promise<any> {
        let err: any;
        let result: any;
        if (filter[0] === 'sell') {
            [err, result] = await to(this.clientDB.query('SELECT trunc(price,$3) as price,sum(available_amount) as amount FROM mist_orders_tmp\
            where market_id=$2 and available_amount>0  and side=$1 group by trunc(price,$3) order by price asc limit 100', filter));
        } else {

            [err, result] = await to(this.clientDB.query('SELECT trunc(price,$3) as price,sum(available_amount) as amount FROM mist_orders_tmp\
            where market_id=$2 and available_amount>0  and side=$1 group by trunc(price,$3) order by price desc limit 100', filter));
        }
        if (err) {
            console.error('order_book failed', err, filter);
            await this.handlePoolError(err);
        }
        return result.rows;
    }

	async list_tokens() : Promise<IToken[]> {
		const [err, result]: [any,any]  = await to(this.clientDB.query('select * from mist_tokens'));
		if (err) {
			console.error('list_tokens_failed', err);
			await this.handlePoolError(err);
		}
		return result.rows;

	}

	async getPendingDecodeBaseTX() : Promise<any[]> {
		const [err, result]: [any,any]  = await to(this.clientDB.query('select * from asim_express_records where address is null and (current_timestamp - created_at) > \'10 seconds\' limit 1'));
		if (err) {
			console.error('getPendingDecodeBaseTX failed', err);
			await this.handlePoolError(err);
		}
		return result.rows;

	}

}
