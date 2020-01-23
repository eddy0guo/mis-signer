"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const txHelper_1 = require("../lib/txHelper");
const chain_1 = require("../api/chain");
const transaction_1 = require("../service/transaction");
const constant_1 = require("../constant");
const utils_1 = require("../utils");
class Organization {
    constructor(address) {
        this.abiStr = '[{"constant":true,"inputs":[{"name":"_address","type":"address"}],"name":"getAddressRolesMap","outputs":[{"name":"","type":"bytes32[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"name","type":"string"},{"name":"symbol","type":"string"},{"name":"desc","type":"string"}],"name":"issueNewAsset","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getTemplateInfo","outputs":[{"name":"","type":"uint16"},{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_role","type":"string"},{"name":"_opMode","type":"uint8"}],"name":"configureFunctionRoleSuper","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"assetIndex","type":"uint32"}],"name":"getAssetInfo","outputs":[{"name":"","type":"bool"},{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"uint32"},{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_address","type":"address"},{"name":"_opMode","type":"uint8"}],"name":"configureFunctionAddressAdvanced","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_address","type":"address"},{"name":"_opMode","type":"uint8"}],"name":"configureFunctionAddressSuper","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_function","type":"string"},{"name":"_role","type":"string"},{"name":"_opMode","type":"uint8"}],"name":"configureFunctionRole","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_address","type":"address"},{"name":"_role","type":"string"},{"name":"_opMode","type":"uint8"}],"name":"configureAddressRole","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"assetIndex","type":"uint32"},{"name":"transferAddress","type":"address"}],"name":"canTransferAsset","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"registerMe","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_caller","type":"address"},{"name":"_functionStr","type":"string"}],"name":"canPerform","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_category","type":"uint16"},{"name":"_templateName","type":"string"}],"name":"initTemplate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_function","type":"string"},{"name":"_address","type":"address"},{"name":"_opMode","type":"uint8"}],"name":"configureFunctionAddress","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_role","type":"string"},{"name":"_opMode","type":"uint8"}],"name":"configureFunctionRoleAdvanced","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"FUNCTION_HASH_SAMPLE","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"index","type":"uint32"}],"name":"issueMoreAsset","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"assetIndex","type":"uint32"}],"name":"getCreateAndMintHistory","outputs":[{"name":"","type":"bool"},{"name":"","type":"string"},{"name":"","type":"uint256[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"asset","type":"uint256"},{"name":"amount","type":"uint256"}],"name":"transferAsset","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"ROLE_SAMPLE","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"organizationName","type":"string"},{"name":"_members","type":"address[]"}],"payable":false,"stateMutability":"nonpayable","type":"constructor","name":"SimpleOrganization"},{"anonymous":false,"inputs":[{"indexed":false,"name":"invitee","type":"address"}],"name":"invite","type":"event"}]';
        this.fee = 0.05;
        this.gasLimit = 10000000;
        this.address = address;
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
        const { ins, changeOut } = await transaction_1.TranService.chooseUTXO(wallet.walletId, params.amount, params.assetId, params.from, this.fee);
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
    async TemplateInfo(address) {
        console.log('gxy---address=', address);
        const abiInfo = { 'constant': true, 'inputs': [], 'name': 'getTemplateInfo', 'outputs': [{ 'name': '', 'type': 'uint16' }, { 'name': '', 'type': 'string' }], 'payable': false, 'stateMutability': 'view', 'type': 'function' };
        return this.callContract(abiInfo);
    }
    async issueMoreAsset(index) {
        const abiInfo = { 'constant': false, 'inputs': [{ 'name': 'index', 'type': 'uint32', 'value': 200000005 }], 'name': 'issueMoreAsset', 'outputs': [], 'payable': false, 'stateMutability': 'nonpayable', 'type': 'function' };
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
exports.default = Organization;
//# sourceMappingURL=Organization.js.map