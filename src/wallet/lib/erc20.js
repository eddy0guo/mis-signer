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

const contractAddress = '0x6365cba3663d1d1ece4123bf4fdab4b761a56dde07';
const address1 = '0x66b31cab7d9eb10cfcdb7a3c19dcd45f362e15ba8e';
const wallet2 = '0x668a4cd95f49cd3eb6639a860d4cc7e94172571e7e';
const address2 = '0x6619fd2d2fd1db189c075ff25800f7b98ff3205e5a';
const words2 = 'benefit park visit oxygen supply oil pupil snack pipe decade young bracket';

//Wallet('benefit park visit oxygen supply oil pupil snack pipe decade young bracket','111111')

const deployContractData = {
  data: String,
  to: String,
  from: String,
  type: String,
  amount: Number,
  toSignMessage: String
}

export default class erc20 {
  static async testBalanceOf(wallet) {
    let abiInfo = {
      "constant": true,
      "inputs": [{
        "name": "owner",
        "type": "address",
        "value": "0x66b31cab7d9eb10cfcdb7a3c19dcd45f362e15ba8e"
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
    return erc20.callFunction(abiInfo, wallet);
  }

  static async testTransfer(wallet) {
    let abiInfo = {
      "constant": false,
      "inputs": [{
        "name": "to",
        "type": "address",
        "value": wallet2
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
    return erc20.callFunction(abiInfo, wallet);
  }


  static genData(abiInfo) {

    if (!abiInfo) {
      return;
    }
    if (!abiInfo.inputs) {
      return;
    }
    let funcArgs = [];

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
      console.log({
        message: e.message,
        type: 'error'
      });
      return;
    }

    try {
      paramsHash = helper.encodeParams(abiInfo, funcArgs).toString('hex');
    } catch (e) {
      console.log({
        message: e.message,
        type: 'error'
      });
      return;
    }

    let data = functionHash.replace('0x', '') + paramsHash.replace('0x', '');

    return data;
  }

  static async callFunction(abiInfo, wallet) {
    let params = {
      to: contractAddress,
      amount: 0,
      assetId: 0,
      data: erc20.genData(abiInfo)
    };
    // a9059cbb0000000000000000000000668a4cd95f49cd3eb6639a860d4cc7e94172571e7e0000000000000000000000000000000000000000000000000000000000000001
    console.log(params.data)

    if (abiInfo.stateMutability == 'view' || abiInfo.stateMutability == 'pure') {
      // functionHash = helper.encodeFunctionId(abiInfo)
      let paramAry = [address1, contractAddress, params.data, abiInfo.name, abiStr]
      console.log(paramAry)
      return chain.callreadonlyfunction(paramAry)
      // console.log(res,err)
    } else {
      params.from = address2;
      params.type = 'call';
      // console.log("call:", params)
      return erc20.doCallContract(params, wallet, 0.02, 0, 0, '111111')
      // console.log("call result:", res)
    }
  }

  static async doCallContract(params, wallet, amount, assetId, from, password) {
    assetId = CONSTANT.DEFAULT_ASSET
    from = await wallet.getAddress()

    // console.log("from:",from)

    let {
      ins,
      changeOut
    } = await TranService.chooseUTXO(
      wallet.walletId,
      amount,
      assetId,
      from
    );

    // console.log("ins:",ins,changeOut)

    let outs = [{
      amount: btc2sts(parseFloat(amount)),
      assets: assetId,
      address: params.to,
      data: params.data || "",
      contractType: params.type || ""
    }];

    // console.log("outs:",outs)

    if (changeOut&changeOut.length) {
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

      console.log("Raw TX:",rawtx)
      if (!rawtx) {
        console.log("Raw TX Error")
        return;
      }

      // let decoded = await TranService.decodeRawTx(rawtx)
      // console.log(decoded)

      console.log("success:");
      return chain.sendrawtransaction([rawtx]);
    } catch (e) {
      console.log("TX Error", e)
    }
  }
}