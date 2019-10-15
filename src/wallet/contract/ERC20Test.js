import Erc20 from './ERC20'

export default class Erc20Test {
    contractAddress = '0x63fd0d4f6e9a40f5af26addb6d52d2aff5b232a70f';

    /**
     * Addresses of Asilink
     */
    addr1 = '0x6699fe56a98aa190bdd63239e82d03ae0dba8ad1a1';
    addr2 = '0x668191f35bcc9d4c834e06bdbcb773609c40ba4cea';

    /**
     * Address of Wallet
     */
    addr0 = '0x668191f35bcc9d4c834e06bdbcb773609c40ba4cea';
    word0 = 'benefit park visit oxygen supply oil pupil snack pipe decade young bracket';

    erc20;

    constructor(){
        this.erc20 = new Erc20(this.contractAddress)
    }

    async testBalanceOf() {
      return this.erc20.balanceOf(this.addr0)
    }
  
    /**
     *
     *  @param {*} wallet 
     */
    // async deposit(wallet) {
    //   this.erc20.unlock(wallet,"111111")
    //   return this.erc20.deposit(this.addr2,33);
    // }
    // async withdraw(wallet) {
    //     this.erc20.unlock(wallet,"111111")
    //     return this.erc20.withdraw(this.addr2,33);
    //   }
      async batch(wallet) {
        this.erc20.unlock(wallet,"111111")
        return this.erc20.batch(this.addr2,33);
      }
    

      async orderhash(wallet){
        this.erc20.unlock(wallet,"111111")
        return this.erc20.orderhash(this.addr2,33);
      }

      async matchorder(wallet){
        this.erc20.unlock(wallet,"111111")
        return this.erc20.matchorder(this.addr2,33);
      }
}