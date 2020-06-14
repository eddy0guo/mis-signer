import { AsimovWallet, AsimovConst } from '@fingo/asimov-wallet';
import * as util from 'ethereumjs-util';
import AdexUtils from '../adex/api/utils';
import to from 'await-to-js';

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
      'burst(tuple[])',
      [trades_info],
      10000 * 40 * feeTimes,
      0,
      AsimovConst.DEFAULT_ASSET_ID,
      AsimovConst.DEFAULT_FEE_AMOUNT * feeTimes,
      AsimovConst.DEFAULT_ASSET_ID,
      AsimovConst.CONTRACT_TYPE.CALL
    );
  }

//     await call(Leverage,"empower(tuple[])",[[["0x669952fb5d185d36b168b9f6c3bbeade4ad6510aee",signinfo]]])
  async approveLeverage(trades_info) {
    // fixme：经验值
    const feeTimes =  trades_info.length;
    return await this.wallet.contractCall.call(
        this.address,
        'empower(tuple[])',
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
