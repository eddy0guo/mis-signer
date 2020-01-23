import helper from '../lib/txHelper'
import { chain } from '../api/chain'
import { TranService } from "../service/transaction";
import { CONSTANT } from "../constant";
import { btc2sts, isArrayType, callParamsConvert } from "../utils";

export default class Token {


    constructor(address) {
        this.abiStr = '[{"constant":true,"inputs":[],"name":"getTemplateInfo","outputs":[{"name":"","type":"uint16"},{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"index","type":"uint32"}],"name":"getAssetInfo","outputs":[{"name":"","type":"bool"},{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"uint32"},{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"burn","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"getAssetType","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"amount","type":"uint256"},{"name":"dest","type":"address"}],"name":"mint","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_category","type":"uint16"},{"name":"_templateName","type":"string"}],"name":"initTemplate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_name","type":"string"}],"name":"init","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"}]';
        this.fee = 0.05
        this.gasLimit = 10000000
        this.address = address;
    }

    /**
     * unlock once
     * @param {*} wallet 
     * @param {*} password 
     */
    unlock(wallet, password) {
        this.wallet = wallet
        this.password = password
    }
    /**
     * Call Contract Function with abi Info
     * 除了充值合约，主币的amount应该都是0，扣fee会自动计算。
     * 
     * @param {*} abiInfo 
     * @param {*} wallet 
     */
    async callContract(abiInfo) {
        console.log("callContracti111111:");
        let params = {
            to: this.address,
            amount: 0,
            assetId: CONSTANT.DEFAULT_ASSET,
            data: this.getHexData(abiInfo)
        };

        console.log("params.data:", params.data)

        if (abiInfo.stateMutability == 'view' || abiInfo.stateMutability == 'pure') {
            console.log("callContractig2222:");
            return chain.callreadonlyfunction([this.address, this.address, params.data, abiInfo.name, this.abiStr])
        } else {
            console.log("callContractigxyyyy:");
            params.from = await this.wallet.getAddress()
            params.type = CONSTANT.CONTRACT_TYPE.CALL
            return this.executeContract(params)
        }
    }

    /**
     * Execute Contract Function，Wallet需要在执行Contract前更新UTXO，确保缓存正确可以执行成功
     * await wallet.queryAllBalance()
     * 
     * @param {*} params 
     */
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

        console.log("executeContract Raw TX 1111")
        try {
            let rawtx = TranService.generateRawTx(ins, outs, keys, this.gasLimit);

            console.log("RAWTX:", rawtx)

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

    /**
     * return balance of address
     * @param {*} address 
     */
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
    //{"constant":true,"inputs":[{"name":"index","type":"uint32"}],"name":"getAssetInfo","outputs":[{"name":"","type":"bool"},{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"uint32"},{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}
    async getAssetInfo() {
        let abiInfo =
        {
            "constant": true,
            "inputs": [{ "name": "index", "type": "uint32", "value": 1 }],
            "name": "getAssetInfo",
            "outputs": [{ "name": "", "type": "bool" }, { "name": "", "type": "string" }, { "name": "", "type": "string" }, { "name": "", "type": "string" }, { "name": "", "type": "uint32" }, { "name": "", "type": "uint256" }],
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
                let arr = i.value;
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

        console.log("gxy---gethexdata=", data);
        return data;
    }


}
