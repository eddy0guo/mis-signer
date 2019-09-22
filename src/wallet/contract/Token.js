import helper from '../lib/txHelper'
import { chain } from '../api/chain'
import { TranService } from "../service/transaction";
import { CONSTANT } from "../constant";
import {btc2sts,isArrayType,callParamsConvert} from "../utils";

export default class Token {
    abiStr = '[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"amount","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getTemplateInfo","outputs":[{"name":"","type":"uint16"},{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address","value":"0x66b31cab7d9eb10cfcdb7a3c19dcd45f362e15ba8e"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_category","type":"uint16"},{"name":"_templateName","type":"string"}],"name":"initTemplate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]';
    fee = 0.05

    constructor(address) {
        this.address = address;
    }
    /**
     * Call Contract Function with abi Info
     * 除了充值合约，主币的amount应该都是0，扣fee会自动计算。
     * 
     * @param {*} abiInfo 
     * @param {*} wallet 
     */
    async callContract(abiInfo,wallet=null,password="") {
        let params = {
            to: this.address,
            amount: 0,
            assetId: CONSTANT.DEFAULT_ASSET,
            data: this.getHexData(abiInfo)
        };
        
        if (abiInfo.stateMutability == 'view' || abiInfo.stateMutability == 'pure') {
            return chain.callreadonlyfunction([this.address, this.address, params.data, abiInfo.name, this.abiStr])
        } else {
            params.from = await wallet.getAddress()
            params.type = CONSTANT.CONTRACT_TYPE.CALL
            return this.executeContract(params, wallet, password)
        }
    }

    /**
     * Execute Contract Function，Wallet需要在执行Contract前更新UTXO，确保缓存正确可以执行成功
     * await wallet.queryAllBalance()
     * 
     * @param {*} params 
     * @param {*} wallet 
     * @param {*} password 
     */
    async executeContract(params, wallet, password) {

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

        try {
            let rawtx = TranService.generateRawTx(ins, outs, keys);

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


    async balanceOf(address) {
        let abiInfo = {
            "constant": true,
            "inputs": [{
              "name": "owner",
              "type": "address",
              "value": address
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
          return this.callContract(abiInfo);
    }

    /**
     * Generate ABI Hex Data
     * @param {*} abiInfo 
     */
    getHexData(abiInfo) {
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
            console.log("getHexData encodeFunctionId Error:", e, abiInfo);
            return;
        }

        try {
            paramsHash = helper.encodeParams(abiInfo, funcArgs).toString('hex');
        } catch (e) {
            console.log("getHexData encodeParams Error", e, abiInfo, funcArgs);
            return;
        }

        let data = functionHash.replace('0x', '') + paramsHash.replace('0x', '');
        return data;
    }


}