import to from 'await-to-js'

import { Router } from 'express'
import order1 from './api/order'

export default ({ config, db }) => {
	let adex  = Router();
    let order = new order1();
        
   	adex.get('/hello', async (req, res) => {
       let result = "sss";
       let err;
       res.json({result,err });
	});


	adex.get('/build_order', async (req, res) => {

       let marketID = "ASIM-API"
       let amount = 66
       let price = 33;
       let err; 
       let result = await to(order.build(marketID,amount,price))
       console.log(result,err);
       res.json({ result,err });
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

 //   clientDB.end();
	return adex;
}
