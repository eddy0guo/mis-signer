import helper from '../lib/txHelper'
import { chain } from '../api/chain'
import { TranService } from "../service/transaction";
import { CONSTANT } from "../constant";
import { btc2sts, isArrayType, callParamsConvert,signature,getWalletPubKey} from "../utils";
const bitcore_lib_1 = require("bitcore-lib");
const ECDSA = bitcore_lib_1.crypto.ECDSA;
var util =require('ethereumjs-util');
var bip39 = require('bip39');
var bip32 = require('bip32');
var bitcoin = require('bitcoinjs-lib');
var ethers = require('ethers');
let hdkey = require('ethereumjs-wallet/hdkey');
import {mist_config} from '../../adex/index';

import { HDPrivateKey, crypto } from "bitcore-lib";


export default class Token {
 abiStr='[{"constant":true,"inputs":[{"components":[{"name":"adr","type":"address"},{"name":"age","type":"uint256"},{"components":[{"name":"naem","type":"string"}],"name":"mg","type":"tuple"}],"name":"ab","type":"tuple"}],"name":"sdfs","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"components":[{"name":"taker","type":"address"},{"name":"maker","type":"address"},{"name":"baseToken","type":"address"},{"name":"quoteToken","type":"address"},{"name":"relayer","type":"address"},{"name":"baseTokenAmount","type":"uint256"},{"name":"quoteTokenAmount","type":"uint256"},{"name":"takerSide","type":"string"}],"name":"_order","type":"tuple"}],"name":"getorderhash","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"components":[{"name":"taker","type":"address"},{"name":"maker","type":"address"},{"name":"baseTokenAmount","type":"uint256"},{"name":"quoteTokenAmount","type":"uint256"},{"name":"takerSide","type":"string"},{"name":"r","type":"bytes32"},{"name":"s","type":"bytes32"},{"name":"v","type":"uint8"}],"name":"TradeParams","type":"tuple[]"},{"components":[{"name":"baseToken","type":"address"},{"name":"quoteToken","type":"address"},{"name":"relayer","type":"address"}],"name":"orderAddressSet","type":"tuple"}],"name":"matchOrder","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getTemplateInfo","outputs":[{"name":"","type":"uint16"},{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"components":[{"name":"taker","type":"address"},{"name":"maker","type":"address"},{"name":"baseToken","type":"address"},{"name":"quoteToken","type":"address"},{"name":"relayer","type":"address"},{"name":"baseTokenAmount","type":"uint256"},{"name":"quoteTokenAmount","type":"uint256"},{"name":"takerSide","type":"string"}],"name":"_order","type":"tuple"}],"name":"hashordermsg","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_hashmsg","type":"bytes32"}],"name":"hashmsg","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"EIP712_ORDERTYPE","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_category","type":"uint16"},{"name":"_templateName","type":"string"}],"name":"initTemplate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_hash","type":"bytes32"},{"components":[{"name":"taker","type":"address"},{"name":"maker","type":"address"},{"name":"baseTokenAmount","type":"uint256"},{"name":"quoteTokenAmount","type":"uint256"},{"name":"takerSide","type":"string"},{"name":"r","type":"bytes32"},{"name":"s","type":"bytes32"},{"name":"v","type":"uint8"}],"name":"_trade","type":"tuple"},{"components":[{"name":"baseToken","type":"address"},{"name":"quoteToken","type":"address"},{"name":"relayer","type":"address"}],"name":"_order","type":"tuple"}],"name":"isValidSignature","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor","name":"MistExchange"},{"anonymous":false,"inputs":[{"indexed":false,"name":"ads","type":"address"}],"name":"isValid","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"bs","type":"bytes32"}],"name":"orderhashmsg","type":"event"}]' 
 fee = 0.1
 gasLimit = 30000000

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
        amount: 0.02,
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




