export default class Token {
    abiStr: string;
    fee: number;
    gasLimit: number;
    constructor(address: any);
    unlock(wallet: any, password: any): void;
    callContract(assetID: any, abiInfo: any, value: any): Promise<any>;
    executeContract(params: any): Promise<any>;
    getHexData(abiInfo: any): string;
    deposit(assetID: any, amount: any): Promise<any>;
    withdraw(assetID: any, amount: any): Promise<any>;
    batch(): Promise<any>;
    orderhash(): Promise<any>;
    matchorder(): Promise<any>;
}
