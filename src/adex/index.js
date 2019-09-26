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

//          let   trader_address   = "0x43d9649b4a2d2ef6d03a877d440d448d1c1ce"; //       | text                        |           | not null | 
//          let   market_id        = "ASIM-PAI"      ; //       | text                        |           | not null | 
//          let   side             = "sell"      ; //       | text                        |           | not null | 
//          let   price            = 1.10000000000000000      ; //       | numeric(32,18)              |           | not null | 
//          let   amount           = 10.966700000000000000      ; //       | numeric(32,18)              |           | not null | 
//           id               | text                        |           | not null | 
//            trader_address   | text                        |           |          | 
//             market_id        | text                        |           |          | 
//              side             | text                        |           |          | 
//               price            | numeric(32,18)              |           |          | 
//                amount           | numeric(32,18)              |           |          | 
//                 status           | text                        |           |          | 
//                  type             | text                        |           |          | 
//                   available_amount | numeric(32,18)              |           |          | 
//                    confirmed_amount | numeric(32,18)              |           |          | 
//                     canceled_amount  | numeric(32,18)              |           |          | 
//                      pending_amount   | numeric(32,18)              |           |          | 
//                       updated_at       | timestamp without time zone |           |          | 
//                        created_at       | timestamp without time zone | 

       let message = {
                      id:null,
                      trader_address: "0x43d9649b4a2d2ef6d03a877d440d448d1c1ce",
                      market_id: "ASIM-PAI",
                      side: "sell",
                      price: 1.13000000000000000,
                      amount: 10.966700000000000000,
                      status:null,
                      type:null,
                      available_amount:null,
                      confirmed_amount:null,
                      canceled_amount:null,
                      pending_amount:null,
                      updated_at:null,
                      created_at:null,
       };


       //let message =  [trader_address,market_id,side,price,amount]
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
