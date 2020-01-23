"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const txHelper_1 = require("./txHelper");
const chain_1 = require("../api/chain");
const transaction_1 = require("../service/transaction");
const constant_1 = require("../constant");
const utils_1 = require("../utils");
const abiStr = '[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"amount","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getTemplateInfo","outputs":[{"name":"","type":"uint16"},{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address","value":"0x66b31cab7d9eb10cfcdb7a3c19dcd45f362e15ba8e"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_category","type":"uint16"},{"name":"_templateName","type":"string"}],"name":"initTemplate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]';
const contractAddress = '0x633c6e19bdc52f8d76baaaa5adc963b09a11a8509c';
const addr1 = '0x6699fe56a98aa190bdd63239e82d03ae0dba8ad1a1';
const addr2 = '0x661743c23467045cde4b199a29568dabdb9733a739';
const addr0 = '0x6619fd2d2fd1db189c075ff25800f7b98ff3205e5a';
const word0 = 'benefit park visit oxygen supply oil pupil snack pipe decade young bracket';
class erc20 {
    static async testBalanceOf(wallet) {
        const abiInfo = {
            'constant': true,
            'inputs': [{
                    'name': 'owner',
                    'type': 'address',
                    'value': addr0
                }],
            'name': 'balanceOf',
            'outputs': [{
                    'name': 'balance',
                    'type': 'uint256'
                }],
            'payable': false,
            'stateMutability': 'view',
            'type': 'function'
        };
        return erc20.callContract(abiInfo, wallet);
    }
    static async testTransfer(wallet) {
        const abiInfo = {
            'constant': false,
            'inputs': [{
                    'name': 'to',
                    'type': 'address',
                    'value': addr2
                }, {
                    'name': 'amount',
                    'type': 'uint256',
                    'value': '1'
                }],
            'name': 'transfer',
            'outputs': [{
                    'name': '',
                    'type': 'bool'
                }],
            'payable': false,
            'stateMutability': 'nonpayable',
            'type': 'function'
        };
        return erc20.callContract(abiInfo, wallet);
    }
    static async callContract(abiInfo, wallet) {
        const params = {
            to: contractAddress,
            amount: 0,
            assetId: constant_1.CONSTANT.DEFAULT_ASSET,
            data: erc20.genData(abiInfo)
        };
        console.log(params.data);
        if (abiInfo.stateMutability == 'view' || abiInfo.stateMutability == 'pure') {
            const paramAry = [addr1, contractAddress, params.data, abiInfo.name, abiStr];
            return chain_1.chain.callreadonlyfunction(paramAry);
        }
        else {
            params.from = addr0;
            params.type = constant_1.CONSTANT.CONTRACT_TYPE.CALL;
            return erc20.executeContract(params, wallet, '111111');
        }
    }
    static async executeContract(params, wallet, password) {
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
        console.log(ins, changeOut);
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
            const rawtx = transaction_1.TranService.generateRawTx(ins, outs, keys);
            console.log('Raw TX:', rawtx);
            if (!rawtx) {
                console.log('Raw TX Error');
                return;
            }
            console.log('Success:', params, ins, outs);
            return chain_1.chain.sendrawtransaction([rawtx]);
        }
        catch (e) {
            console.log('TX Error', e);
        }
    }
    static genData(abiInfo) {
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
            console.log('encodeFunctionId:', e, abiInfo);
            return;
        }
        try {
            paramsHash = txHelper_1.default.encodeParams(abiInfo, funcArgs).toString('hex');
        }
        catch (e) {
            console.log('encodeParams', e, abiInfo, funcArgs);
            return;
        }
        const data = functionHash.replace('0x', '') + paramsHash.replace('0x', '');
        console.log(functionHash, paramsHash);
        return data;
    }
}
exports.default = erc20;
//# sourceMappingURL=erc20.js.map