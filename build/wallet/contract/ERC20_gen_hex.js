"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const txHelper_1 = require("../lib/txHelper");
const chain_1 = require("../api/chain");
const transaction_1 = require("../service/transaction");
const constant_1 = require("../constant");
const utils_1 = require("../utils");
const bitcore_lib_1 = require('bitcore-lib');
const ECDSA = bitcore_lib_1.crypto.ECDSA;
class Token {
    constructor(address) {
        this.abiStr = '[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"guy","type":"address"},{"name":"wad","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"wad","type":"uint256"}],"name":"withdraw","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getTemplateInfo","outputs":[{"name":"","type":"uint16"},{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_category","type":"uint16"},{"name":"_templateName","type":"string"}],"name":"initTemplate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"deposit","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"_exchange","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor","name":"ASIM"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"src","type":"address"},{"indexed":true,"name":"guy","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"src","type":"address"},{"indexed":true,"name":"dst","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"dst","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Deposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"src","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Withdrawal","type":"event"}]';
        this.fee = 0.1;
        this.gasLimit = 30000000;
        this.address = address;
    }
    unlock(wallet, password) {
        this.wallet = wallet;
        this.password = password;
    }
    async callContract(assetID, abiInfo, value) {
        if (!value) {
            value = 0;
        }
        ;
        const params = {
            to: this.address,
            amount: value,
            assetId: assetID,
            data: this.getHexData(abiInfo)
        };
        console.log('params.data', params.data);
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
        console.log('privatekeuy===', keys);
        try {
            console.log('Input', ins);
            const rawtx = transaction_1.TranService.generateTxHex(ins, outs, keys, this.gasLimit);
            console.log('RAWTX:', rawtx);
            if (!rawtx) {
                console.log('executeContract Raw TX Error');
                return;
            }
            console.log('executeContract Success:', params, ins, outs);
            return rawtx;
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
                const arr = (i.value);
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
            console.log('functionHash', functionHash);
        }
        catch (e) {
            console.log('getHexData encodeFunctionId Error:', e, abiInfo);
            return;
        }
        try {
            console.log('funcArgs', funcArgs);
            paramsHash = txHelper_1.default.encodeParams(abiInfo, funcArgs).toString('hex');
        }
        catch (e) {
            console.log('getHexData encodeParams Error', e, abiInfo, funcArgs);
            return;
        }
        const data = functionHash.replace('0x', '') + paramsHash.replace('0x', '');
        return data;
    }
    async deposit(assetID, amount) {
        const abiInfo = { 'constant': false,
            'inputs': [],
            'name': 'deposit',
            'outputs': [],
            'payable': true,
            'stateMutability': 'payable',
            'type': 'function'
        };
        console.log('7777771111111', assetID, amount);
        return this.callContract(assetID, abiInfo, amount);
        ;
    }
    async withdraw(assetID, amount) {
        const abiInfo = { 'constant': false,
            'inputs': [{ 'name': 'wad', 'type': 'uint256', 'value': amount }],
            'name': 'withdraw',
            'outputs': [],
            'payable': false,
            'stateMutability': 'nonpayable',
            'type': 'function' };
        return this.callContract(assetID, abiInfo);
        ;
    }
}
exports.default = Token;
//# sourceMappingURL=ERC20_gen_hex.js.map