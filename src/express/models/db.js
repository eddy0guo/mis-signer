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

		
		 async insert_express(info) {
			let [err,result] = await to(this.clientDB.query('insert into asim_express_records values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)',info));
			if(err) {
				return console.error('insert_traders_查询失败', err,info);
			}
			console.log('insert_borrows_成功',JSON.stringify(result),"info",borrow_info); 
			return JSON.stringify(result.rows);
        } 

		async order_book(filter) {
            let err;
            let result;
            if(filter[0] == 'sell'){
                [err,result] = await to(this.clientDB.query('select s.* from  (SELECT price,sum(available_amount) as amount FROM mist_orders\
            where available_amount>0  and side=$1 and market_id=$2 group by price)s order by s.price asc limit 100',filter));
            }else{

                [err,result] = await to(this.clientDB.query('select s.* from  (SELECT price,sum(available_amount) as amount FROM mist_orders\
            where available_amount>0  and side=$1 and market_id=$2 group by price)s order by s.price desc limit 100',filter));
            }
            if(err) {
                return console.error('filter_orders_查询失败11',err,filter);
            }
            return result.rows;
        }



}
