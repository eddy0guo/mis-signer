"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const storage_1 = require("./storage");
class Wallets {
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
        return Wallets.walletInsts[Wallets.activeWltId];
    }
    static getActiveWltId() {
        return Wallets.activeWltId;
    }
    static async setActiveWltId(walletId) {
        Wallets.activeWltId = walletId;
        await storage_1.default.set('activeWltId', walletId);
    }
    static deleteWallet(walletId) {
        if (Wallets.walletInsts[walletId]) {
            delete Wallets.walletInsts[walletId];
        }
    }
}
exports.default = Wallets;
Wallets.walletInsts = {};
//# sourceMappingURL=wallets.js.map