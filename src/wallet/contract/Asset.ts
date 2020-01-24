import { AsimovWallet } from '@fingo/asimov-wallet';

// 直接用AsimovWallet获得余额也可以
export default class Asset {
  constructor(assetId) {
    console.error('TBD', assetId);
  }

  public async balanceOf(address): Promise<any> {
    const wallet = new AsimovWallet({ address });
    console.error('TBD');
    return wallet.balance()
  }
}
