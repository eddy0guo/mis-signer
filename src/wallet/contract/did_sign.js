import helper from '../lib/txHelper'
import { chain } from '../api/chain'
import { TranService } from "../service/transaction";
import { CONSTANT } from "../constant";
import { btc2sts, isArrayType, callParamsConvert,signature,getWalletPubKey} from "../utils";
const bitcore_lib_1 = require("bitcore-lib");
const ECDSA = bitcore_lib_1.crypto.ECDSA;
export default class Token {
  fee = 0.1
 gasLimit = 30000000

unlock(wallet, password) {
    this.wallet = wallet
    this.password = password
}

async callContract(hex_data) {
	if(!value){value = 0;};
    let params = {
        to: this.address,
        amount: 0,
        assetId: '000000000000000000000000',
        data: hex_data
      };
      console.log('params.data',params.data)
        params.from = await this.wallet.getAddress()
        params.type = CONSTANT.CONTRACT_TYPE.CALL
        return this.executeContract(params)
}

async executeContract(params) {
    let wallet = this.wallet;
    let password = this.password;


	  const assetObjArr = [];

        assetObjArr.push({
        amount: params.amount,
        asset: params.assetId
      });

      assetObjArr.push({
        amount: 0.02,
        asset: '000000000000000000000000'
      });

      const { ins, changeOut } = await TranService.chooseUTXO(
        wallet.walletId,
        assetObjArr,
        params.from
      );
	
   

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
        return rawtx;
    } catch (e) {
        console.log("executeContract TX Error", e)
    }
}

}

