"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ERC20_1 = require("./ERC20");
class Erc20Test {
    constructor() {
        this.contractAddress = '0x63fd0d4f6e9a40f5af26addb6d52d2aff5b232a70f';
        this.addr1 = '0x6699fe56a98aa190bdd63239e82d03ae0dba8ad1a1';
        this.addr2 = '0x668191f35bcc9d4c834e06bdbcb773609c40ba4cea';
        this.addr0 = '0x668191f35bcc9d4c834e06bdbcb773609c40ba4cea';
        this.word0 = 'benefit park visit oxygen supply oil pupil snack pipe decade young bracket';
        this.erc20 = new ERC20_1.default(this.contractAddress);
    }
    async testBalanceOf() {
        return this.erc20.balanceOf(this.addr0);
    }
    async batch(wallet) {
        this.erc20.unlock(wallet, '111111');
        return this.erc20.batch(this.addr2, 33);
    }
    async orderhash(wallet) {
        this.erc20.unlock(wallet, '111111');
        return this.erc20.orderhash(this.addr2, 33);
    }
    async matchorder(wallet) {
        this.erc20.unlock(wallet, '111111');
        return this.erc20.matchorder(this.addr2, 33);
    }
}
exports.default = Erc20Test;
//# sourceMappingURL=ERC20Test.js.map