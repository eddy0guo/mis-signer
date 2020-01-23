export default class Token {
    abiStr: string;
    fee: number;
    gasLimit: number;
    constructor(address: any);
    unlock(wallet: any, password: any): void;
    callContract(abiInfo: any, value: any): Promise<any>;
    executeContract(params: any): Promise<any>;
    getHexData(abiInfo: any): string;
    deposit(amount: any): Promise<any>;
    withdraw(amount: any): Promise<any>;
    batch(): Promise<any>;
    orderhash(): Promise<any>;
    matchorder(): Promise<any>;
}
