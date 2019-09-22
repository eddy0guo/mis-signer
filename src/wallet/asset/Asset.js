import { chain } from '../api/chain'
import { TranService } from "../service/transaction";
import { CONSTANT } from "../constant";
import { btc2sts } from "../utils";
import { walletRPC } from '../api/wallet';

/**
 * 处理链原生资产的转移等基础操作
 */
export default class Asset {
    fee = 0.05

    constructor(assetId) {
        this.assetId = assetId;
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

    async transfer(address,amount) {
        let wallet = this.wallet;
        let password = this.password;
        let from = await wallet.getAddress()

        let { ins, changeOut } = await TranService.chooseUTXO(
            wallet.walletId,
            amount,
            this.assetId,
            from,
            this.fee
        );

        let outs = [{
            amount: btc2sts(parseFloat(amount)),
            assets: this.assetId,
            address: address,
            data: "",
            contractType: ""
        }];

        if (changeOut && changeOut.length) {
            outs = outs.concat(changeOut);
        }

        let keys = await wallet.getPrivateKeys(
            CONSTANT.DEFAULT_COIN.coinType,
            ins,
            password
        );

        try {
            let rawtx = TranService.generateRawTx(ins, outs, keys);

            console.log("RAWTX:",rawtx)

            if (!rawtx) {
                console.log("executeContract Raw TX Error")
                return;
            }

            console.log("executeContract Success:",ins, outs);
            return chain.sendrawtransaction([rawtx]);
        } catch (e) {
            console.log("executeContract TX Error", e)
        }
    }

    async balanceOf(address){
        return walletRPC.getbalance([address])
    }
}