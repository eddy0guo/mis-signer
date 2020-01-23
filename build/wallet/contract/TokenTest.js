"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Token_1 = require("./Token");
const ethers = require('@spinlee/ethers');
class TokenTest {
    constructor() {
        this.GXY = '0x631f62ca646771cd0c78e80e4eaf1d2ddf8fe414bf';
        this.PAI = '0x63429bfcfdfbfa0048d1aeaa471be84675f1324a02';
        this.mist_ex = '0x633db214fcfc4d81e07913695a47a3af2d8f4945dd';
        this.taker = '0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9';
        this.addr0 = '0x66edd03c06441f8c2da19b90fcc42506dfa83226d3';
        this.word0 = 'ivory local this tooth occur glide wild wild few popular science horror';
        this.taker = '0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9';
        this.taker_word = 'enhance donor garment gospel loop purse pumpkin bag oven bone decide street';
        this.erc20 = new Token_1.default(this.mist_ex);
    }
    async testBalanceOf() {
        return this.erc20.balanceOf(this.addr0);
    }
    async testTransfer(wallet) {
        this.erc20.unlock(wallet, '111111');
        return this.erc20.transfer(this.addr2, 33);
    }
    async testApprove(wallet, mist_ex, value) {
        this.erc20.unlock(wallet, '111111');
        return this.erc20.approve(mist_ex, value);
    }
    async testTransferfrom(wallet, addr, value) {
        await wallet.queryAllBalance();
        this.erc20.unlock(wallet, '111111');
        return this.erc20.transferfrom(this.taker, addr, 3);
    }
    async dex_match_order(wallet, trades) {
        console.log('dex_match_order----gxy---22', trades);
        await wallet.queryAllBalance();
        const trades_info = [];
        for (const i in trades) {
            const trade_info = [trades[i].taker, trades[i].maker, trades[i].amount * Math.pow(10, 7)];
            trades_info.push(trade_info);
        }
        this.erc20.unlock(wallet, '111111');
        return this.erc20.dex_match_order(trades_info);
    }
}
exports.default = TokenTest;
//# sourceMappingURL=TokenTest.js.map