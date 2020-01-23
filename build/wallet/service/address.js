"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bitcore_lib_1 = require("bitcore-lib");
const asimovjs_1 = require("@asimovdev/asimovjs");
const await_to_js_1 = require("await-to-js");
const wallets_1 = require("./wallets");
const constant_1 = require("../constant");
const storage_1 = require("./storage");
async function addKeypairAddressToWalletAddr(address) {
    const wltInst = wallets_1.default.getActiveWallet();
    const { walletId } = wltInst;
    const allAddrs = await storage_1.default.get('walletAddrs') || {};
    const walletAddrs = allAddrs[walletId] || {};
    const walletPairAddrs = walletAddrs[2] || [];
    walletPairAddrs.push({ address });
    walletAddrs[2] = walletPairAddrs;
    await storage_1.default.set('walletAddrs', Object.assign(allAddrs, {
        [walletId]: walletAddrs,
    }));
}
async function removeKeypairAddressToWalletAddr(address) {
    const wltInst = wallets_1.default.getActiveWallet();
    const { walletId } = wltInst;
    const allAddrs = await storage_1.default.get('walletAddrs') || {};
    const walletAddrs = allAddrs[walletId] || {};
    const walletPairAddrs = walletAddrs[2] || [];
    walletPairAddrs.splice(walletPairAddrs.findIndex(i => i.address == address), 1);
    walletAddrs[2] = walletPairAddrs;
    await storage_1.default.set('walletAddrs', Object.assign(allAddrs, {
        [walletId]: walletAddrs,
    }));
}
class AddressService {
    static async addKeypair(pkStr) {
        const reg = /^(0x)[0-9a-fA-F]{64}$/;
        if (!reg.test(pkStr)) {
        }
        const pk = pkStr.replace('0x', '').trim();
        const privateKey = new bitcore_lib_1.PrivateKey(pk);
        const address = new asimovjs_1.Address(privateKey.publicKey).toString();
        let [keypair, err] = await await_to_js_1.default(storage_1.default.getKeypair());
        if (err) {
            return;
        }
        keypair = keypair || {};
        keypair[address] = pk;
        storage_1.default.setKeypair(keypair);
        addKeypairAddressToWalletAddr(address);
        return keypair;
    }
    static async removeKeypair(address) {
        const [keypair, err] = await await_to_js_1.default(storage_1.default.getKeypair());
        if (err) {
            return;
        }
        if (keypair[address]) {
            delete keypair[address];
        }
        storage_1.default.setKeypair(keypair);
        removeKeypairAddressToWalletAddr(address);
        return keypair;
    }
    static async generateAddress(num, changeType, coinType) {
        const wltInst = wallets_1.default.getActiveWallet();
        const { assets, walletId, xpubkeys } = wltInst;
        let types = [changeType];
        if (num == undefined) {
            num = constant_1.CONSTANT.CREATEADDRSNUM;
        }
        if (changeType == undefined) {
            types = [0, 1];
        }
        if (coinType == undefined) {
            coinType = assets[0].coinType;
        }
        const addrs = await AddressService.getAddrs(walletId);
        const newAddrs = [];
        for (const type of types) {
            let theIndex = -1;
            const lastAddrIndex = await storage_1.default.get('lastAddrIndex' + walletId) || {};
            if (lastAddrIndex[walletId] && lastAddrIndex[walletId][type]) {
                theIndex = lastAddrIndex[walletId][type];
            }
            for (let i = theIndex + 1; i <= num + theIndex; i++) {
                const xpub = new bitcore_lib_1.HDPublicKey(xpubkeys);
                const address = new asimovjs_1.Address(xpub.derive(type).derive(i).publicKey).toString();
                const newAddr = {
                    changeType: type,
                    index: i,
                    address,
                };
                newAddrs.push(newAddr);
                addrs[type].push(newAddr);
            }
            lastAddrIndex[walletId] = Object.assign(lastAddrIndex[walletId] || {}, {
                [type]: theIndex + num,
            });
            await storage_1.default.set('lastAddrIndex' + walletId, lastAddrIndex);
        }
        const allAddrs = await storage_1.default.get('walletAddrs') || {};
        await storage_1.default.set('walletAddrs', Object.assign(allAddrs, {
            [walletId]: addrs,
        }));
        return newAddrs;
    }
    static async getAddrs(walletId) {
        const allAddrs = await storage_1.default.get('walletAddrs');
        let addrs;
        if (allAddrs && allAddrs[walletId]) {
            addrs = allAddrs[walletId];
        }
        else {
            addrs = Object.assign({}, {
                0: [],
                1: [],
            });
        }
        return addrs;
    }
}
exports.default = AddressService;
//# sourceMappingURL=address.js.map