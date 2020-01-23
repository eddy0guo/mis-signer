"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const txHelper_1 = require("../lib/txHelper");
const chain_1 = require("../api/chain");
const cfg_1 = require("../../cfg");
const transaction_1 = require("../service/transaction");
const constant_1 = require("../constant");
const utils_1 = require("../utils");
const bitcore_lib_1 = require('bitcore-lib');
const utils_2 = require("../../adex/api/utils");
const ECDSA = bitcore_lib_1.crypto.ECDSA;
const util = require('ethereumjs-util');
const bip39 = require('bip39');
const bip32 = require('bip32');
const bitcoin = require('bitcoinjs-lib');
const ethers = require('ethers');
const hdkey = require('ethereumjs-wallet/hdkey');
const asimov_wallet_1 = require("@fingo/asimov-wallet");
class Token {
    constructor(address) {
        this.abiStr = '[{"constant":true,"inputs":[{"components":[{"name":"adr","type":"address"},{"name":"age","type":"uint256"},{"components":[{"name":"naem","type":"string"}],"name":"mg","type":"tuple"}],"name":"ab","type":"tuple"}],"name":"sdfs","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"components":[{"name":"taker","type":"address"},{"name":"maker","type":"address"},{"name":"baseToken","type":"address"},{"name":"quoteToken","type":"address"},{"name":"relayer","type":"address"},{"name":"baseTokenAmount","type":"uint256"},{"name":"quoteTokenAmount","type":"uint256"},{"name":"takerSide","type":"string"}],"name":"_order","type":"tuple"}],"name":"getorderhash","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"components":[{"name":"taker","type":"address"},{"name":"maker","type":"address"},{"name":"baseTokenAmount","type":"uint256"},{"name":"quoteTokenAmount","type":"uint256"},{"name":"takerSide","type":"string"},{"name":"r","type":"bytes32"},{"name":"s","type":"bytes32"},{"name":"v","type":"uint8"}],"name":"TradeParams","type":"tuple[]"},{"components":[{"name":"baseToken","type":"address"},{"name":"quoteToken","type":"address"},{"name":"relayer","type":"address"}],"name":"orderAddressSet","type":"tuple"}],"name":"matchOrder","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getTemplateInfo","outputs":[{"name":"","type":"uint16"},{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"components":[{"name":"taker","type":"address"},{"name":"maker","type":"address"},{"name":"baseToken","type":"address"},{"name":"quoteToken","type":"address"},{"name":"relayer","type":"address"},{"name":"baseTokenAmount","type":"uint256"},{"name":"quoteTokenAmount","type":"uint256"},{"name":"takerSide","type":"string"}],"name":"_order","type":"tuple"}],"name":"hashordermsg","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_hashmsg","type":"bytes32"}],"name":"hashmsg","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"EIP712_ORDERTYPE","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_category","type":"uint16"},{"name":"_templateName","type":"string"}],"name":"initTemplate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_hash","type":"bytes32"},{"components":[{"name":"taker","type":"address"},{"name":"maker","type":"address"},{"name":"baseTokenAmount","type":"uint256"},{"name":"quoteTokenAmount","type":"uint256"},{"name":"takerSide","type":"string"},{"name":"r","type":"bytes32"},{"name":"s","type":"bytes32"},{"name":"v","type":"uint8"}],"name":"_trade","type":"tuple"},{"components":[{"name":"baseToken","type":"address"},{"name":"quoteToken","type":"address"},{"name":"relayer","type":"address"}],"name":"_order","type":"tuple"}],"name":"isValidSignature","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor","name":"MistExchange"},{"anonymous":false,"inputs":[{"indexed":false,"name":"ads","type":"address"}],"name":"isValid","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"bs","type":"bytes32"}],"name":"orderhashmsg","type":"event"}]';
        this.fee = 10000000;
        this.gasLimit = 100000000;
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
            amount: 20000000,
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
    async batch() {
        return this.callContract(abiInfo);
    }
    async orderhash(trade) {
        console.log('11111111114444444444--', trade);
        const abiInfo = { 'constant': false,
            'inputs': [{ 'components': [{ 'name': 'taker', 'type': 'address' },
                        { 'name': 'maker', 'type': 'address' },
                        { 'name': 'baseToken', 'type': 'address' },
                        { 'name': 'quoteToken', 'type': 'address' },
                        { 'name': 'relayer', 'type': 'address' },
                        { 'name': 'baseTokenAmount', 'type': 'uint256' },
                        { 'name': 'quoteTokenAmount', 'type': 'uint256' },
                        { 'name': 'takerSide', 'type': 'string' }],
                    'name': '_order', 'type': 'tuple[]', 'value': trade }],
            'name': 'hashordermsgbatch',
            'outputs': [{ 'name': '', 'type': 'bytes32[]' }],
            'payable': false,
            'stateMutability': 'nonpayable',
            'type': 'function' };
        return this.callContract(abiInfo);
    }
    async matchorder(trades_info, prikey, word) {
        const utils = new utils_2.default();
        const trades_arr = [];
        for (const index in trades_info) {
            const hashbuf = Buffer.alloc(32, trades_info[index].trade_hash.slice(2, 66), 'hex');
            const sign = util.ecsign(hashbuf, util.toBuffer(prikey));
            trades_info[index].v = sign.v.toString();
            trades_info[index].r = '0x' + sign.r.toString('hex');
            trades_info[index].s = '0x' + sign.s.toString('hex');
            delete trades_info[index].trade_hash;
            const trade_arr = utils.arr_values(trades_info[index]);
            trades_arr.push(trade_arr);
        }
        const abiInfo = { 'constant': false,
            'inputs': [{ 'components': [{ 'name': 'taker', 'type': 'address' },
                        { 'name': 'maker', 'type': 'address' },
                        { 'name': 'baseToken', 'type': 'address' },
                        { 'name': 'quoteToken', 'type': 'address' },
                        { 'name': 'relayer', 'type': 'address' },
                        { 'name': 'baseTokenAmount', 'type': 'uint256' },
                        { 'name': 'quoteTokenAmount', 'type': 'uint256' },
                        { 'name': 'r', 'type': 'bytes32' },
                        { 'name': 's', 'type': 'bytes32' },
                        { 'name': 'takerSide', 'type': 'string' },
                        { 'name': 'v', 'type': 'uint8' }],
                    'name': '_trader',
                    'type': 'tuple[]', 'value': trades_arr }],
            'name': 'matchorder',
            'outputs': [{ 'name': '', 'type': 'bool' }],
            'payable': false,
            'stateMutability': 'nonpayable',
            'type': 'function' };
        console.log('matchorder----%o\n', trades_arr);
        const child_wallet = new asimov_wallet_1.AsimovWallet({
            name: prikey,
            rpc: cfg_1.default.asimov_child_rpc,
            mnemonic: word,
        });
        return await child_wallet.contractCall.call(cfg_1.default.ex_address, 'matchorder(tuple[])', [trades_arr], 1000000 * 40, 0, asimov_wallet_1.AsimovConst.DEFAULT_ASSET_ID, asimov_wallet_1.AsimovConst.DEFAULT_FEE_AMOUNT * 100, asimov_wallet_1.AsimovConst.DEFAULT_ASSET_ID, asimov_wallet_1.AsimovConst.CONTRACT_TYPE.CALL);
    }
}
exports.default = Token;
//# sourceMappingURL=mist_ex10.js.map