
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
        async insertorder(ordermessage) {
                
               this.clientDB.query('insert into neworder values($1,$2,$3)',ordermessage, function(err, data) {
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
        async listorders() {
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

      async findorders(orderid) {
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
