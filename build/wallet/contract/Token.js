"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const txHelper_1 = require("../lib/txHelper");
const chain_1 = require("../api/chain");
const transaction_1 = require("../service/transaction");
const constant_1 = require("../constant");
const utils_1 = require("../utils");
class Token {
    constructor(address) {
        this.abiStr = '[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"amount","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getTemplateInfo","outputs":[{"name":"","type":"uint16"},{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address","value":"0x66b31cab7d9eb10cfcdb7a3c19dcd45f362e15ba8e"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_category","type":"uint16"},{"name":"_templateName","type":"string"}],"name":"initTemplate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]';
        this.fee = 0.05;
        this.gasLimit = 10000000;
        this.address = address;
    }
    unlock(wallet, password) {
        this.wallet = wallet;
        this.password = password;
    }
    async callContract(abiInfo, network_flag) {
        console.log('callContracti111111:');
        const params = {
            to: this.address,
            amount: 0,
            assetId: constant_1.CONSTANT.DEFAULT_ASSET,
            data: this.getHexData(abiInfo),
        };
        console.log('params.data:', params.data);
        if (abiInfo.stateMutability == 'view' || abiInfo.stateMutability == 'pure') {
            console.log('callContractig2222:');
            return chain_1.chain.callreadonlyfunction([this.address, this.address, params.data, abiInfo.name, this.abiStr], network_flag);
        }
        else {
            console.log('callContractigxyyyy:');
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
            asset: params.assetId,
        });
        assetObjArr.push({
            amount: 0.02,
            asset: '000000000000000000000000',
        });
        const { ins, changeOut } = await transaction_1.TranService.chooseUTXO(wallet.walletId, assetObjArr, params.from);
        let outs = [{
                amount: utils_1.btc2sts(parseFloat(params.amount)),
                assets: params.assetId,
                address: params.to,
                data: params.data || '',
                contractType: params.type || '',
            }];
        if (changeOut && changeOut.length) {
            outs = outs.concat(changeOut);
        }
        const keys = await wallet.getPrivateKeys(constant_1.CONSTANT.DEFAULT_COIN.coinType, ins, password);
        console.log('executeContract Raw TX 1111');
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
    async balanceOf(address, network_flag = 'master_poa') {
        const abiInfo = {
            constant: true,
            inputs: [{
                    name: 'owner',
                    type: 'address',
                    value: address,
                }],
            name: 'balanceOf',
            outputs: [{
                    name: 'balance',
                    type: 'uint256',
                }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
        };
        return this.callContract(abiInfo, network_flag);
    }
    async allowance(owner, spender) {
        const abiInfo = {
            constant: true,
            inputs: [
                {
                    name: 'owner',
                    type: 'address',
                    value: owner,
                },
                {
                    name: 'spender',
                    type: 'address',
                    value: spender,
                },
            ],
            name: 'allowance',
            outputs: [
                {
                    name: '',
                    type: 'uint256',
                },
            ],
            payable: false,
            stateMutability: 'view',
            type: 'function',
        };
        return this.callContract(abiInfo);
    }
    async transfer(address, amount) {
        const abiInfo = {
            constant: false,
            inputs: [{
                    name: 'to',
                    type: 'address',
                    value: address,
                }, {
                    name: 'amount',
                    type: 'uint256',
                    value: amount,
                }],
            name: 'transfer',
            outputs: [{
                    name: '',
                    type: 'bool',
                }],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
        };
        return this.callContract(abiInfo);
    }
    async approve(spender, amount) {
        const abiInfo = {
            constant: false,
            inputs: [
                {
                    name: 'spender',
                    type: 'address',
                    value: spender,
                },
                {
                    name: 'amount',
                    type: 'uint256',
                    value: amount,
                },
            ],
            name: 'approve',
            outputs: [
                {
                    name: '',
                    type: 'bool',
                },
            ],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
        };
        return this.callContract(abiInfo);
    }
    async transferfrom(from, to, amount) {
        const abiInfo = { constant: false, inputs: [{ name: 'from', type: 'address', value: from }, { name: 'to', type: 'address', value: to }, { name: 'amount', type: 'uint256', value: amount }], name: 'transferFrom', outputs: [{ name: '', type: 'bool' }], payable: false, stateMutability: 'nonpayable', type: 'function' };
        return this.callContract(abiInfo);
    }
    async dex_match_order(trades) {
        const relayer = '0x66edd03c06441f8c2da19b90fcc42506dfa83226d3';
        const token_address = '0x631f62ca646771cd0c78e80e4eaf1d2ddf8fe414bf';
        console.log('dex_match_order-----inner:', trades);
        const abiInfo = { constant: false, inputs: [{ components: [{ name: 'taker', type: 'address' }, { name: 'maker', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'TradeParams', type: 'tuple[]', value: trades }, { components: [{ name: 'quoteToken', type: 'address' }, { name: 'relayer', type: 'address' }], name: 'orderAddressSet', type: 'tuple', value: [token_address, relayer] }], name: 'matchOrder', outputs: [], payable: false, stateMutability: 'nonpayable', type: 'function' };
        return this.callContract(abiInfo);
    }
    getHexData(abiInfo) {
        if (!abiInfo)
            return;
        if (!abiInfo.inputs)
            return;
        const funcArgs = [];
        abiInfo.inputs.forEach(i => {
            if (utils_1.isArrayType(i.type)) {
                const arr = i.value;
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
        console.log('gxy---gethexdata=', data);
        return data;
    }
}
exports.default = Token;
//# sourceMappingURL=Token.js.map