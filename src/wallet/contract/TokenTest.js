import Token from './Token'

export default class TokenTest {
    contractAddress = '0x631f62ca646771cd0c78e80e4eaf1d2ddf8fe414bf';

    /**
     * Addresses of Asilink
     */
    mist_ex = '0x637f192bff74f7205f98cdba6e058a0be58f369b73';

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

    async testApprove(wallet,mist_ex,value) {
      this.erc20.unlock(wallet,"111111")
      return this.erc20.approve(mist_ex,value);
    }

     async testTransfrom(wallet,addr,value) {
      this.erc20.unlock(wallet,"111111")
      return this.erc20.transferfrom(mist_ex,addr,value);
    }

  
  }
