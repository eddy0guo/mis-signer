import to from 'await-to-js'
import TokenTest from '../wallet/contract/TokenTest'
import Token from '../wallet/contract/Token'

import walletHelper from '../wallet/lib/walletHelper'
import { Router } from 'express'
import order1 from './api/order'

let walletInst;
let wallet_taker;
let wallet_maker;
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

async function my_wallet(word){
                return await walletHelper.testWallet(word,'111111')
}



let    GXY = '0x631f62ca646771cd0c78e80e4eaf1d2ddf8fe414bf';
let    PAI = '0x63429bfcfdfbfa0048d1aeaa471be84675f1324a02';
var ex_address = '0x63d2007ae83b2853d85c5bd556197e09ca4d52d9c9';
let relayer = '0x66edd03c06441f8c2da19b90fcc42506dfa83226d3';


let addr0 = '0x66edd03c06441f8c2da19b90fcc42506dfa83226d3';
let word0 = 'ivory local this tooth occur glide wild wild few popular science horror';

            
let taker = '0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9';
let taker_word = 'enhance donor garment gospel loop purse pumpkin bag oven bone decide street';

let maker = '0x66b7637198aee4fffa103fc0082e7a093f81e05a64';
let maker_word = 'one concert capable dolphin useful earth betray absurd price nerve morning danger';

let addr_chenfei = '0x668191f35bcc9d4c834e06bdbcb773609c40ba4cea';

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

    adex.get('/list_balance',async (req, res) => {
                    
                    let token_arr = [GXY,PAI];
                    let addr_arr = [taker,maker,addr_chenfei];

                    for(var i in token_arr){
                        let token = new Token(token_arr[i]);
                        for(var m in addr_arr){
                            let [err,result] = await to(token.balanceOf(addr_arr[m]));
                            console.log('tokenname:' + token_arr[i] + '    useraddr:' + addr_arr[m] + '       balance:' + result);
                        } 
                    }

                    res.json("sss");
                    });

    //所有token合约赋予所有地址权限
    adex.get('/all_approve',async (req, res) => {
                    
                    let token_arr = [GXY,PAI];
                    let word_arr = [maker_word,taker_word];

                    for(var i in token_arr){
                        let token  = new Token(token_arr[i]);
                        for(var n in word_arr){
                                let wallet = await my_wallet(word_arr[n]);
                                
                                    console.log("approve wallet =",wallet);

                                     token.unlock(wallet,"111111")

                                    await wallet.queryAllBalance()
                                    let [err,result] = await to(token.approve(relayer,100000));
                                    console.log("approve result=",result,err);
                        }
                    }

                    res.json("sss");
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
