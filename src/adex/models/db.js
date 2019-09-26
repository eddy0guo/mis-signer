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
        async insert_order(ordermessage) {
                
               this.clientDB.query('insert into neworders values($7,$1,$2,$3,$4,$5)',ordermessage, function(err, data) {
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

               this.clientDB.query('SELECT * FROM orders limit 1', function(err, data) {
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

      async filter_orders(filter) {
                let result; 
               // await this.clientDB.query('SELECT * FROM orders where type=$2 and price <= $1', filter,function(err, data) {
                await this.clientDB.query('SELECT * FROM orders limit 2',function(err, data) {
                                if(err) {
                                return console.error('查询失败', err);
                                }else{

                                result = JSON.stringify(data.rows); 
                                console.log('成功1111',JSON.stringify(data.rows)); 
                                return JSON.stringify(data.rows);
                                }   
                                }); 

                //                sleep(1);
                                console.log('igxy-2222---成功',result); 
               return result;
       } 


      async find_orders(orderid) {
                let id = [orderid];
                this.clientDB.query('SELECT * FROM orders where id=$1', id,function(err, data) {
                                if(err) {
                                return console.error('查询失败', err);
                                }else{
                                result = JSON.stringify(data.rows); 
                                console.log('成功',JSON.stringify(data.rows)); 
                                return JSON.stringify(data.rows);
                                }   
                                }); 
               return "sss";
       } 


     async findtrades(tradeid) {
                let id = [tradeid]
               this.clientDB.query('SELECT * FROM trades where id=$1',id, function(err, data) {
                                if(err) {
                                return console.error('查询失败', err);
                                }else{
                                result = JSON.stringify(data.rows); 
                                console.log('成功',JSON.stringify(data.rows)); 
                                return JSON.stringify(data.rows);
                                }   
                                }); 
               return "sss";
       } 
}
