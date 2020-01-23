export default class Organization {
    abiStr: string;
    fee: number;
    gasLimit: number;
    constructor(address: any);
    unlock(wallet: any, password: any): void;
    callContract(abiInfo: any): Promise<any>;
    executeContract(params: any): Promise<any>;
    TemplateInfo(address: any): Promise<any>;
    issueMoreAsset(index: any): Promise<any>;
    getHexData(abiInfo: any): string;
}
