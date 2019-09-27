import to from 'await-to-js'
import TokenTest from '../wallet/contract/TokenTest'
import walletHelper from '../wallet/lib/walletHelper'
import { Router } from 'express'
import order1 from './api/order'

let walletInst;
let wallet_taker;
async function getTestInst(){
        if( walletInst ) return walletInst;
                walletInst = await walletHelper.testWallet('ivory local this tooth occur glide wild wild few popular science horror','111111')
                                return walletInst
}

async function taker_wallet(){
        if( walletInst ) return walletInst;
                wallet_taker = await walletHelper.testWallet('enhance donor garment gospel loop purse pumpkin bag oven bone decide street','111111')
                                return wallet_taker
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

    adex.get('/transfer_from',async (req, res) => {

                    walletInst = await getTestInst();
                    let [err,result] = await to(tokenTest.testTransferfrom(walletInst,'0x66b7637198aee4fffa103fc0082e7a093f81e05a64',5))
                    console.log(result,err);

                    if( !err ){
                    // 先简单处理，Execute 前更新UTXO
                    await walletInst.queryAllBalance()
                    }

                    res.json({ result:result,err:err });
                    });

    
    adex.get('/approve',async (req, res) => {
                    
                    let mist_ex = "0x66edd03c06441f8c2da19b90fcc42506dfa83226d3";
                    let value = "6666";
                    wallet_taker = await taker_wallet();
                    let [err,result] = await to(tokenTest.testApprove(wallet_taker,mist_ex,value))
                    console.log(result,err);

                    res.json({ result:result,err:err });
                    });

    adex.get('/build_order', async (req, res) => {

       let message = {
                      id:null,
                      trader_address: "0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9",
                      market_id: "ASIM-PAI",
                      side: "sell",
                      price: 1.13000000000000000,
                      amount: 11.00000000000000,
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
