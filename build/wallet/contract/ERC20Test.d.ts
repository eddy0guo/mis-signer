export default class Erc20Test {
    contractAddress: string;
    addr1: string;
    addr2: string;
    addr0: string;
    word0: string;
    erc20: any;
    constructor();
    testBalanceOf(): Promise<any>;
    batch(wallet: any): Promise<any>;
    orderhash(wallet: any): Promise<any>;
    matchorder(wallet: any): Promise<any>;
}
