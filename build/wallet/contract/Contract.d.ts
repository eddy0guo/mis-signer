export default class Contract {
    fee: number;
    gasLimit: number;
    address: any;
    wallet: any;
    password: any;
    constructor(address: any, abiStr?: string);
    unlock(wallet: any, password: any): void;
    callContract(abiInfo: any): Promise<any>;
    executeContract(params: any): Promise<any>;
    getHexData(abiInfo: any): string;
}
