"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const Wallet_1 = require("../classes/Wallet");
const wallets_1 = require("../service/wallets");
const walletHelper = {
    async testWalletWithSeed(seed, pass) {
        const wallet = new Wallet_1.default();
        await wallets_1.default.addWallet(wallet, true);
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
        const wallet = new Wallet_1.default();
        await wallets_1.default.addWallet(wallet, true);
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
        return wallet;
    },
    checkMnonemic(mnemoArray) {
        const mnemonic_text = mnemoArray.trim();
        return utils_1.validateMnemonic(mnemonic_text);
    },
    checkSeed(seed) {
        if (seed.length != 128 || seed.length != 256) {
            console.log('Seed Error:', seed.length);
            return false;
        }
        return true;
    },
};
exports.default = walletHelper;
//# sourceMappingURL=walletHelper.js.map