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
        this.abiStr = '[{"constant":false,"inputs":[{"name":"record","type":"uint256"}],"name":"safe","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newLiquidator","type":"address"}],"name":"setLiquidator","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"closeCDPToleranceTime","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint8"}],"name":"term","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"terminate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newCeiling","type":"uint256"}],"name":"updateDebtCeiling","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"era","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint8"}],"name":"cutDown","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"liquidationRatio","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"issuer","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"readyForPhaseTwo","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"liquidationPenalty","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"inSettlement","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"priceOracle","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getTemplateInfo","outputs":[{"name":"","type":"uint16"},{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"record","type":"uint256"}],"name":"repay","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"CDPIndex","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"updateRates","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint8"}],"name":"adjustedInterestRate","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"liquidator","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"record","type":"uint256"}],"name":"liquidate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalCollateral","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalPrincipal","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"updateAndFetchRates","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newPriceOracle","type":"address"}],"name":"setPriceOracle","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newPenalty","type":"uint256"}],"name":"updateLiquidationPenalty","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"createRatioTolerance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"assetType","type":"uint256"}],"name":"setAssetPAI","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"overdueBufferPeriod","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newRate","type":"uint256"}],"name":"updateBaseInterestRate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_newRatio","type":"uint256"},{"name":"_newTolerance","type":"uint256"}],"name":"updateCreateCollateralRatio","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newIssuer","type":"address"}],"name":"setPAIIssuer","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"record","type":"uint256"},{"name":"newOwner","type":"address"},{"name":"_price","type":"uint256"}],"name":"transferCDPOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"baseInterestRate","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newRatio","type":"uint256"}],"name":"updateLiquidationRatio","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"record","type":"uint256"}],"name":"debtOfCDP","outputs":[{"name":"","type":"uint256"},{"name":"","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"record","type":"uint256"}],"name":"deposit","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"_category","type":"uint16"},{"name":"_templateName","type":"string"}],"name":"initTemplate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_num","type":"uint256"}],"name":"quickLiquidate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"createCollateralRatio","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"record","type":"uint256"}],"name":"buyCDP","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"amount","type":"uint256"},{"name":"_type","type":"uint8"}],"name":"createDepositBorrow","outputs":[{"name":"","type":"uint256"}],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"CDPRecords","outputs":[{"name":"cdpType","type":"uint8"},{"name":"owner","type":"address"},{"name":"collateral","type":"uint256"},{"name":"principal","type":"uint256"},{"name":"accumulatedDebt","type":"uint256"},{"name":"endTime","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"assetType","type":"uint256"}],"name":"setAssetCollateral","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"debtCeiling","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_type","type":"uint8"},{"name":"_newCutDown","type":"uint256"}],"name":"updateCutDown","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getCollateralPrice","outputs":[{"name":"wad","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"_issuer","type":"address"},{"name":"_oracle","type":"address"},{"name":"_liquidator","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor","name":"CDP"},{"anonymous":false,"inputs":[{"indexed":false,"name":"paramType","type":"uint256"},{"indexed":false,"name":"param","type":"uint256"}],"name":"SetParam","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_type","type":"uint8"},{"indexed":false,"name":"_newCutDown","type":"uint256"}],"name":"SetCutDown","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"CDPid","type":"uint256"},{"indexed":false,"name":"newOwner","type":"address"},{"indexed":false,"name":"price","type":"uint256"}],"name":"PostCDP","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"CDPid","type":"uint256"},{"indexed":false,"name":"newOwner","type":"address"},{"indexed":false,"name":"price","type":"uint256"}],"name":"BuyCDP","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_index","type":"uint256"},{"indexed":false,"name":"_type","type":"uint8"}],"name":"CreateCDP","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"collateral","type":"uint256"},{"indexed":false,"name":"principal","type":"uint256"},{"indexed":false,"name":"debt","type":"uint256"},{"indexed":false,"name":"_index","type":"uint256"},{"indexed":false,"name":"depositAmount","type":"uint256"}],"name":"DepositCollateral","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"collateral","type":"uint256"},{"indexed":false,"name":"principal","type":"uint256"},{"indexed":false,"name":"debt","type":"uint256"},{"indexed":false,"name":"_index","type":"uint256"},{"indexed":false,"name":"borrowAmount","type":"uint256"}],"name":"BorrowPAI","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"collateral","type":"uint256"},{"indexed":false,"name":"principal","type":"uint256"},{"indexed":false,"name":"debt","type":"uint256"},{"indexed":false,"name":"_index","type":"uint256"},{"indexed":false,"name":"repayAmount","type":"uint256"},{"indexed":false,"name":"repayAmount1","type":"uint256"},{"indexed":false,"name":"repayAmount2","type":"uint256"}],"name":"RepayPAI","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_index","type":"uint256"}],"name":"CloseCDP","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_index","type":"uint256"},{"indexed":false,"name":"principalOfCollateral","type":"uint256"},{"indexed":false,"name":"interestOfCollateral","type":"uint256"},{"indexed":false,"name":"penaltyOfCollateral","type":"uint256"},{"indexed":false,"name":"collateralLeft","type":"uint256"}],"name":"Liquidate","type":"event"},{"anonymous":true,"inputs":[{"indexed":true,"name":"sig","type":"bytes4"},{"indexed":true,"name":"guy","type":"address"},{"indexed":true,"name":"foo","type":"bytes32"},{"indexed":true,"name":"bar","type":"bytes32"},{"indexed":false,"name":"wad","type":"uint256"},{"indexed":false,"name":"fax","type":"bytes"}],"name":"LogNote","type":"event"}]';
        this.fee = 0.1;
        this.gasLimit = 30000000;
        this.address = address;
    }
    unlock(wallet, password) {
        this.wallet = wallet;
        this.password = password;
    }
    async callContract(abiInfo, asset_id, amount) {
        const params = {
            to: this.address,
            amount,
            assetId: asset_id,
            data: this.getHexData(abiInfo)
        };
        console.log('params.data', params);
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
        console.log('ins=====', ins);
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
    async createDepositBorrow(borrow_amount, borrow_type, deposit_assetID, deposit_amount) {
        const abiInfo = { 'constant': false,
            'inputs': [{ 'name': 'amount', 'type': 'uint256', 'value': borrow_amount },
                { 'name': '_type', 'type': 'uint8', 'value': borrow_type }],
            'name': 'createDepositBorrow',
            'outputs': [{ 'name': '', 'type': 'uint256' }],
            'payable': true,
            'stateMutability': 'payable',
            'type': 'function' };
        return this.callContract(abiInfo, deposit_assetID, deposit_amount);
    }
    async repay(borrow_id, repay_assetID, amount) {
        console.log('4444', borrow_id, repay_assetID, amount);
        const abiInfo = { 'constant': false,
            'inputs': [{ 'name': 'record', 'type': 'uint256', 'value': borrow_id }],
            'name': 'repay',
            'outputs': [],
            'payable': true,
            'stateMutability': 'payable',
            'type': 'function' };
        return this.callContract(abiInfo, repay_assetID, amount);
    }
    async deposit(borrow_id, deposit_assetID, amount) {
        const abiInfo = { 'constant': false,
            'inputs': [{ 'name': 'record', 'type': 'uint256', 'value': borrow_id }],
            'name': 'deposit',
            'outputs': [],
            'payable': true,
            'stateMutability': 'payable',
            'type': 'function' };
        return this.callContract(abiInfo, deposit_assetID, amount);
    }
    async liquidate(borrow_id, deposit_assetID) {
        const abiInfo = { 'constant': false,
            'inputs': [{ 'name': 'record', 'type': 'uint256', 'value': borrow_id }],
            'name': 'liquidate',
            'outputs': [],
            'payable': false,
            'stateMutability': 'nonpayable',
            'type': 'function' };
        return this.callContract(abiInfo, deposit_assetID, 0);
    }
    async debtOfCDP() {
        const abiInfo = { 'constant': false,
            'inputs': [{ 'name': 'record', 'type': 'uint256', 'value': 4 }],
            'name': 'debtOfCDP',
            'outputs': [{ 'name': '', 'type': 'uint256' },
                { 'name': '', 'type': 'uint256' }],
            'payable': false,
            'stateMutability': 'nonpayable',
            'type': 'function' };
        return this.callContract(abiInfo);
    }
}
exports.default = Token;
//# sourceMappingURL=cdp.js.map