export default class Wallets {
    static walletInsts: {};
    static activeWltId: any;
    static getWallet(id: any): any;
    static getWallets(): {};
    static getWalletsId(): string[];
    static addWallet(inst: any, isActive: any): Promise<void>;
    static getActiveWallet(): any;
    static getActiveWltId(): any;
    static setActiveWltId(walletId: any): Promise<void>;
    static deleteWallet(walletId: any): void;
}
