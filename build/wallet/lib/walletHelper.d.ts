import Wallet from '../classes/Wallet';
declare const walletHelper: {
    testWalletWithSeed(seed: any, pass: any): Promise<Wallet>;
    testWallet(mnemoArray: any, password: any): Promise<Wallet>;
    checkMnonemic(mnemoArray: any): boolean;
    checkSeed(seed: any): boolean;
};
export default walletHelper;
