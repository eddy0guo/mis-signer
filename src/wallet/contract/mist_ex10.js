import helper from '../lib/txHelper'
import { chain } from '../api/chain'
import { mist_config} from '../../cfg'
import { TranService } from "../service/transaction";
import { CONSTANT } from "../constant";
import { btc2sts, isArrayType, callParamsConvert,signature,getWalletPubKey} from "../utils";
const bitcore_lib_1 = require("bitcore-lib");
import adex_utils from '../../adex/api/utils'
const ECDSA = bitcore_lib_1.crypto.ECDSA;
var util =require('ethereumjs-util');
var bip39 = require('bip39');
var bip32 = require('bip32');
var bitcoin = require('bitcoinjs-lib');
var ethers = require('ethers');

let hdkey = require('ethereumjs-wallet/hdkey');
import {AsimovWallet, Transaction,AsimovConst} from '@fingo/asimov-wallet';


import { HDPrivateKey, crypto } from "bitcore-lib";


export default class Token {
 abiStr='[{"constant":true,"inputs":[{"components":[{"name":"adr","type":"address"},{"name":"age","type":"uint256"},{"components":[{"name":"naem","type":"string"}],"name":"mg","type":"tuple"}],"name":"ab","type":"tuple"}],"name":"sdfs","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"components":[{"name":"taker","type":"address"},{"name":"maker","type":"address"},{"name":"baseToken","type":"address"},{"name":"quoteToken","type":"address"},{"name":"relayer","type":"address"},{"name":"baseTokenAmount","type":"uint256"},{"name":"quoteTokenAmount","type":"uint256"},{"name":"takerSide","type":"string"}],"name":"_order","type":"tuple"}],"name":"getorderhash","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"components":[{"name":"taker","type":"address"},{"name":"maker","type":"address"},{"name":"baseTokenAmount","type":"uint256"},{"name":"quoteTokenAmount","type":"uint256"},{"name":"takerSide","type":"string"},{"name":"r","type":"bytes32"},{"name":"s","type":"bytes32"},{"name":"v","type":"uint8"}],"name":"TradeParams","type":"tuple[]"},{"components":[{"name":"baseToken","type":"address"},{"name":"quoteToken","type":"address"},{"name":"relayer","type":"address"}],"name":"orderAddressSet","type":"tuple"}],"name":"matchOrder","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getTemplateInfo","outputs":[{"name":"","type":"uint16"},{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"components":[{"name":"taker","type":"address"},{"name":"maker","type":"address"},{"name":"baseToken","type":"address"},{"name":"quoteToken","type":"address"},{"name":"relayer","type":"address"},{"name":"baseTokenAmount","type":"uint256"},{"name":"quoteTokenAmount","type":"uint256"},{"name":"takerSide","type":"string"}],"name":"_order","type":"tuple"}],"name":"hashordermsg","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_hashmsg","type":"bytes32"}],"name":"hashmsg","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"EIP712_ORDERTYPE","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_category","type":"uint16"},{"name":"_templateName","type":"string"}],"name":"initTemplate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_hash","type":"bytes32"},{"components":[{"name":"taker","type":"address"},{"name":"maker","type":"address"},{"name":"baseTokenAmount","type":"uint256"},{"name":"quoteTokenAmount","type":"uint256"},{"name":"takerSide","type":"string"},{"name":"r","type":"bytes32"},{"name":"s","type":"bytes32"},{"name":"v","type":"uint8"}],"name":"_trade","type":"tuple"},{"components":[{"name":"baseToken","type":"address"},{"name":"quoteToken","type":"address"},{"name":"relayer","type":"address"}],"name":"_order","type":"tuple"}],"name":"isValidSignature","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor","name":"MistExchange"},{"anonymous":false,"inputs":[{"indexed":false,"name":"ads","type":"address"}],"name":"isValid","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"bs","type":"bytes32"}],"name":"orderhashmsg","type":"event"}]' 
 fee = 10000000;
 gasLimit = 100000000

