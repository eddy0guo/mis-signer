import { AsimovWallet } from '@fingo/asimov-wallet';
import Config from '../../cfg'

export default class Token {
  private address: string;
  private master: AsimovWallet;
  private child: AsimovWallet;

  constructor(address) {
    this.address = address;

    this.master = new AsimovWallet({
      name: Config.bridge_address,
      address: Config.bridge_address,
      rpc: Config.asimov_master_rpc,
    });

    this.child = new AsimovWallet({
      name: Config.bridge_address,
      address: Config.bridge_address,
      rpc: Config.asimov_child_rpc,
    });
  }

  /**
   * return balance of address
   * @param {*} address
   */
  async balanceOf(address:string, network_flag:string = 'master_poa') {
      const wallet: AsimovWallet = (network_flag === 'master_poa') ? this.master : this.child;
      return wallet.contractCall.callReadOnly(
        this.address,
        'balanceOf(address)',
        [address]
      )
  }

}