   async matchorder(trades_info,order_address_set){
	  //relayer_pri_key
/*
//let mnemonic = bip39.generateMnemonic()
let mnemonic = 'ivory local this tooth occur glide wild wild few popular science horror';
	  const network = bitcoin.networks.bitcoin
// 计算seed:
//const seed = bip39.mnemonicToSeed(mnemonic,'')
const seed = bip39.mnemonicToSeedHex(mnemonic);
console.log('seed:' + util.bufferToHex(seed), "\n");
const root = bip32.fromSeed(seed,network)
const path = "m/44'/0'/0'/0/0";
const keyPair = root.derivePath(path)
const privateKey = keyPair.toWIF()
console.log("BTC私钥：", privateKey)
const publicKey = keyPair.publicKey.toString("hex")
console.log("BTC公钥：", publicKey)
let address = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey , network:network})
console.log("BTC普通地址：", address.address, "\n")

let mnemonic2 = 'ivory local this tooth occur glide wild wild few popular science horror';
let Wallet = ethers.Wallet.fromMnemonic(mnemonic2);
    let privateKey2 = Wallet.privateKey;
    console.log('ETH私钥：',privateKey2)
	console.log("11111111222-privatekey=",privateKey2);
	let address_eth = Wallet.address;
    console.log('ETH地址：',address_eth);


	let hdwallet = hdkey.fromMasterSeed(seed);

    for (let i = 0; i < 3; i++) {
    //    let path = "m/44'/60'/0'/0/" + i;
        let path ="m/44'/10003'/0'";
        console.log(path);

        let keypair = hdwallet.derivePath(path);

        let privateKey = util.bufferToHex(keypair._hdkey._privateKey);
        console.log('私钥：', privateKey);
        let publicKey = util.bufferToHex(keypair._hdkey._publicKey);
        console.log('公钥：', publicKey);

        let address = util.pubToAddress(keypair._hdkey._publicKey, true);
        console.log('地址：', address.toString('hex'))
}

const hdPrivateKey = HDPrivateKey.fromSeed(seed).derive(
      `m/44'/10003'/0'/0/0`);
console.log("111111-prikey---22",hdPrivateKey.privateKey);
console.log("111111-prikey---22",hdPrivateKey.privateKey.toString());

console.log("111111-prikey---22",hdPrivateKey.privateKey.slice(13,78));
**/


	 //  var privKey =  'd2dd57d8969770fad230bf34cacc5ca60e2dc7e406f8f99ced0f59ccf56a19c2';
	   console.log("222trades_info--",trades_info);
	   for(var index in trades_info){
		   //打印trade id
		   console.log("1111i44444444",trades_info[index][0].slice(2,66));
		   var hashbuf=Buffer.alloc(32,trades_info[index][0].slice(2,66),'hex');
		   var sign = util.ecsign(hashbuf, util.toBuffer(mist_config.relayer_prikey));
		   let v = sign.v.toString();
		   let r = '0x' + sign.r.toString("hex");
		   let s = '0x' + sign.s.toString("hex");
		   //去掉id
		  trades_info[index].splice(0,1);
		   trades_info[index].push(r,s,v);
		   console.log("1111",index,r,s,v);
			/**var sign2=new bitcore_lib_1.crypto.Signature()
			 sign2.set({
             r:sign.r.toString("hex"),
             s:sign.s.toString("hex")
         })
		  var publick=new bitcore_lib_1.PrivateKey(privKey).toPublicKey();
		   console.log('签名验证==',ECDSA.verify(hashbuf,sign2,publick))
		   **/
	   }


	 
	   console.log("3333---trades_info",trades_info)
	   console.log("4444---order_address_setinfo",order_address_set)
//		asim-api
        let abiInfo=
        {"constant":false,
        "inputs":[{"components":
        [{"name":"taker","type":"address"},
        {"name":"maker","type":"address"},
        {"name":"baseTokenAmount","type":"uint256"},
        {"name":"quoteTokenAmount","type":"uint256"},
        {"name":"takerSide","type":"string"},
        {"name":"r","type":"bytes32"},
        {"name":"s","type":"bytes32"},
        {"name":"v","type":"uint8"}],
    //    "name":"TradeParams","type":"tuple[]","value":[['0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9','0x66b7637198aee4fffa103fc0082e7a093f81e05a64',10,10,
      //  'buy','0x3731597097df23bc05b8e938ebc8a606e47b7c13987d6d9a04070eb049464685','0x653a585c541dcbe2055049f12a9e3a7b58f20fb1b3de702a48855b55d31f2bd0',27]]},
    	  "name":"TradeParams","type":"tuple[]","value":trades_info},
        {"components":
        [{"name":"baseToken","type":"address"},
        {"name":"quoteToken","type":"address"},
        {"name":"relayer","type":"address"}],
     //   "name":"orderAddressSet","type":"tuple","value":['0x6376141c4fa5b11841f7dc186d6a9014a11efcbae6','0x63b98f4bf0360c91fec1668aafdc552d3c725f66bf','0x6611f5fa2927e607d3452753d3a41e24a23e0b947f']}],
       "name":"orderAddressSet","type":"tuple","value":order_address_set}],
        "name":"matchOrder",
        "outputs":[],
        "payable":false,
        "stateMutability":"nonpayable",
        "type":"function"}
	  return this.callContract(abiInfo);
    }
    
   

}
