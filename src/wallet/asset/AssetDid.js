import { TranService } from "../service/transaction";
import { CONSTANT } from "../constant";
import { btc2sts } from "../utils";
import { walletRPC } from '../api/wallet';

/**
 * 处理链原生资产的转移等基础操作
 */
export default class Asset {

    constructor(assetId) {
        this.fee = 0.05
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


		const assetObjArr = [];

		assetObjArr.push({
        amount: amount,
        asset: this.assetId
      });

      assetObjArr.push({
        amount: 0.02,
        asset: '000000000000000000000000'
      });

      const { ins, changeOut } = await TranService.chooseUTXO(
        wallet.walletId,
        assetObjArr,
        from
      );

/*
        let { ins, changeOut } = await TranService.chooseUTXO(
            wallet.walletId,
            amount,
            this.assetId,
            from,
            this.fee
        );
*/
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

            // console.log("RAWTX:",rawtx)

            if (!rawtx) {
                console.log("execute Transfer generateRawTx Error")
                return;
            }

            console.log("execute Transfer sendrawtransaction");
			return rawtx;
            //return chain.sendrawtransaction([rawtx]);
        } catch (e) {
            console.log("execute Transfer TX Error", e)
        }
    }

    async balanceOf(address){
        return walletRPC.getbalance([address])
    }
}
