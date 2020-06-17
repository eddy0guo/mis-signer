import { AsimovWallet } from '@fingo/asimov-wallet';
import Config, {BullOption} from '../../cfg'
import NP from 'number-precision/src/index';
import * as  redis from 'redis';
import { promisify } from 'util';
import to from 'await-to-js';
import Utils from '../../adex/api/utils';
import {ILocalBook} from '../../interface';
import {Networks} from 'bitcore-lib';
import add = Networks.add;
import utils from '../../adex/api/utils';



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
  async localBalanceOf(symbol:string,redisClient) {
    const hgetAsync = promisify(redisClient.hget).bind(redisClient)
    const [balanceErr,balanceRes] = await to(hgetAsync(Utils.bookKeyFromAddress(this.address), symbol));
    if(balanceErr || balanceRes === null){
      console.error('localBalanceOf ',balanceErr);
      return 0;
    }
    const localBook:ILocalBook = JSON.parse(balanceRes);
    return +localBook.balance;
  }
  static async getLocalBook(symbol:string, redisClient, address:string) : Promise<ILocalBook>{
    const hgetAsync = promisify(redisClient.hget).bind(redisClient)
    const loocalBookStr = await hgetAsync(Utils.bookKeyFromAddress(address), symbol);
    return JSON.parse(loocalBookStr.toString());
  }
  static async setLocalBook(symbol:string, redisClient, address:string, book:ILocalBook) : Promise<void>{
    const hgetAsync = promisify(redisClient.hget).bind(redisClient)
    await redisClient.HMSET(Utils.bookKeyFromAddress(address), symbol, JSON.stringify(book));
    return ;
  }

  static async lockLocalBook(redisClient, address:string) : Promise<void>{
    const key = 'lock::' + address;
    const setnxAsync = promisify(redisClient.setnx).bind(redisClient)
    while (true){
      const result = await setnxAsync(key, 1);
      if(result){
        break;
      }
      // console.log('%s is locked',address,Date.now());
      await Utils.sleep2(20);
    }
    await redisClient.expire(key, 10);
    return ;
  }

  static async unlockLocalBook(redisClient, address:string) : Promise<void>{
    const key = 'lock::' + address;
    await redisClient.del(key);
    return ;
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
