import Storage from "./storage";

export default class Wallets {
    static walletInsts = {};
    static activeWltId;

    static getWallet(id) {
        return Wallets.walletInsts[id];
    }

    static getWallets() {
        return Wallets.walletInsts;
    }

    static getWalletsId() {
        return Object.keys(Wallets.walletInsts);
    }

    static async addWallet(inst, isActive) {
        Wallets.walletInsts[inst.walletId] = inst;
        if (isActive) {
            await Wallets.setActiveWltId(inst.walletId);
        }
    }

    static getActiveWallet() {
        return Wallets.walletInsts[Wallets.activeWltId]
    }

    static getActiveWltId() {
        return Wallets.activeWltId;
    }

    static async setActiveWltId(walletId) {
        Wallets.activeWltId = walletId;
        await Storage.set('activeWltId', walletId);
    }

    static deleteWallet(walletId) {
        if (Wallets.walletInsts[walletId]) {
            delete Wallets.walletInsts[walletId];
        }
    }
}