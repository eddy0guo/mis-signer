import Token from './Token'

export default class TokenTest {
    contractAddress = '0x633c6e19bdc52f8d76baaaa5adc963b09a11a8509c';

    /**
     * Addresses of Asilink
     */
    addr1 = '0x6699fe56a98aa190bdd63239e82d03ae0dba8ad1a1';
    addr2 = '0x661743c23467045cde4b199a29568dabdb9733a739';

    /**
     * Address of Wallet
     */
    addr0 = '0x6619fd2d2fd1db189c075ff25800f7b98ff3205e5a';
    word0 = 'benefit park visit oxygen supply oil pupil snack pipe decade young bracket';

    erc20;

    constructor(){
        this.erc20 = new Token(this.contractAddress)
    }

    async testBalanceOf() {
      return this.erc20.balanceOf(this.addr0)
    }
  
    /**
     *
     *  @param {*} wallet 
     */
    async testTransfer(wallet) {
      this.erc20.unlock(wallet,"111111")
      return this.erc20.transfer(this.addr2,33);
    }

    async testApprove(wallet) {
      this.erc20.unlock(wallet,"111111")
      return this.erc20.approve(this.addr2,333);
    }
  
  }
