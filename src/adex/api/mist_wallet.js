import client from '../models/db'
import utils2 from './utils'
import to from 'await-to-js'
import TokenTest from '../../wallet/contract/TokenTest'
import Token from '../../wallet/contract/Token'

import walletHelper from '../../wallet/lib/walletHelper'

const crypto = require('crypto');
var date = require("silly-datetime");


let walletInst;
async function getTestInst(){
        if( walletInst ) return walletInst;
                walletInst = await walletHelper.testWallet('ivory local this tooth occur glide wild wild few popular science horror','111111')
                                return walletInst
}

export default class mist_wallet{
    db;
    exchange;
    root_hash;
    constructor() {
         this.db =  new client();
         this.utils = new utils2;
    }
	


	async list_tokens() {
		 let result = await this.db.list_tokens();	
        console.log("cancle_order--result=",result);
        return result;
    }

	async get_token(symbol) {
		 let result = await this.db.get_token([symbol]);	
        console.log("cancle_order--result=");
        return result;
    }



	async allowance(address) {

        console.log("cancle_order--result=",address);
        return result;
    }

	async transfrom() {
		                    walletInst = await getTestInst();
                    let [err,result] = await to(tokenTest.testTransferfrom(walletInst,'0x66b7637198aee4fffa103fc0082e7a093f81e05a64',5))
                    console.log(result,err);

                    if( !err ){
                    // 先简单处理，Execute 前更新UTXO
                    await walletInst.queryAllBalance()
                    }

                    return res.json({ result:result,err:err });

    }

	async transfer() {
		walletInst = await getTestInst();
                    let [err,result] = await to(tokenTest.testTransfer(walletInst))
                    console.log(result,err);

                    if( !err ){
                    // 先简单处理，Execute 前更新UTXO
                    await walletInst.queryAllBalance()
                    }

                    return res.json({ result:result,err:err });
    }
 

 	async approve() {
		let mist_ex = "0x66edd03c06441f8c2da19b90fcc42506dfa83226d3";
                    let value = "6666";
                    wallet_taker = await taker_wallet();
                    let [err,result] = await to(tokenTest.testApprove(wallet_taker,mist_ex,value))
                    console.log(result,err);

                    return res.json({ result:result,err:err });	
    }
 
}
