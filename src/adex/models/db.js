const pg=require('pg')
var conString = "postgres://postgres:postgres@127.0.0.1/postgres?sslmode=disable";
var client = new pg.Client(conString);
client.connect(function(err) {
                if(err) {
                return console.error('连接postgreSQL数据库失败', err);
                }
                client.query('SELECT * FROM orders limit 10', function(err, data) {
                        if(err) {
                        return console.error('查询失败', err);
                        }else{
                        // console.log('成功',data.rows); 
                        console.log('成功',JSON.stringify(data.rows)); 
                        }
                        client.end();
                        });
 });
