export default class Token {
    constructor(address: any);
    unlock(wallet: any, password: any): void;
    callContract(abiInfo: any): Promise<any>;
    executeContract(params: any): Promise<any>;
    dex_match_order(trades: any, order_address_set: any): Promise<any>;
    getHexData(abiInfo: any): string;
}
