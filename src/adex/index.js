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

          let   trader_address   = "0x43d9649b4a2d2ef6d03a877d440d448d1c1ce"; //       | text                        |           | not null | 
          let   market_id        = "ASIM-PAI"      ; //       | text                        |           | not null | 
          let   side             = "buy"      ; //       | text                        |           | not null | 
          let   price            = 1.430000000000000000      ; //       | numeric(32,18)              |           | not null | 
          let   amount           = 4.966700000000000000      ; //       | numeric(32,18)              |           | not null | 


       let message =  [trader_address,market_id,side,price,amount]
       let err; 
       let result = await to(order.build(message))
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
