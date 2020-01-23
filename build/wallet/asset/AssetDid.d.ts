export default class Asset {
    constructor(assetId: any);
    unlock(wallet: any, password: any): void;
    transfer(address: any, amount: any): Promise<any>;
    balanceOf(address: any): Promise<import("axios").AxiosResponse<any>>;
}
