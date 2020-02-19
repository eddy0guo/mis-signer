import { AsimovWallet } from '@fingo/asimov-wallet';
import mist_config from '../../cfg';

// 直接用AsimovWallet获得余额也可以
export default class Asset {
  constructor() {
    console.error('TBD');
  }

  public async balanceOf(address): Promise<any> {
    const wallet = new AsimovWallet({
		rpc: mist_config.asimov_master_rpc,
		address
	});
    console.error('TBD');
    return wallet.balance()
  }

  public async transfer(address,amount): Promise<any> {
    const wallet = new AsimovWallet({
		rpc: mist_config.asimov_master_rpc,
		address
		});
    console.error('TBD');
    return wallet.balance()
  }
}
