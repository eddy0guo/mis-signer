export default class Token {
    abiStr: string;
    fee: number;
    gasLimit: number;
    constructor(address: any);
    unlock(wallet: any, password: any): void;
    callContract(abiInfo: any, asset_id: any, amount: any): Promise<any>;
    executeContract(params: any): Promise<any>;
    getHexData(abiInfo: any): string;
    createDepositBorrow(borrow_amount: any, borrow_type: any, deposit_assetID: any, deposit_amount: any): Promise<any>;
    repay(borrow_id: any, repay_assetID: any, amount: any): Promise<any>;
    deposit(borrow_id: any, deposit_assetID: any, amount: any): Promise<any>;
    liquidate(borrow_id: any, deposit_assetID: any): Promise<any>;
    debtOfCDP(): Promise<any>;
}
