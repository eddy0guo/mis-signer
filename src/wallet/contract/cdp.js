import helper from '../lib/txHelper'
import { chain } from '../api/chain'
import { TranService } from "../service/transaction";
import { CONSTANT } from "../constant";
import { btc2sts, isArrayType, callParamsConvert,signature,getWalletPubKey} from "../utils";
const bitcore_lib_1 = require("bitcore-lib");
const ECDSA = bitcore_lib_1.crypto.ECDSA;

export default class Token {
abiStr='[{"constant":false,"inputs":[{"name":"record","type":"uint256"}],"name":"safe","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newLiquidator","type":"address"}],"name":"setLiquidator","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"closeCDPToleranceTime","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint8"}],"name":"term","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"terminate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newCeiling","type":"uint256"}],"name":"updateDebtCeiling","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"era","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint8"}],"name":"cutDown","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"liquidationRatio","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"issuer","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"readyForPhaseTwo","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"liquidationPenalty","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"inSettlement","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"priceOracle","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getTemplateInfo","outputs":[{"name":"","type":"uint16"},{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"record","type":"uint256"}],"name":"repay","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"CDPIndex","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"updateRates","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint8"}],"name":"adjustedInterestRate","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"liquidator","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"record","type":"uint256"}],"name":"liquidate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalCollateral","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalPrincipal","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"updateAndFetchRates","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newPriceOracle","type":"address"}],"name":"setPriceOracle","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newPenalty","type":"uint256"}],"name":"updateLiquidationPenalty","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"createRatioTolerance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"assetType","type":"uint256"}],"name":"setAssetPAI","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"overdueBufferPeriod","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newRate","type":"uint256"}],"name":"updateBaseInterestRate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_newRatio","type":"uint256"},{"name":"_newTolerance","type":"uint256"}],"name":"updateCreateCollateralRatio","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newIssuer","type":"address"}],"name":"setPAIIssuer","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"record","type":"uint256"},{"name":"newOwner","type":"address"},{"name":"_price","type":"uint256"}],"name":"transferCDPOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"baseInterestRate","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newRatio","type":"uint256"}],"name":"updateLiquidationRatio","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"record","type":"uint256"}],"name":"debtOfCDP","outputs":[{"name":"","type":"uint256"},{"name":"","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"record","type":"uint256"}],"name":"deposit","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"_category","type":"uint16"},{"name":"_templateName","type":"string"}],"name":"initTemplate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_num","type":"uint256"}],"name":"quickLiquidate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"createCollateralRatio","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"record","type":"uint256"}],"name":"buyCDP","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"amount","type":"uint256"},{"name":"_type","type":"uint8"}],"name":"createDepositBorrow","outputs":[{"name":"","type":"uint256"}],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"CDPRecords","outputs":[{"name":"cdpType","type":"uint8"},{"name":"owner","type":"address"},{"name":"collateral","type":"uint256"},{"name":"principal","type":"uint256"},{"name":"accumulatedDebt","type":"uint256"},{"name":"endTime","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"assetType","type":"uint256"}],"name":"setAssetCollateral","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"debtCeiling","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_type","type":"uint8"},{"name":"_newCutDown","type":"uint256"}],"name":"updateCutDown","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getCollateralPrice","outputs":[{"name":"wad","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"_issuer","type":"address"},{"name":"_oracle","type":"address"},{"name":"_liquidator","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor","name":"CDP"},{"anonymous":false,"inputs":[{"indexed":false,"name":"paramType","type":"uint256"},{"indexed":false,"name":"param","type":"uint256"}],"name":"SetParam","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_type","type":"uint8"},{"indexed":false,"name":"_newCutDown","type":"uint256"}],"name":"SetCutDown","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"CDPid","type":"uint256"},{"indexed":false,"name":"newOwner","type":"address"},{"indexed":false,"name":"price","type":"uint256"}],"name":"PostCDP","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"CDPid","type":"uint256"},{"indexed":false,"name":"newOwner","type":"address"},{"indexed":false,"name":"price","type":"uint256"}],"name":"BuyCDP","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_index","type":"uint256"},{"indexed":false,"name":"_type","type":"uint8"}],"name":"CreateCDP","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"collateral","type":"uint256"},{"indexed":false,"name":"principal","type":"uint256"},{"indexed":false,"name":"debt","type":"uint256"},{"indexed":false,"name":"_index","type":"uint256"},{"indexed":false,"name":"depositAmount","type":"uint256"}],"name":"DepositCollateral","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"collateral","type":"uint256"},{"indexed":false,"name":"principal","type":"uint256"},{"indexed":false,"name":"debt","type":"uint256"},{"indexed":false,"name":"_index","type":"uint256"},{"indexed":false,"name":"borrowAmount","type":"uint256"}],"name":"BorrowPAI","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"collateral","type":"uint256"},{"indexed":false,"name":"principal","type":"uint256"},{"indexed":false,"name":"debt","type":"uint256"},{"indexed":false,"name":"_index","type":"uint256"},{"indexed":false,"name":"repayAmount","type":"uint256"},{"indexed":false,"name":"repayAmount1","type":"uint256"},{"indexed":false,"name":"repayAmount2","type":"uint256"}],"name":"RepayPAI","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_index","type":"uint256"}],"name":"CloseCDP","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_index","type":"uint256"},{"indexed":false,"name":"principalOfCollateral","type":"uint256"},{"indexed":false,"name":"interestOfCollateral","type":"uint256"},{"indexed":false,"name":"penaltyOfCollateral","type":"uint256"},{"indexed":false,"name":"collateralLeft","type":"uint256"}],"name":"Liquidate","type":"event"},{"anonymous":true,"inputs":[{"indexed":true,"name":"sig","type":"bytes4"},{"indexed":true,"name":"guy","type":"address"},{"indexed":true,"name":"foo","type":"bytes32"},{"indexed":true,"name":"bar","type":"bytes32"},{"indexed":false,"name":"wad","type":"uint256"},{"indexed":false,"name":"fax","type":"bytes"}],"name":"LogNote","type":"event"}]'
fee = 0.1
 gasLimit = 30000000

