export default class Token {
    abiStr: string;
    fee: number;
    gasLimit: number;
    constructor(address: any);
    unlock(wallet: any, password: any): void;
    callContract(abiInfo: any, network_flag: any): Promise<any>;
    executeContract(params: any): Promise<any>;
    balanceOf(address: any, network_flag?: string): Promise<any>;
    allowance(owner: any, spender: any): Promise<any>;
    transfer(address: any, amount: any): Promise<any>;
    approve(spender: any, amount: any): Promise<any>;
    transferfrom(from: any, to: any, amount: any): Promise<any>;
    dex_match_order(trades: any): Promise<any>;
    getHexData(abiInfo: any): string;
}
