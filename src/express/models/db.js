import to from 'await-to-js'

export default class db{
        clientDB;
        constructor() {
				let db = process.env.MIST_MODE;
				const pg=require('pg')
				var conString = "postgres://postgres:postgres@119.23.181.166/" + db + "?sslmode=disable";
                // var conString = "postgres://postgres:postgres@127.0.0.1/" + db + "?sslmode=disable";
                let client = new pg.Client(conString);
                client.connect(function(err) {
                                if(err) {
                                return console.error('连接postgreSQL数据库失败', err);
                                }   
                                });
                this.clientDB  = client;
        }

		   async get_tokens(symbol) {
            let [err,result] = await to(this.clientDB.query('select * from mist_tokens where symbol=$1',symbol));
            if(err) {
                return console.error('get_tokens_查询失败', err);
            }
            return result.rows;

        }


		async my_express(filter_info) {
			console.log("11223344",filter_info);
			let [err,result] = await to(this.clientDB.query('SELECT * FROM asim_express_records  where address=$1 order by created_at desc limit $3 offset $2',filter_info)); 
			if(err) {
				return console.error('list_borrows_查询失败', err);
			}

			console.log("1122334455",result.rows);
			return result.rows;

		}

		async find_express(trade_id) {
			let [err,result] = await to(this.clientDB.query('SELECT * FROM asim_express_records  where trade_id=$1',trade_id)); 
			if(err) {
				return console.error('list_borrows_查询失败', err);
			}

			console.log("1122334455",result.rows);
			return result.rows;

		}

		async laucher_pending_trade() {
			let [err,result] = await to(this.clientDB.query('SELECT * FROM asim_express_records  where quote_tx_status in (\'pending\',\'failed\') order by created_at limit 1')); 
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


		/*
			 trade_id:trade_id,
                     address:address,
                     base_asset_name:base_token_name,
                     base_amount:amount,   
                     price:price,          
                     quote_asset_name: quote_token_name,
                     quote_amount:quote_amount,
                   //  fee_rate:0.005,        
                     fee_token: quote_token_name,
                     fee_amount:fee_amount,     
                     base_txid:base_txid,       
                     base_tx_status:base_tx_status,
                 //   quote_txid:null,      
                     quote_tx_status:"pending"
                     updated_at:current_time,

    address:address,
                     base_asset_name:base_token_name,
                     base_amount:amount,
                     price:price,
                     quote_amount:quote_amount,
                     fee_amount:fee_amount,
                     base_txid:base_txid,
                     base_tx_status:base_tx_status,
                     quote_tx_status:"pending"
                     updated_at:current_time,
                     trade_id:trade_id
		
		
		*/

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



}
