import helper from './txHelper'
import {
  chain
} from '../api/chain'

import {
  TranService
} from "../service/transaction";
import {
  CONSTANT
} from "../constant";
import {
  checkContractAddress,
  signature,
  btc2sts,
  isArrayType,
  callParamsConvert
} from "../utils";

import to from 'await-to-js'

/*
New key pair (priv, pubkey) (format:hex)
    { 0x387f7027744659877498c55b1bb54e3e33038136332570aac3c3cb3ef0b399f9 , 0x02057099285ea82ad91d7f4ad520f3cf77836174f2be607e1ba6e0ed5483136847 }
    Compressed pubkey hash address: 0x66a05f89cbfc5533578e385d1e843679aba73833f1

*/

const abiStr = '[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"amount","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getTemplateInfo","outputs":[{"name":"","type":"uint16"},{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address","value":"0x66b31cab7d9eb10cfcdb7a3c19dcd45f362e15ba8e"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_category","type":"uint16"},{"name":"_templateName","type":"string"}],"name":"initTemplate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]';

const contractAddress = '0x633c6e19bdc52f8d76baaaa5adc963b09a11a8509c';

/**
 * Addresses of Asilink
 */
const addr1 = '0x6699fe56a98aa190bdd63239e82d03ae0dba8ad1a1';
const addr2 = '0x661743c23467045cde4b199a29568dabdb9733a739';

/**
 * Address of Wallet
 */
const addr0 = '0x6619fd2d2fd1db189c075ff25800f7b98ff3205e5a';
const word0 = 'benefit park visit oxygen supply oil pupil snack pipe decade young bracket';

//Wallet('benefit park visit oxygen supply oil pupil snack pipe decade young bracket','111111')

export default class erc20 {
  static async testBalanceOf(wallet) {
    let abiInfo = {
      "constant": true,
      "inputs": [{
        "name": "owner",
        "type": "address",
        "value": addr0
      }],
      "name": "balanceOf",
      "outputs": [{
        "name": "balance",
        "type": "uint256"
      }],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    };
    return erc20.callContract(abiInfo, wallet);
  }

  static async testTransfer(wallet) {
    let abiInfo = {
      "constant": false,
      "inputs": [{
        "name": "to",
        "type": "address",
        "value": addr2
      }, {
        "name": "amount",
        "type": "uint256",
        "value": "1"
      }],
      "name": "transfer",
      "outputs": [{
        "name": "",
        "type": "bool"
      }],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    };

    //0xa9059cbb
    // 0x0000000000000000000000668a4cd95f49cd3eb6639a860d4cc7e94172571e7e0000000000000000000000000000000000000000000000000000000000000001
    return erc20.callContract(abiInfo, wallet);
  }


  
  /**
   * Call Contract Function with abi Info
   * @param {*} abiInfo 
   * @param {*} wallet 
   */
  static async callContract(abiInfo, wallet) {
    let params = {
      to: contractAddress,
      amount: 0,
      assetId: CONSTANT.DEFAULT_ASSET,
      data: erc20.genData(abiInfo)
    };
    // a9059cbb0000000000000000000000668a4cd95f49cd3eb6639a860d4cc7e94172571e7e0000000000000000000000000000000000000000000000000000000000000001
    console.log(params.data)

    if (abiInfo.stateMutability == 'view' || abiInfo.stateMutability == 'pure') {
      let paramAry = [addr1, contractAddress, params.data, abiInfo.name, abiStr]
      return chain.callreadonlyfunction(paramAry)
    } else {
      params.from = addr0
      params.type = CONSTANT.CONTRACT_TYPE.CALL
      // console.log("call:", params)
      return erc20.executeContract(params, wallet, '111111')
      // console.log("call result:", res)
    }
  }

  /**
   * Execute Contract Function，执行前需要确保本地UTXO缓存是最新的。
   * @param {*} params 
   * @param {*} wallet 
   * @param {*} password 
   */
  static async executeContract(params, wallet, password) {
    // 先简单处理，Execute 前更新UTXO
    // await wallet.queryAllBalance()

    let { ins, changeOut } = await TranService.chooseUTXO(
      wallet.walletId,
      params.amount,
      params.assetId,
      params.from
    );

    console.log(ins,changeOut)

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

    // console.log("keys",keys)

    try {
      let rawtx = TranService.generateRawTx(ins, outs, keys);

      console.log("Raw TX:", rawtx)
      if (!rawtx) {
        console.log("Raw TX Error")
        return;
      }

      // let decoded = await TranService.decodeRawTx(rawtx)
      // console.log(decoded)

      console.log("Success:",params,ins,outs);
      return chain.sendrawtransaction([rawtx]);
    } catch (e) {
      console.log("TX Error", e)
    }
  }



  static genData(abiInfo) {
    if (!abiInfo) return
    if (!abiInfo.inputs) return

    let funcArgs = []

    abiInfo.inputs.forEach(i => {
      if (isArrayType(i.type)) {
        let arr = JSON.parse(i.value);
        let type = i.type.replace('[]', '');
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
    } catch (e) {
      console.log("encodeFunctionId:",e,abiInfo);
      return;
    }

    try {
      paramsHash = helper.encodeParams(abiInfo, funcArgs).toString('hex');
    } catch (e) {
      console.log("encodeParams",e,abiInfo,funcArgs);
      return;
    }

    let data = functionHash.replace('0x', '') + paramsHash.replace('0x', '');

    console.log(functionHash, paramsHash)

    return data;
  }


}