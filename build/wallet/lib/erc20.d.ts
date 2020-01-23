export default class erc20 {
    static testBalanceOf(wallet: any): Promise<any>;
    static testTransfer(wallet: any): Promise<any>;
    static callContract(abiInfo: any, wallet: any): Promise<any>;
    static executeContract(params: any, wallet: any, password: any): Promise<any>;
    static genData(abiInfo: any): string;
}
