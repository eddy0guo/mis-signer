import to from 'await-to-js'
import TokenTest from '../wallet/contract/TokenTest'
import walletHelper from '../wallet/lib/walletHelper'
import { Router } from 'express'
import order1 from './api/order'

let walletInst;
async function getTestInst(){
        if( walletInst ) return walletInst;
                walletInst = await walletHelper.testWallet('ivory local this tooth occur glide wild wild few popular science horror','111111')
                                return walletInst
}

export default ({ config, db }) => {
	let adex  = Router();
    let order = new order1();
    let tokenTest = new TokenTest()

        
   	adex.get('/hello', async (req, res) => {
       let result = "sss";
       let err;
       res.json({result,err });
	});


    adex.get('/balance',async (req, res) => {

                    let [err,result] = await to(tokenTest.testBalanceOf())
                    console.log(result,err);

                    res.json({ result:result,err:err });
                    });

    adex.get('/transfer',async (req, res) => {

                    walletInst = await getTestInst();
                    let [err,result] = await to(tokenTest.testTransfer(walletInst))
                    console.log(result,err);

                    if( !err ){
                    // 先简单处理，Execute 前更新UTXO
                    await walletInst.queryAllBalance()
                    }

                    res.json({ result:result,err:err });
                    });

    adex.get('/approve',async (req, res) => {
                    
                    let mist_ex = "0x637f192bff74f7205f98cdba6e058a0be58f369b73";
                    let value = "1234";
                    walletInst = await getTestInst();
                    let [err,result] = await to(tokenTest.testApprove(walletInst,mist_ex,value))
                    console.log(result,err);

                    res.json({ result:result,err:err });
                    });

    adex.get('/build_order', async (req, res) => {

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
