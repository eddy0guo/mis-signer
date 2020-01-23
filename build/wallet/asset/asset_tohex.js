"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transaction_1 = require("../service/transaction");
const constant_1 = require("../constant");
const utils_1 = require("../utils");
const wallet_1 = require("../api/wallet");
class Asset {
    constructor(assetId) {
        this.fee = 0.05;
        this.assetId = assetId;
    }
    unlock(wallet, password) {
        this.wallet = wallet;
        this.password = password;
    }
    async transfer(address, amount) {
        const wallet = this.wallet;
        const password = this.password;
        const from = await wallet.getAddress();
        const assetObjArr = [];
        assetObjArr.push({
            amount,
            asset: this.assetId
        });
        assetObjArr.push({
            amount: 0.02,
            asset: '000000000000000000000000'
        });
        const { ins, changeOut } = await transaction_1.TranService.chooseUTXO(wallet.walletId, assetObjArr, from);
        let outs = [{
                amount: utils_1.btc2sts(parseFloat(amount)),
                assets: this.assetId,
                address,
                data: '',
                contractType: ''
            }];
        if (changeOut && changeOut.length) {
            outs = outs.concat(changeOut);
        }
        const keys = await wallet.getPrivateKeys(constant_1.CONSTANT.DEFAULT_COIN.coinType, ins, password);
        try {
            const rawtx = transaction_1.TranService.generateTxHex(ins, outs, keys);
            if (!rawtx) {
                console.log('execute Transfer generateRawTx Error');
                return;
            }
            console.log('execute Transfer sendrawtransaction');
            return rawtx;
        }
        catch (e) {
            console.log('execute Transfer TX Error', e);
        }
    }
    async balanceOf(address) {
        return wallet_1.walletRPC.getbalance([address]);
    }
}
exports.default = Asset;
//# sourceMappingURL=asset_tohex.js.map