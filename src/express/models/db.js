import to from 'await-to-js'
const express_params = 'trade_id,address,base_asset_name,cast(base_amount as float8),cast(price as float8),quote_asset_name,cast(quote_amount as float8),cast(fee_rate as float8),fee_token,cast(fee_amount as float8),base_txid,base_tx_status,quote_txid,quote_tx_status,updated_at,created_at';

export default class db{
        clientDB;
        constructor() {
			    let db = process.env.MIST_MODE;
                //const pg=require('pg')
                const { Pool } = require('postgres-pool');

                //var conString = "postgres://postgres:postgres@127.0.0.1/" + db + "?sslmode=disable";

                const client = new Pool({
                  host: 'pgm-wz9m1yb4h5g4sl7x127770.pg.rds.aliyuncs.com',
                  database: process.env.MIST_MODE,
                  user: 'product',
                  password: 'myHzSesQc7TXSS5HOXZDsgq7SNUHY2',
                  port: 1433,
                });

                // var conString = "postgres://postgres:postgres@127.0.0.1/" + db + "?sslmode=disable";
                //let client = new pg.Client(conString);
                //const client = new Pool({connectionString: conString});
                this.clientDB  = client;

        }

		async my_express(filter_info) {
			console.log("11223344",filter_info);
			let [err,result] = await to(this.clientDB.query(`SELECT ${express_params} FROM asim_express_records  where address=$1 order by created_at desc limit $3 offset $2`,filter_info)); 
			if(err) {
				return console.error('list_borrows_查询失败', err);
			}

			console.log("1122334455",result.rows);
			return result.rows;

		}

		async find_express(trade_id) {
			let [err,result] = await to(this.clientDB.query(`SELECT ${express_params} FROM asim_express_records  where trade_id=$1`,trade_id)); 
			if(err) {
				return console.error('list_borrows_查询失败', err);
			}

			console.log("1122334455",result.rows);
			return result.rows;

		}

		async my_express_length(address) {
			let [err,result] = await to(this.clientDB.query(`SELECT count(1) FROM asim_express_records  where address=$1`,address)); 
			if(err) {
				return console.error('list_borrows_查询失败', err);
			}

			console.log("1122334455",result.rows);
			return result.rows[0].count;

		}



		async laucher_pending_trade() {
			let [err,result] = await to(this.clientDB.query('SELECT * FROM asim_express_records  where base_tx_status=\'successful\' and quote_tx_status in (\'pending\',\'failed\') order by created_at limit 1')); 
			if(err) {
				return console.error('list_borrows_查询失败', err);
			}

			console.log("1122334455",result.rows);
			return result.rows;

		}

		
		 async insert_express(info) {
			let [err,result] = await to(this.clientDB.query('insert into asim_express_records values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)',info));
			if(err) {
				return console.error('insert_traders_查询失败', err,info);
			}
			return JSON.stringify(result.rows);
        } 


		 async update_quote(info) {
			let [err,result] = await to(this.clientDB.query('UPDATE asim_express_records SET (quote_txid,quote_tx_status,updated_at)=($1,$2,$3) WHERE  trade_id=$4',info));
			if(err) {
				return console.error('insert_traders_查询失败', err,info);
			}
			return JSON.stringify(result.rows);
        } 

		 async update_base(info) {
			let [err,result] = await to(this.clientDB.query('UPDATE asim_express_records SET (address,base_asset_name,base_amount,price,quote_amount,fee_amount,base_tx_status,quote_tx_status,updated_at)=($1,$2,$3,$4,$5,$6,$7,$8,$9) WHERE  trade_id=$10',info));
			if(err) {
				return console.error('insert_traders_查询失败', err,info);
			}
			return JSON.stringify(result.rows);
        } 


		 async get_tokens(filter) {
            let [err,result] = await to(this.clientDB.query('select * from mist_tokens where symbol=$1 or asim_assetid=$1 or address=$1',filter));
            if(err) {
                return console.error('get_tokens_查询失败', err,filter);
            }
            return result.rows;

        }

		async order_book(filter) {
            let err;
            let result;
            if(filter[0] == 'sell'){
                [err,result] = await to(this.clientDB.query('SELECT price,sum(available_amount) as amount FROM mist_orders\
            where market_id=$2 and available_amount>0  and side=$1 group by price  order by price asc limit 100',filter));
            }else{

                [err,result] = await to(this.clientDB.query('SELECT price,sum(available_amount) as amount FROM mist_orders\
            where market_id=$2 and available_amount>0  and side=$1  group by price order by price desc limit 100',filter));
            }
            if(err) {
                return console.error('filter_orders_查询失败11',err,filter);
            }
            return result.rows;
        }

		 async get_tokens(filter) {
            let [err,result] = await to(this.clientDB.query('select * from mist_tokens where symbol=$1 or asim_assetid=$1 or address=$1',filter));
            if(err) {
                return console.error('get_tokens_查询失败', err,filter);
            }
            return result.rows;

        }





}
