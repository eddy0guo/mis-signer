import to from 'await-to-js'

export default class db{
        clientDB;
        constructor() {
                const pg=require('pg')
                        var conString = "postgres://postgres:postgres@127.0.0.1/postgres?sslmode=disable";
                let client = new pg.Client(conString);
                client.connect(function(err) {
                                if(err) {
                                return console.error('连接postgreSQL数据库失败', err);
                                }   
                                });
                this.clientDB  = client;
        }

        /**
         *orders
         *
         *
         *
         *
         *
		 */
		async insert_order(ordermessage) {

			let [err,result] = await to(this.clientDB.query('insert into mist_orders values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)',ordermessage));
			if(err) {
				return console.error('insert_order_查询失败', err);
			}
			console.log('insert_order_成功',JSON.stringify(result.rows)); 
			return JSON.stringify(result.rows);
		}

		async list_orders(filter) {
			let [err,result] = await to(this.clientDB.query('SELECT * FROM mist_orders order by created_at desc limit 30',filter)); 
			if(err) {
				return console.error('insert_order_查询失败', err);
			}
			console.log('insert_order_成功',JSON.stringify(result.rows)); 
			return result.rows;

		} 

		async filter_orders(filter) {
			//价格低的匹配优先级低 
			let [err,result] = await to(this.clientDB.query('SELECT * FROM mist_orders where price>=$1 and side=$2 order by price desc',filter)); 
			if(err) {
				return console.error('insert_order_查询失败', err);
			}
			console.log('insert_order_成功',JSON.stringify(result.rows)); 
			return result.rows;

		} 

		
        async update_orders(update_info) {
			let [err,result] = await to(this.clientDB
				.query('UPDATE mist_orders SET (available_amount,confirmed_amount,canceled_amount,pending_amount,updated_at)=($1,$2,$3,$4,$5) WHERE id=$6',update_info)); 

			if(err) {
				return console.error('insert_order_查询失败', err);
			}
			console.log('insert_order_成功',JSON.stringify(result.rows)); 
			return result.rows;


        } 


        async findtrades(tradeid) {

        }

        /*
         *tokens
         *
         * */
        async findtrades(tradeid) {
        }


         /*
         *makkets
         *
         * */
        async findtrades(tradeid) {

        }


        /*
         *
         *
         *trades
         */
        async insert_trades(trade_info) {
			let [err,result] = await to(this.clientDB.query('insert into mist_trades values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',trade_info));
			if(err) {
				return console.error('insert_traders_查询失败', err);
			}
			console.log('insert_order_成功',JSON.stringify(result.rows)); 
			return JSON.stringify(result.rows);


        } 
         /**
         *lauchers
         *
         *
         * */
          async insert_trade(trademessage) {


        } 

         /**
         *transactions
         *
         *
         * */
          async insert_trade(trademessage) {

        } 

        /**
         *watchers
         *
         *
         * */
          async insert_watcher(message) {
        } 

}
