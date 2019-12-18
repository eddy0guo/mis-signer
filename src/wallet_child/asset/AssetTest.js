import Asset from './Asset'
import { CONSTANT } from '../constant';

export default class AssetTest {

    /**
     * Addresses of Asilink
     */
    addr1 = '0x6699fe56a98aa190bdd63239e82d03ae0dba8ad1a1'
    addr2 = '0x661743c23467045cde4b199a29568dabdb9733a739'

    /**
     * Address of Wallet
     */
    addr0 = '0x6619fd2d2fd1db189c075ff25800f7b98ff3205e5a'
    word0 = 'benefit park visit oxygen supply oil pupil snack pipe decade young bracket'

    asset;

    constructor(){
        this.asset = new Asset(CONSTANT.DEFAULT_ASSET)
    }

    async testBalanceOf() {
      return this.asset.balanceOf(this.addr0)
    }
  
    /**
     *
     *  @param {*} wallet 
     */
    async testTransfer(wallet) {
      this.asset.unlock(wallet,"111111")
      return this.asset.transfer(this.addr2,0.5);
    }
  
  }