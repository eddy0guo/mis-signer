"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const txHelper_1 = require("../lib/txHelper");
const chain_1 = require("../api/chain");
const transaction_1 = require("../service/transaction");
const constant_1 = require("../constant");
const utils_1 = require("../utils");
class Contract {
    constructor(address, abiStr = '') {
        this.fee = 0.05;
        this.gasLimit = 10000000;
        this.address = address;
        this.adiStr = abiStr;
    }
    unlock(wallet, password) {
        this.wallet = wallet;
        this.password = password;
    }
    async callContract(abiInfo) {
        const params = {
            to: this.address,
            amount: 0,
            assetId: constant_1.CONSTANT.DEFAULT_ASSET,
            data: this.getHexData(abiInfo)
        };
        console.log('params.data:', params.data);
        if (abiInfo.stateMutability == 'view' || abiInfo.stateMutability == 'pure') {
            return chain_1.chain.callreadonlyfunction([this.address, this.address, params.data, abiInfo.name, this.abiStr]);
        }
        else {
            params.from = await this.wallet.getAddress();
            params.type = constant_1.CONSTANT.CONTRACT_TYPE.CALL;
            return this.executeContract(params);
        }
    }
    async executeContract(params) {
        const wallet = this.wallet;
        const password = this.password;
        const assetObjArr = [];
        assetObjArr.push({
            amount: params.amount,
            asset: params.assetId
        });
        assetObjArr.push({
            amount: 0.02,
            asset: '000000000000000000000000'
        });
        const { ins, changeOut } = await transaction_1.TranService.chooseUTXO(wallet.walletId, assetObjArr, params.from);
        let outs = [{
                amount: utils_1.btc2sts(parseFloat(params.amount)),
                assets: params.assetId,
                address: params.to,
                data: params.data || '',
                contractType: params.type || ''
            }];
        if (changeOut && changeOut.length) {
            outs = outs.concat(changeOut);
        }
        const keys = await wallet.getPrivateKeys(constant_1.CONSTANT.DEFAULT_COIN.coinType, ins, password);
        try {
            const rawtx = transaction_1.TranService.generateRawTx(ins, outs, keys, this.gasLimit);
            console.log('RAWTX:', rawtx);
            if (!rawtx) {
                console.log('executeContract Raw TX Error');
                return;
            }
            console.log('executeContract Success:', params, ins, outs);
            return chain_1.chain.sendrawtransaction([rawtx]);
        }
        catch (e) {
            console.log('executeContract TX Error', e);
        }
    }
    getHexData(abiInfo) {
        if (!abiInfo)
            return;
        if (!abiInfo.inputs)
            return;
        const funcArgs = [];
        abiInfo.inputs.forEach(i => {
            if (utils_1.isArrayType(i.type)) {
                const arr = JSON.parse(i.value);
                const type = i.type.replace('[]', '');
                const result = [];
                arr.forEach(a => {
                    result.push(utils_1.callParamsConvert(type, a));
                });
                funcArgs.push(result);
            }
            else {
                funcArgs.push(utils_1.callParamsConvert(i.type, i.value));
            }
        });
        let functionHash, paramsHash = '';
        try {
            functionHash = txHelper_1.default.encodeFunctionId(abiInfo);
        }
        catch (e) {
            console.log('getHexData encodeFunctionId Error:', e, abiInfo);
            return;
        }
        try {
            paramsHash = txHelper_1.default.encodeParams(abiInfo, funcArgs).toString('hex');
        }
        catch (e) {
            console.log('getHexData encodeParams Error', e, abiInfo, funcArgs);
            return;
        }
        const data = functionHash.replace('0x', '') + paramsHash.replace('0x', '');
        return data;
    }
}
exports.default = Contract;
//# sourceMappingURL=Contract.js.map