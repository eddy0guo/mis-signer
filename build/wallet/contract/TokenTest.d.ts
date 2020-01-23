export default class TokenTest {
    GXY: string;
    PAI: string;
    mist_ex: string;
    taker: string;
    addr0: string;
    word0: string;
    taker: string;
    taker_word: string;
    erc20: any;
    constructor();
    testBalanceOf(): Promise<any>;
    testTransfer(wallet: any): Promise<any>;
    testApprove(wallet: any, mist_ex: any, value: any): Promise<any>;
    testTransferfrom(wallet: any, addr: any, value: any): Promise<any>;
    dex_match_order(wallet: any, trades: any): Promise<any>;
}
