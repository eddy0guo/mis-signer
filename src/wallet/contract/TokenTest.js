import Token from './Token'

export default class TokenTest {
    contractAddress = '0x631f62ca646771cd0c78e80e4eaf1d2ddf8fe414bf';

    /**
     * Addresses of Asilink
     */
   // mist_ex = '0x637f192bff74f7205f98cdba6e058a0be58f369b73';
    taker = '0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9'

    /**
     * Address of Wallet
     */
    addr0 = '0x66edd03c06441f8c2da19b90fcc42506dfa83226d3';
    word0 = 'ivory local this tooth occur glide wild wild few popular science horror';

     
    taker = '0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9';
    taker_word = 'enhance donor garment gospel loop purse pumpkin bag oven bone decide street';


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

     async testTransferfrom(wallet,addr,value) {
       await wallet.queryAllBalance()
                          
      this.erc20.unlock(wallet,"111111")
      return this.erc20.transferfrom(this.taker,addr,3);
    }

      async dex_Transferfrom(wallet,addr,value) {
       await wallet.queryAllBalance()
                          
      this.erc20.unlock(wallet,"111111")
      return this.erc20.dex_transferfrom(this.taker,addr,3);
    }

  
  }
