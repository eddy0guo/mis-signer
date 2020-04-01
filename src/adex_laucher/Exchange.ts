import { AsimovWallet, AsimovConst } from '@fingo/asimov-wallet';
import * as util from 'ethereumjs-util';
import AdexUtils from '../adex/api/utils';

export default class Exchange {
  constructor(
    private address:string,
    private wallet:AsimovWallet,
    ){
  }

  async matchorder(trades_info) {
      console.log(trades_info);
    return await this.wallet.contractCall.call(
      this.address,
      'processOrders(tuple[])',
      [trades_info],
      1000000 * 40,
      0,
      AsimovConst.DEFAULT_ASSET_ID,
      AsimovConst.DEFAULT_FEE_AMOUNT * 100,
      AsimovConst.DEFAULT_ASSET_ID,
      AsimovConst.CONTRACT_TYPE.CALL
    );
  }
}
