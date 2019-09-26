import Token from './Token'

export default class TokenTest {
    contractAddress = '0x631f62ca646771cd0c78e80e4eaf1d2ddf8fe414bf';

    /**
     * Addresses of Asilink
     */
    addr1 = '0x6699fe56a98aa190bdd63239e82d03ae0dba8ad1a1';
    addr2 = '0x661743c23467045cde4b199a29568dabdb9733a739';

    /**
     * Address of Wallet
     */
    addr0 = '0x66edd03c06441f8c2da19b90fcc42506dfa83226d3';
    word0 = 'ivory local this tooth occur glide wild wild few popular science horror';

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
