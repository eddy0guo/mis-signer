import { AsimovWallet } from '@fingo/asimov-wallet';
import Config, {BullOption} from '../../cfg'
import NP from 'number-precision/src/index';
import * as  redis from 'redis';
import { promisify } from 'util';
import to from 'await-to-js';



export default class Token {
  private address: string;
  private master: AsimovWallet;
  private child: AsimovWallet;
  private redisClient;

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

    if (typeof BullOption.redis !== 'string') {
      this.redisClient = redis.createClient(BullOption.redis.port, BullOption.redis.host);
      this.redisClient.auth(BullOption.redis.password);
    }
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
  async localBalanceOf(symbol:string) {
    const hgetAsync = promisify(this.redisClient.hget).bind(this.redisClient);
    const [balanceErr,balanceRes] = await to(hgetAsync(this.address, symbol));
    if(balanceErr || balanceRes === null){
      console.error('localBalanceOf ',balanceErr);
      return 0;
    }
    return balanceRes;
  }
  async batchquery(address:string[], network_flag:string = 'master_poa') {
    const wallet: AsimovWallet = (network_flag === 'master_poa') ? this.master : this.child;
    return wallet.contractCall.callReadOnly(
        this.address,
        'batchquery(address[])',
        [address]
    )
  }

  async totalSupply(network_flag:string = 'master_poa') {
    const wallet: AsimovWallet = (network_flag === 'master_poa') ? this.master : this.child;
    return wallet.contractCall.callReadOnly(
        this.address,
        'totalSupply()',
        []
    )
  }

}
