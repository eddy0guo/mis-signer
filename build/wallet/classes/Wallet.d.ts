export default class Wallet {
    constructor();
    create(config: any): Promise<void>;
    import(config: any): Promise<void>;
    wake(info: any): Promise<void>;
    generateMnemonic(length: any): any;
    generateSeedHex(mnemonic: any): any;
    setXpubkey(seed: any): Promise<void>;
    savePubKey(pubKey: any): Promise<void>;
    setSeed(seed: any, pwd?: string): void;
    setEntropy(entropy: any, pwd?: string): void;
    setWalletId(seed: any): void;
    getAddress(): Promise<any>;
    getInfo(): {
        walletId: any;
        entropy: any;
        seed: any;
        name: any;
        lang: any;
        isTestNet: any;
        backupFlag: any;
        isImported: any;
        assets: any;
        xpubkeys: any;
    };
    decrypt(text: any, pwd: any): string;
    encrypt(text: any, pwd: any): string;
    getPristineSeed(pwd?: string): string;
    getPristineEntropy(pwd?: string): string;
    getMnemonic(pwd: any): any;
    validatePayPassword(payPassword: any): boolean;
    getNoneBIP44PrivateKey(address: any): Promise<any>;
    getPrivateKeys(coinType: any, ins: any[], pwd: any): Promise<any[]>;
    getAuthPrivateKey(pwd: any, coinType: any): any;
    queryAllBalance(): Promise<void>;
    getAssetsInfo(totalAssets: any): Promise<{}>;
}
