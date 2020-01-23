import { chain } from '../api/chain'
import { TranService } from '../service/transaction';
import { CONSTANT } from '../constant';
import { btc2sts } from '../utils';
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
        const wallet = this.wallet;
        const password = this.password;
        const from = await wallet.getAddress()


		const assetObjArr = [];

		assetObjArr.push({
        amount,
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
            address,
            data: '',
            contractType: ''
        }];

        if (changeOut && changeOut.length) {
            outs = outs.concat(changeOut);
        }

        const keys = await wallet.getPrivateKeys(
            CONSTANT.DEFAULT_COIN.coinType,
            ins,
            password
        );

        try {
            const rawtx = TranService.generateTxHex(ins, outs, keys);

            // console.log("RAWTX:",rawtx)

            if (!rawtx) {
                console.log('execute Transfer generateRawTx Error')
                return;
            }

            console.log('execute Transfer sendrawtransaction');
			return rawtx;
            // return chain.sendrawtransaction([rawtx]);
        } catch (e) {
            console.log('execute Transfer TX Error', e)
        }
    }

    async balanceOf(address){
        return walletRPC.getbalance([address])
    }
}
