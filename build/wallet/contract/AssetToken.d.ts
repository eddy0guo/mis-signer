export default class Token {
    constructor(address: any);
    unlock(wallet: any, password: any): void;
    callContract(abiInfo: any): Promise<any>;
    executeContract(params: any): Promise<any>;
    balanceOf(address: any): Promise<any>;
    getAssetInfo(): Promise<any>;
    getHexData(abiInfo: any): string;
}