 constructor(address) {
    this.address = address;
}

unlock(wallet, password) {
    this.wallet = wallet
    this.password = password
}
// 池逐妙招尺储带番陕剪滨津
async callContract(abiInfo,asset_id,amount) {
    let params = {
        to: this.address,
        amount: amount,
       // CONSTANT.DEFAULT_ASST
       //fbtc:300000001
       // pai:500000001
        assetId:asset_id,
        data: this.getHexData(abiInfo)
      };
      console.log('params.data',params)
    if (abiInfo.stateMutability == 'view' || abiInfo.stateMutability == 'pure') {
        return chain.callreadonlyfunction([this.address, this.address, params.data, abiInfo.name, this.abiStr])
    } else {
        params.from = await this.wallet.getAddress()
        params.type = CONSTANT.CONTRACT_TYPE.CALL
        return this.executeContract(params)
    }
}

async executeContract(params) {
    let wallet = this.wallet;
    let password = this.password;

    let { ins, changeOut } = await TranService.chooseUTXO(
        wallet.walletId,
        params.amount,
        params.assetId,
        params.from,
        this.fee
    );
    console.log('ins=====',ins)
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
    console.log("privatekeuy===",keys)

    try {
        console.log("Input",ins)
        let rawtx = TranService.generateRawTx(ins, outs, keys, this.gasLimit);

        console.log("RAWTX:",rawtx)

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


getHexData(abiInfo) {
    if (!abiInfo) return
    if (!abiInfo.inputs) return

    let funcArgs = []
    abiInfo.inputs.forEach(i => {
        if (isArrayType(i.type)) {
            let arr = (i.value);
            let type =  i.type.replace('[]', '');
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
        console.log('functionHash',functionHash)
    } catch (e) {
        console.log("getHexData encodeFunctionId Error:", e, abiInfo);
        return;
    }

    try {
         console.log("funcArgs",funcArgs)
        paramsHash = helper.encodeParams(abiInfo, funcArgs).toString('hex');
    } catch (e) {
        console.log("getHexData encodeParams Error", e, abiInfo, funcArgs);
        return;
    }

    let data = functionHash.replace('0x', '') + paramsHash.replace('0x', '');
    return data;
}

//充btc 借pai
async createDepositBorrow(borrow_amount,borrow_type,deposit_assetID,deposit_amount){
    let abiInfo=
        {"constant":false,
        "inputs":
        [{"name":"amount","type":"uint256","value":borrow_amount},
        {"name":"_type","type":"uint8","value":borrow_type}],
        "name":"createDepositBorrow",
        "outputs":[{"name":"","type":"uint256"}],
        "payable":true,
        "stateMutability":"payable",
        "type":"function"}

    return this.callContract(abiInfo,deposit_assetID,deposit_amount);
}

//还pai
async repay(borrow_id,repay_assetID,amount){
	console.log("4444",borrow_id,repay_assetID,amount)
    let abiInfo=
    {"constant":false,
    "inputs":
    [{"name":"record","type":"uint256","value":borrow_id}],
    "name":"repay",
    "outputs":[],
    "payable":true,
    "stateMutability":"payable",
    "type":"function"}
    return this.callContract(abiInfo,repay_assetID,amount)
}

//加仓
 async deposit(borrow_id,deposit_assetID,amount){
     let abiInfo=
     {"constant":false,
     "inputs":[{"name":"record","type":"uint256","value":borrow_id}],
     "name":"deposit",
     "outputs":[],
     "payable":true,
     "stateMutability":"payable",
     "type":"function"}
    return  this.callContract(abiInfo,deposit_assetID,amount)
 }

//平仓
 async liquidate(borrow_id,deposit_assetID){
     let abiInfo=
    {"constant":false,
    "inputs":[{"name":"record","type":"uint256","value":borrow_id}],
    "name":"liquidate",
    "outputs":[],
    "payable":false,
    "stateMutability":"nonpayable",
    "type":"function"}
    return this.callContract(abiInfo,deposit_assetID,0)
 }


async debtOfCDP(){
    let abiInfo=
    {"constant":false,
    "inputs":
    [{"name":"record","type":"uint256","value":4}],
    "name":"debtOfCDP",
    "outputs":[{"name":"","type":"uint256"},
    {"name":"","type":"uint256"}],
    "payable":false,
    "stateMutability":"nonpayable",
    "type":"function"}
    return this.callContract(abiInfo)
}
}
// 1.部署pai_issure.sol合约
// 2.调用pai_issure.sol合约的init 方法初始化pai代币
// 3.部署price_oracle合约
// 4 与pai合约相同的部署方式部署fbtc合约
// 5.调用priace_oracle合约的updatePrice方法，传入fbtc 的 asset id 和price
// 6.部署liquidator合约
// 7.调用liquidator合约中setAssetBTC 方法，传入fbtc 合约的assetid
// 8.部署cdp合约
// 9.调用cdp合约中setAssetCollateral 方法，传入fbtc合约的assetid
// 10.调用fbtc合约的mint方法，往目标账号打fbtc代币
