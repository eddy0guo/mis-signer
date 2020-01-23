import { validateMnemonic } from '../utils';
import Wallet from '../classes/Wallet';
import Wallets from '../service/wallets';

const walletHelper = {
    async testWalletWithSeed(seed, pass){
        const wallet = new Wallet();
        await Wallets.addWallet(wallet, true);
        const params = {
            type: 'seed',
            walletName: 'My First Wallet',
        };
        if (!this.checkSeed(seed)) {
            console.log('seed不正确');
            return;
        }
        Object.assign(params, {
            seed,
            pwd: pass,
        });
        await wallet.import(params);
        await wallet.queryAllBalance();
        return wallet;
    },
    async testWallet(mnemoArray, password) {
        const wallet = new Wallet();
        await Wallets.addWallet(wallet, true);
        const params = {
            type: 'mnemonic',
            walletName: 'My First Wallet',
        };
        if (!this.checkMnonemic(mnemoArray)) {
            console.log('check mnonemic error');
            return;
        }
        Object.assign(params, {
            mnemonic: mnemoArray.trim(),
            pwd: password,
        });
        await wallet.import(params);
        await wallet.queryAllBalance();
        // let address = await wallet.getAddress()
        // console.log(wallet.walletId,address)
        return wallet;
    },
    checkMnonemic(mnemoArray) {
        const mnemonic_text = mnemoArray.trim();
        return validateMnemonic(mnemonic_text);
    },
    checkSeed(seed) {
        if ( seed.length != 128 || seed.length != 256) {
            console.log('Seed Error:', seed.length);
            return false;
        }

        return true;
    },
};

export default walletHelper;