

import helper from '../lib/txHelper'
import { chain } from '../api/chain'
import { TranService } from "../service/transaction";
import { CONSTANT } from "../constant";
import { btc2sts, isArrayType, callParamsConvert,signature,getWalletPubKey} from "../utils";
const bitcore_lib_1 = require("bitcore-lib");
const ECDSA = bitcore_lib_1.crypto.ECDSA;
export default class Token {
 abiStr ='[{"constant":false,"inputs":[{"components":[{"name":"actionType","type":"uint8"},{"name":"marketID","type":"uint16"},{"name":"asset","type":"address"},{"name":"amount","type":"uint256"},{"components":[{"name":"category","type":"uint8"},{"name":"marketID","type":"uint16"},{"name":"user","type":"address"}],"name":"fromBalancePath","type":"tuple"},{"components":[{"name":"category","type":"uint8"},{"name":"marketID","type":"uint16"},{"name":"user","type":"address"}],"name":"toBalancePath","type":"tuple"}],"name":"actions","type":"tuple[]"}],"name":"batch","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"getTemplateInfo","outputs":[{"name":"","type":"uint16"},{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"EIP712_ORDER_TYPE","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"hash","type":"bytes32"},{"name":"signerAddress","type":"address"},{"components":[{"name":"config","type":"bytes32"},{"name":"r","type":"bytes32"},{"name":"s","type":"bytes32"}],"name":"signature","type":"tuple"}],"name":"isValidSignature","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"components":[{"name":"trader","type":"address"},{"name":"baseAssetAmount","type":"uint256"},{"name":"quoteAssetAmount","type":"uint256"},{"name":"gasTokenAmount","type":"uint256"},{"name":"data","type":"bytes32"},{"components":[{"name":"config","type":"bytes32"},{"name":"r","type":"bytes32"},{"name":"s","type":"bytes32"}],"name":"signature","type":"tuple"}],"name":"takerOrderParam","type":"tuple"},{"components":[{"name":"trader","type":"address"},{"name":"baseAssetAmount","type":"uint256"},{"name":"quoteAssetAmount","type":"uint256"},{"name":"gasTokenAmount","type":"uint256"},{"name":"data","type":"bytes32"},{"components":[{"name":"config","type":"bytes32"},{"name":"r","type":"bytes32"},{"name":"s","type":"bytes32"}],"name":"signature","type":"tuple"}],"name":"makerOrderParams","type":"tuple[]"},{"name":"baseAssetFilledAmounts","type":"uint256[]"},{"components":[{"name":"baseAsset","type":"address"},{"name":"quoteAsset","type":"address"},{"name":"relayer","type":"address"}],"name":"orderAddressSet","type":"tuple"}],"name":"matchOrders","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"components":[{"name":"trader","type":"address"},{"name":"relayer","type":"address"},{"name":"baseAsset","type":"address"},{"name":"quoteAsset","type":"address"},{"name":"baseAssetAmount","type":"uint256"},{"name":"quoteAssetAmount","type":"uint256"},{"name":"gasTokenAmount","type":"uint256"},{"name":"data","type":"bytes32"}],"name":"order","type":"tuple"}],"name":"_hashContent","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"eip712hash","type":"bytes32"}],"name":"hashMessage","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_category","type":"uint16"},{"name":"_templateName","type":"string"}],"name":"initTemplate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"components":[{"name":"trader","type":"address"},{"name":"relayer","type":"address"},{"name":"baseAsset","type":"address"},{"name":"quoteAsset","type":"address"},{"name":"baseAssetAmount","type":"uint256"},{"name":"quoteAssetAmount","type":"uint256"},{"name":"gasTokenAmount","type":"uint256"},{"name":"data","type":"bytes32"}],"name":"order","type":"tuple"}],"name":"getHash","outputs":[{"name":"orderHash","type":"bytes32"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"asset","type":"address"},{"name":"user","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"msghash","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"balce","type":"uint256"}],"name":"bac","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"bol","type":"bool"}],"name":"result","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"bl","type":"bool"},{"indexed":false,"name":"bts","type":"bytes32"}],"name":"jiancha","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"bl","type":"uint256"},{"indexed":false,"name":"recovereds","type":"address"}],"name":"jieguo","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"hashs","type":"bytes32"}],"name":"Hashcont","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"smghash","type":"bytes32"}],"name":"MsgHash","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"b","type":"address"},{"indexed":false,"name":"c","type":"uint256"},{"indexed":false,"name":"d","type":"uint256"}],"name":"huazhuan","type":"event"}]'
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

