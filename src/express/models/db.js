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
        async insert_transactions(TXinfo) {
			let [err,result] = await to(this.clientDB.query('insert into mist_transactions values($1,$2,$3,$4,$5,$6)',TXinfo));
			if(err) {
				return console.error('insert_transactions_查询失败', err);
			}
			console.log('insert_transactions_成功',JSON.stringify(result),"info",TXinfo); 
			return JSON.stringify(result.rows);
        } 

		async list_transactions() {
			let [err,result] = await to(this.clientDB.query('SELECT * FROM mist_transactions  order by id desc limit 30')); 
			if(err) {
				return console.error('list_transactions_查询失败', err);
			}
			return result.rows;

		} 

		async get_pending_transactions() {
			let [err,result] = await to(this.clientDB.query('SELECT * FROM mist_transactions where status=\'pending\' order by id  limit 1')); 
			if(err) {
				return console.error('list_successful_transactions_查询失败', err);
			}
			return result.rows;

		} 

		async get_transaction(id) {
			let [err,result] = await to(this.clientDB.query('SELECT * FROM mist_transactions where id=$1',id)); 
			if(err) {
				return console.error('get_transaction_查询失败', err);
			}
			return result.rows;

		} 
	
        async update_transactions(update_info) {
			let [err,result] = await to(this.clientDB
				.query('UPDATE mist_transactions SET (status,updated_at)=($1,$2) WHERE  id=$3',update_info)); 

			if(err) {
				return console.error('update_transactions_查询失败', err);
			}
			console.log('update_transactions_成功',JSON.stringify(result),update_info); 
			return result.rows;

        } 
		/**
		*cdp
		*/

		async list_borrows(address) {
			let [err,result] = await to(this.clientDB.query('SELECT * FROM mist_borrows  where address=$1 order by updated_at desc limit 30',address)); 
			if(err) {
				return console.error('list_borrows_查询失败', err);
			}
			return result.rows;

		}


		async my_borrows2(filter_info) {
			let [err,result] = await to(this.clientDB.query('SELECT * FROM mist_borrows  where address=$1 order by updated_at desc limit $3 offset $2',filter_info)); 
			if(err) {
				return console.error('list_borrows_查询失败', err);
			}
			return result.rows;

		}

		
		async find_borrow(info) {
			let [err,result] = await to(this.clientDB.query('SELECT * FROM mist_borrows  where cdp_id=$1 and deposit_token_name=$2',info)); 
			if(err) {
				return console.error('find_borrow_查询失败', err);
			}
			return result.rows;

		}



		 async update_borrows(update_info) {
			 //真正的质押比例应该是借出的价值/抵押物的价值，这里是借出的价值+利息/抵押物的价值，规避还款额度超过借出本金的时候，质押率小于零的情况
			let [err,result] = await to(this.clientDB
				.query('UPDATE mist_borrows SET (status,deposit_amount,repaid_amount,zhiya_rate,updated_at)=($1,deposit_amount+$2,repaid_amount+$3,(should_repaid_amount-$3)/((deposit_amount+$2)*deposit_price) ,$4) WHERE  deposit_token_name=$5 and  cdp_id=$6',update_info)); 

			if(err) {
				return console.error('update_order_查询失败', err);
			}
			console.log('update_borrows_成功',JSON.stringify(result),"info",update_info); 
			return result.rows;

        } 

		 async insert_borrows(borrow_info) {
			let [err,result] = await to(this.clientDB.query('insert into mist_borrows values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)',borrow_info));
			if(err) {
				return console.error('insert_traders_查询失败', err);
			}
			console.log('insert_borrows_成功',JSON.stringify(result),"info",borrow_info); 
			return JSON.stringify(result.rows);
        } 
		/*
		*
		*users
		*
		*
		*/
	 	async update_user_token(update_info) {
			let [err,result] = await to(this.clientDB
				.query('UPDATE mist_users SET (pi,asim,usdt,eth,mt,btc,pi_valuation,asim_valuation,usdt_valuation,eth_valuation,mt_valuation,btc_valuation,updated_at)=($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) WHERE  address=$14',update_info)); 
			if(err) {
				return console.error('update_user_token_查询失败', err);
			}
			console.log('update_update_user_token_成功',JSON.stringify(result),"info",update_info); 
			return result.rows;

        } 


		async update_user_total(update_info) {
			let [err,result] = await to(this.clientDB
				.query('UPDATE mist_users SET (total_value_1day,total_value_2day,total_value_3day,total_value_4day,total_value_5day,total_value_6day,\
				total_value_7day,updated_at)=($1,total_value_1day,total_value_2day,total_value_3day,total_value_4day,total_value_5day,total_value_6day,$2) WHERE  address=$3',update_info)); 
			if(err) {
				return console.error('update_user_total_查询失败', err);
			}
			console.log('update_user_total_成功',JSON.stringify(result),update_info); 
			return result.rows;

        } 



		 async insert_users(address_info) {
			let [err,result] = await to(this.clientDB.query('insert into mist_users values($1)',address_info));
			if(err) {
				return console.error('insert_users_查询失败', err);
			}
			console.log('insert_users_成功',JSON.stringify(result),"info",address_info); 
			return JSON.stringify(result.rows);
        }


		async find_user(address) {
			let [err,result] = await to(this.clientDB.query('SELECT * FROM mist_users  where address=$1',address)); 
			if(err) {
				return console.error('find_user_查询失败', err);
			}
			return result.rows;
		}

		async list_users() {
			let [err,result] = await to(this.clientDB.query('SELECT * FROM mist_users')); 
			if(err) {
				return console.error('list_users_查询失败', err);
			}
			return result.rows;
		}

		async find_cdp_token(token_name) {
			let [err,result] = await to(this.clientDB.query('SELECT * FROM mist_cdp_info  where token_name=$1',token_name)); 
			if(err) {
				return console.error('find_cdp_token_查询失败', err);
			}
			return result.rows;
		}

		async list_cdp() {
			let [err,result] = await to(this.clientDB.query('SELECT * FROM mist_cdp_info')); 
			if(err) {
				return console.error('list_cdp_查询失败', err);
			}
			return result.rows;
		}
		/*
			coin convert
		*/



		async my_converts(address) {
			let [err,result] = await to(this.clientDB.query('SELECT * FROM mist_token_convert  where address=$1 order by created_at desc limit 30',address)); 
			if(err) {
				return console.error('list_borrows_查询失败', err);
			}
			return result.rows;

		}

		async my_converts2(filter_info) {
			console.log("11223344",filter_info);
			let [err,result] = await to(this.clientDB.query('SELECT * FROM mist_token_convert  where address=$1 order by created_at desc limit $3 offset $2',filter_info)); 
			if(err) {
				return console.error('list_borrows_查询失败', err);
			}

			console.log("1122334455",result.rows);
			return result.rows;

		}

		
		 async insert_converts(info) {
			let [err,result] = await to(this.clientDB.query('insert into mist_token_convert values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)',info));
			if(err) {
				return console.error('insert_traders_查询失败', err);
			}
			console.log('insert_borrows_成功',JSON.stringify(result),"info",borrow_info); 
			return JSON.stringify(result.rows);
        } 


		 async get_engine_info() {
			let [err,result] = await to(this.clientDB.query('select status,count(1) from mist_trades group by status'));
			if(err) {
				return console.error('insert_traders_查询失败', err);
			}
			return JSON.stringify(result.rows);
        } 
		/*
		assets
		*/
		async list_assets_info(){
			let [err,result] = await to(this.clientDB.query('select s.*,m.circulation_amount as old_circulation_amount   from (select * from asim_assets_info order by created_at desc limit 5)s left join (select * from asim_assets_info where created_at - current_timestamp < \'24 minutes\' order by created_at limit 5)m on s.asset_id=m.asset_id'));
			if(err) {
				return console.error('errlist_assets_info_查询失败', err);
			}
			return JSON.stringify(result.rows);
			
		}

		 async insert_assets_info(info) {
			let [err,result] = await to(this.clientDB.query('insert into asim_assets_info  values($1,$2,$3,$4,$5,$6,$7,$8)',info));
			if(err) {
				return console.error('insert__assets_info_查询失败', err,info);
			}
			return JSON.stringify(result.rows);
        }

}