 constructor(address) {
    this.address = address;
}

unlock(wallet, password) {
    this.wallet = wallet
    this.password = password
}

async callContract(abiInfo) {
    let params = {
        to: this.address,
        amount: 0,
        assetId: CONSTANT.DEFAULT_ASSET,
        data: this.getHexData(abiInfo)
      };
      console.log('params.data',params.data)
    if (abiInfo.stateMutability == 'view' || abiInfo.stateMutability == 'pure') {
        return chain.callreadonlyfunction([this.address, this.address, params.data, abiInfo.name, this.abiStr])
    } else {
        params.from = await this.wallet.getAddress()
        params.type = CONSTANT.CONTRACT_TYPE.CALL
        return this.executeContract(params)
    }
}

async executeContract(params) {
    let wallet = this.wallet;
    let password = this.password;

 const assetObjArr = [];

        assetObjArr.push({
        amount: params.amount,
        asset: params.assetId
      });

      assetObjArr.push({
        amount: 20000000,
        asset: '000000000000000000000000'
      });

      const { ins, changeOut } = await TranService.chooseUTXO(
        wallet.walletId,
        assetObjArr,
        params.from
      );


    let outs = [{
        amount: btc2sts(parseFloat(params.amount)),
        assets: params.assetId,
        address: params.to,
        data: params.data || "",
        contractType: params.type || ""
    }];

    if (changeOut && changeOut.length) {
        outs = outs.concat(changeOut);
    }

    let keys = await wallet.getPrivateKeys(
        CONSTANT.DEFAULT_COIN.coinType,
        ins,
        password
    );
    console.log("privatekeuy===",keys)

    try {
        console.log("Input",ins)
        let rawtx = TranService.generateRawTx(ins, outs, keys, this.gasLimit);

        console.log("RAWTX:",rawtx)

        if (!rawtx) {
            console.log("executeContract Raw TX Error")
            return;
        }

        console.log("executeContract Success:", params, ins, outs);
        return chain.sendrawtransaction([rawtx]);
    } catch (e) {
        console.log("executeContract TX Error", e)
    }
}


getHexData(abiInfo) {
    if (!abiInfo) return
    if (!abiInfo.inputs) return

    let funcArgs = []
    abiInfo.inputs.forEach(i => {
        if (isArrayType(i.type)) {
            let arr = (i.value);
            let type =  i.type.replace('[]', '');
            let result = []
            arr.forEach(a => {
                result.push(callParamsConvert(type, a))
            });
            funcArgs.push(result);
        } else {
            funcArgs.push(callParamsConvert(i.type, i.value))
        }
    })

    let functionHash, paramsHash = ""
  
    try {
        functionHash = helper.encodeFunctionId(abiInfo);
        console.log('functionHash',functionHash)
    } catch (e) {
        console.log("getHexData encodeFunctionId Error:", e, abiInfo);
        return;
    }

    try {
         console.log("funcArgs",funcArgs)
        paramsHash = helper.encodeParams(abiInfo, funcArgs).toString('hex');
    } catch (e) {
        console.log("getHexData encodeParams Error", e, abiInfo, funcArgs);
        return;
    }

    let data = functionHash.replace('0x', '') + paramsHash.replace('0x', '');
    return data;
}

   
    async batch(){
         return this.callContract(abiInfo);
    }






    async orderhash(trade){
		console.log("11111111114444444444--",trade);
            let abiInfo=
            {"constant":false,
            "inputs":[{"components":
            [{"name":"taker","type":"address"},
            {"name":"maker","type":"address"},
            {"name":"baseToken","type":"address"},
            {"name":"quoteToken","type":"address"},
            {"name":"relayer","type":"address"},
            {"name":"baseTokenAmount","type":"uint256"},
            {"name":"quoteTokenAmount","type":"uint256"},
            {"name":"takerSide","type":"string"}],
		  	"name":"_order","type":"tuple[]","value":trade}],
			"name":"hashordermsgbatch",
            "outputs":[{"name":"","type":"bytes32[]"}],
            "payable":false,
            "stateMutability":"nonpayable",
            "type":"function"}

         return this.callContract(abiInfo);
     }




   async matchorder(trades_info,prikey){
	   console.log("222trades_info--",trades_info,prikey);

	    let utils = new adex_utils();
	   let trades_arr = [];
	   for(var index in trades_info){
		   console.log("1111i44444444",trades_info[index].trade_hash.slice(2,66));
		   var hashbuf=Buffer.alloc(32,trades_info[index].trade_hash.slice(2,66),'hex');
		   console.log("1111155555",hashbuf); //2a0a3943217145950ad81b04c82aabd2a6e3c098b9ec20500b070d4ef0bb4031

		   var sign = util.ecsign(hashbuf, util.toBuffer(prikey));
		   trades_info[index].v = sign.v.toString();
		   trades_info[index].r = '0x' + sign.r.toString("hex");
		   trades_info[index].s = '0x' + sign.s.toString("hex");
		   delete trades_info[index].trade_hash;

		   let trade_arr = utils.arr_values(trades_info[index]);
		   trades_arr.push(trade_arr);

		   //去掉id
		   console.log("1111",index,trade_arr);

	   }

	   console.log("gxygxy2---trades_info",trades_arr);
		let abiInfo = 
		{"constant":false,
		"inputs":[{"components":
		[{"name":"taker","type":"address"},
		{"name":"maker","type":"address"},
		{"name":"baseToken","type":"address"},
		{"name":"quoteToken","type":"address"},
		{"name":"relayer","type":"address"},
		{"name":"baseTokenAmount","type":"uint256"},
		{"name":"quoteTokenAmount","type":"uint256"},
		{"name":"r","type":"bytes32"},
		{"name":"s","type":"bytes32"},
		{"name":"takerSide","type":"string"},
		{"name":"v","type":"uint8"}],
		"name":"_trader",
		"type":"tuple[]","value":trades_arr}],
		"name":"matchorder",
		"outputs":[{"name":"","type":"bool"}],
		"payable":false,
		"stateMutability":"nonpayable",
		"type":"function"}

	//	  return this.callContract(abiInfo);
		   let child_wallet = new AsimovWallet({
                    name: 'test',
                    rpc: mist_config.asimov_child_rpc,
                    mnemonic: mist_config.bridge_word,
                    // storage: 'localforage',
                });
//                 let balance = await child_wallet.account.balance();

                let [child_err,child_txid] = await to(child_wallet.contractCall.call(
                    mist_config.ex_address,
                    'matchorder(tuple[])',
                    [trades_arr],
                    AsimovConst.DEFAULT_GAS_LIMIT,0,
                    AsimovConst.DEFAULT_ASSET_ID,
                    AsimovConst.DEFAULT_FEE_AMOUNT,
                    AsimovConst.DEFAULT_ASSET_ID,
                    AsimovConst.CONTRACT_TYPE.CALL))
                console.log("---------child_err---child_txid",child_err,child_txid)
    }
    
   

}
