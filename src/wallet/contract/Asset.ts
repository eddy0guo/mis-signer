import { AsimovWallet } from '@fingo/asimov-wallet';
import mist_config from '../../cfg';

// 直接用AsimovWallet获得余额也可以
export default class Asset {
  public async balanceOf(address): Promise<any> {
    const wallet = new AsimovWallet({
      rpc: mist_config.asimov_master_rpc,
      address
    });
    return wallet.balance()
  }
}
