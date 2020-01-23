export default class Token {
    abiStr: string;
    fee: number;
    gasLimit: number;
    constructor(address: any);
    unlock(wallet: any, password: any): void;
    callContract(abiInfo: any): Promise<any>;
    executeContract(params: any): Promise<any>;
    getHexData(abiInfo: any): string;
    batch(): Promise<any>;
    orderhash(trade: any): Promise<any>;
    matchorder(trades_info: any, prikey: any, word: any): Promise<any>;
}