    let { ins, changeOut } = await TranService.chooseUTXO(
        wallet.walletId,
        params.amount,
        params.assetId,
        params.from,
        this.fee
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

    //MistToken contract
        // async deposit(){
        //     let abiInfo=
        //     {"constant":false,
        //     "inputs":[],
        //     "name":"deposit",
        //     "outputs":[],
        //     "payable":true,
        //     "stateMutability":"payable",
        //     "type":"function"
        //     }
        //     return this.callContract(abiInfo);
        // }

        // async withdraw(){
        //     let abiInfo=
        //     {"constant":false,
        //     "inputs":[{"name":"wad","type":"uint256","value":100000000}],
        //     "name":"withdraw",
        //     "outputs":[],
        //     "payable":false,
        //     "stateMutability":"nonpayable",
        //     "type":"function"}
        //     return this.callContract(abiInfo);
        // }
    


    async batch(){
        //1.授权

        //2.转入
            //    let abiInfo=
            //     {"constant":false,
            //     "inputs":[{"components":
            //     [{"name":"actionType","type":"uint8"},
            //     {"name":"marketID","type":"uint16"},
            //     {"name":"asset","type":"address"},
            //     {"name":"amount","type":"uint256"},
            //     {"components":
            //     [{"name":"category","type":"uint8"},
            //     {"name":"marketID","type":"uint16"},
            //     {"name":"user","type":"address"}],
            //     "name":"fromBalancePath","type":"tuple"},
            //     {"components":
            //     [{"name":"category","type":"uint8"},
            //     {"name":"marketID","type":"uint16"},
            //     {"name":"user","type":"address"}],
            //     "name":"toBalancePath","type":"tuple"}],
            //     "name":"actions","type":"tuple[]","value":[[0,0,'0x639e91eb8de49667dc422f45c2bc5ea1d4d15c0645',500,[0,0,'0x668191f35bcc9d4c834e06bdbcb773609c40ba4cea'],[0,0,'0x668191f35bcc9d4c834e06bdbcb773609c40ba4cea']]]}],
            //     "name":"batch",
            //     "outputs":[],
            //     "payable":true,
            //     "stateMutability":"payable",
            //     "type":"function"}



        //3.转出
            // let abiInfo=
            // {"constant":false,
            // "inputs":[{"components":
            // [{"name":"actionType","type":"uint8"},
            // {"name":"marketID","type":"uint16"},
            // {"name":"asset","type":"address"},
            // {"name":"amount","type":"uint256"},
            // {"components":
            // [{"name":"category","type":"uint8"},
            // {"name":"marketID","type":"uint16"},
            // {"name":"user","type":"address"}],
            // "name":"fromBalancePath","type":"tuple"},
            // {"components":
            // [{"name":"category","type":"uint8"},
            // {"name":"marketID","type":"uint16"},
            // {"name":"user","type":"address"}],
            // "name":"toBalancePath","type":"tuple"}],
            // "name":"actions","type":"tuple[]","value":[[1,1,'0x630f4aa765044eb08726c8d370cc5993b562118007',4,[0,0,'0x668191f35bcc9d4c834e06bdbcb773609c40ba4cea'],[0,0,'0x668191f35bcc9d4c834e06bdbcb773609c40ba4cea']]]}],
            // "name":"batch",
            // "outputs":[],
            // "payable":true,
            // "stateMutability":"payable",
            // "type":"function"}





        //划转


        let abiInfo=
        {"constant":false,
        "inputs":[{"components":
        [{"name":"actionType","type":"uint8"},
        {"name":"marketID","type":"uint16"},
        {"name":"asset","type":"address"},
        {"name":"amount","type":"uint256"},
        {"components":
        [{"name":"category","type":"uint8"},
        {"name":"marketID","type":"uint16"},
        {"name":"user","type":"address"}],
        "name":"fromBalancePath","type":"tuple"},
        {"components":
        [{"name":"category","type":"uint8"},
        {"name":"marketID","type":"uint16"},
        {"name":"user","type":"address"}],
        "name":"toBalancePath","type":"tuple"}],
        "name":"actions","type":"tuple[]","value":[[2,0,'0x639e91eb8de49667dc422f45c2bc5ea1d4d15c0645',10,[0,0,'0x668191f35bcc9d4c834e06bdbcb773609c40ba4cea'],[1,0,'0x668191f35bcc9d4c834e06bdbcb773609c40ba4cea']]]}],
        "name":"batch",
        "outputs":[],
        "payable":true,
        "stateMutability":"payable",
        "type":"function"}


// balanceof
       // balanceof
        // let abiInfo=
        // {"constant":false,
        // "inputs":[{"name":"asset","type":"address","value":'0x639e91eb8de49667dc422f45c2bc5ea1d4d15c0645'},
        // {"name":"user","type":"address","value":'0x668191f35bcc9d4c834e06bdbcb773609c40ba4cea'}],
        // "name":"balanceOf",
        // "outputs":[{"name":"balance","type":"uint256"}],
        // "payable":false,
        // "stateMutability":"nonpayable",
        // "type":"function"}

        return this.callContract(abiInfo);
    }






    async orderhash(){
        let abiInfo=
        {"constant":false,
        "inputs":[{"components":
        [{"name":"trader","type":"address"},
        {"name":"relayer","type":"address"},
        {"name":"baseAsset","type":"address"},
        {"name":"quoteAsset","type":"address"},
        {"name":"baseAssetAmount","type":"uint256"},
        {"name":"quoteAssetAmount","type":"uint256"},
        {"name":"gasTokenAmount","type":"uint256"},
        {"name":"data","type":"bytes32"}],
        "name":"order","type":"tuple","value":['0x668191f35bcc9d4c834e06bdbcb773609c40ba4cea','0x668191f35bcc9d4c834e06bdbcb773609c40ba4cea','0x639e91eb8de49667dc422f45c2bc5ea1d4d15c0645',
    '0x639e91eb8de49667dc422f45c2bc5ea1d4d15c0645',1,1,0,'0x0000000000000000000000000000000000000000000000010000000000000000']}],
        "name":"getHash",
        "outputs":[{"name":"orderHash","type":"bytes32"}],
        "payable":false,
        "stateMutability":"nonpayable",
        "type":"function"}

        return this.callContract(abiInfo);
    }






   async matchorder(){
       //1.签名：

        //   var privKey = '36681f121715a65b646968f366da044e8ca4f78dd9402d40699ac28f6dd5a180'
        //   var hashbuf=Buffer.alloc(32,'6b6fa9dca922771774bff5b34764311286574d2495e6b655c653557af5ab8890','hex')
        //   var sig = ECDSA.sign(hashbuf, new bitcore_lib_1.PrivateKey(privKey) )
        //   console.log( 'r',ECDSA.sign(hashbuf,new bitcore_lib_1.PrivateKey(privKey)).r.toString('hex'))
        //   console.log('s',ECDSA.sign(hashbuf,new bitcore_lib_1.PrivateKey(privKey)).s.toString('hex'))

       //hash:3fbf1282baced550b2da0a2db7c46a6844acd82d0953880e6767ec7e6626d3b1
        //r 0xe9245499fe90e99780d6ef706e772502c24a790455f8f39343447ea56ca3e5bf
        //s 0x8712beee41e613edab1325500312f3faa6da96496a84e50c2b59c2cffb23501

        //0x6b6fa9dca922771774bff5b34764311286574d2495e6b655c653557af5ab8890
        
        // r 0x59751b4d9fbff3d96a27e7cc1672e42863f07070f6df5c331a8299a58c999c40
        // s 0x29349b498fbb8280bf7fc58ddfdfda57929e2fa33454be5f31f4807223e341ab


    let abiInfo=
    {"constant":false,
    "inputs":[{"components":
    [{"name":"trader","type":"address"},
    {"name":"baseAssetAmount","type":"uint256"},
    {"name":"quoteAssetAmount","type":"uint256"},
    {"name":"gasTokenAmount","type":"uint256"},
    {"name":"data","type":"bytes32"},
    {"components":
    [{"name":"config","type":"bytes32"},
    {"name":"r","type":"bytes32"},
    {"name":"s","type":"bytes32"}],
    "name":"signature","type":"tuple"}],
    "name":"takerOrderParam","type":"tuple","value":['0x668191f35bcc9d4c834e06bdbcb773609c40ba4cea',1,1,0,'0x0000000000000000000000000000000000000000000000000000000000000000',
    ['0x1b01000000000000000000000000000000000000000000000000000000000000','0xe9245499fe90e99780d6ef706e772502c24a790455f8f39343447ea56ca3e5bf','0x8712beee41e613edab1325500312f3faa6da96496a84e50c2b59c2cffb23501']]},
    {"components":
    [{"name":"trader","type":"address"},
    {"name":"baseAssetAmount","type":"uint256"},
    {"name":"quoteAssetAmount","type":"uint256"},
    {"name":"gasTokenAmount","type":"uint256"},
    {"name":"data","type":"bytes32"},
    {"components":
    [{"name":"config","type":"bytes32"},
    {"name":"r","type":"bytes32"},
    {"name":"s","type":"bytes32"}],
    "name":"signature","type":"tuple"}],
    "name":"makerOrderParams","type":"tuple[]","value":[['0x668191f35bcc9d4c834e06bdbcb773609c40ba4cea',1,1,0,'0x0000000000000000000000000000000000000000000000010000000000000000',
    ['0x1c01000000000000000000000000000000000000000000000000000000000000','0x59751b4d9fbff3d96a27e7cc1672e42863f07070f6df5c331a8299a58c999c40','0x29349b498fbb8280bf7fc58ddfdfda57929e2fa33454be5f31f4807223e341ab']]]},
    {"name":"baseAssetFilledAmounts","type":"uint256[]","value":[1]},   
    {"components":
    [{"name":"baseAsset","type":"address"},
    {"name":"quoteAsset","type":"address"},
    {"name":"relayer","type":"address"}],
    "name":"orderAddressSet","type":"tuple","value":['0x639e91eb8de49667dc422f45c2bc5ea1d4d15c0645','0x639e91eb8de49667dc422f45c2bc5ea1d4d15c0645','0x668191f35bcc9d4c834e06bdbcb773609c40ba4cea']}],
    "name":"matchOrders",
    "outputs":[],
    "payable":false,
    "stateMutability":"nonpayable",
    "type":"function"}
    return this.callContract(abiInfo);
   }
 
   
}