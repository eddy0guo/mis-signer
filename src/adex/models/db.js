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

                this.clientDB.query('insert into mist_orders values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)',ordermessage, function(err, data) {
                                if(err) {
                                return console.error('查询失败', err);
                                }else{
                                // result = JSON.stringify(data.rows); 
                                console.log('成功',JSON.stringify(data.rows)); 
                                return JSON.stringify(data.rows);
                                }   
                                }); 
                return "sss";
        } 
        async list_orders(filter) {

        let result = await this.clientDB.query('SELECT * FROM mist_orders order by created_at desc limit 30'); 
                console.log('igxy-2222---成功',JSON.stringify(result.rows)); 

                return result;

        } 

        async filter_orders(filter) {
               //价格低的匹配优先级低 
                let result = await this.clientDB.query('SELECT * FROM mist_orders where price>=$1 and side=$2 order by price desc',filter); 
                console.log('igxy-2222---成功',JSON.stringify(result.rows)); 

                return result.rows;
        } 


        async find_orders(orderid) {
                let result = await this.clientDB.query('SELECT * FROM mist_orders limit 2'); 
                console.log('igxy-2222---成功',JSON.stringify(result.rows)); 

                return result;
        } 


        async findtrades(tradeid) {
                let result = await this.clientDB.query('SELECT * FROM mist_orders limit 2'); 
                console.log('igxy-2222---成功',JSON.stringify(result.rows)); 

                return result;


        }

        /*
         *tokens
         *
         * */
        async findtrades(tradeid) {
                let result = await this.clientDB.query('SELECT * FROM mist_orders limit 2'); 
                console.log('igxy-2222---成功',JSON.stringify(result.rows)); 

                return result;


        }


         /*
         *makkets
         *
         * */
        async findtrades(tradeid) {
                let result = await this.clientDB.query('SELECT * FROM mist_orders limit 2'); 
                console.log('igxy-2222---成功',JSON.stringify(result.rows)); 

                return result;


        }


        /*
         *
         *
         *
         *
         *
         *
         *trades
         */
        async insert_trade(trademessage) {

                this.clientDB.query('insert into mist_trades values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)',trademessage, function(err, data) {
                                if(err) {
                                return console.error('查询失败', err);
                                }else{
                                // result = JSON.stringify(data.rows); 
                                console.log('成功',JSON.stringify(data.rows)); 
                                return JSON.stringify(data.rows);
                                }   
                                }); 
                return "sss";
        } 
         /**
         *lauchers
         *
         *
         * */
          async insert_trade(trademessage) {

                this.clientDB.query('insert into mist_trades values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)',trademessage, function(err, data) {
                                if(err) {
                                return console.error('查询失败', err);
                                }else{
                                // result = JSON.stringify(data.rows); 
                                console.log('成功',JSON.stringify(data.rows)); 
                                return JSON.stringify(data.rows);
                                }   
                                }); 
                return "sss";
        } 

         /**
         *transactions
         *
         *
         * */
          async insert_trade(trademessage) {

                this.clientDB.query('insert into mist_trades values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)',trademessage, function(err, data) {
                                if(err) {
                                return console.error('查询失败', err);
                                }else{
                                // result = JSON.stringify(data.rows); 
                                console.log('成功',JSON.stringify(data.rows)); 
                                return JSON.stringify(data.rows);
                                }   
                                }); 
                return "sss";
        } 




        /**
         *watchers
         *
         *
         * */
          async insert_watcher(message) {

                this.clientDB.query('insert into mist_trades values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)',trademessage, function(err, data) {
                                if(err) {
                                return console.error('查询失败', err);
                                }else{
                                // result = JSON.stringify(data.rows); 
                                console.log('成功',JSON.stringify(data.rows)); 
                                return JSON.stringify(data.rows);
                                }   
                                }); 
                return "sss";
        } 

}
