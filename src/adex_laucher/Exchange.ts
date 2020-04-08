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
    // fixme：经验值
    const feeTimes =  trades_info.length;
    return await this.wallet.contractCall.call(
      this.address,
      'processOrders(tuple[])',
      [trades_info],
      10000 * 40 * feeTimes,
      0,
      AsimovConst.DEFAULT_ASSET_ID,
      AsimovConst.DEFAULT_FEE_AMOUNT * feeTimes,
      AsimovConst.DEFAULT_ASSET_ID,
      AsimovConst.CONTRACT_TYPE.CALL
    );
  }
}
