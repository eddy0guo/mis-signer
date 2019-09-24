import to from 'await-to-js'

import { Router } from 'express'
import dbps from './models/db'
import orderbuild from './api/orderbuild'


export default ({ config, db }) => {
	let adex  = Router();
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
                            console.log('成功',JSON.stringify(data.rows)); 
                            }
                            client.end();
                            });
     });

	adex.get('/hello', async (req, res) => {
       let result = "sss";
       let err;
       res.json({result,err });
	});


	adex.get('/build_order', async (req, res) => {

       let marketID = "ASIM-API"
       let amount = 66
       let price = 33;
       let result = amount;
       let err = price;
       res.json({result,err });
	});

	adex.get('/cancle_order', async (req, res) => {
       let result = "sss";
       let err = "kkk";
       res.json({result,err });
	});

	adex.get('/order_book', async (req, res) => {
       let result = "sss";
       let err = "kkk";
       res.json({result,err });
	});

	adex.get('/orders', async (req, res) => {
       let result = "sss";
       let err = "kkk";
       res.json({result,err });
	});

	return adex;
}
