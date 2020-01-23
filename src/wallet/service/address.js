import { HDPublicKey, PrivateKey } from "bitcore-lib";
import { Address } from "@asimovdev/asimovjs";
import to from "await-to-js"

import Wallets from "./wallets";
import { CONSTANT } from '../constant'
import Storage from './storage'

async function addKeypairAddressToWalletAddr(address) {

    let wltInst = Wallets.getActiveWallet();
    const { walletId } = wltInst;

    let allAddrs = await Storage.get('walletAddrs') || {};
    let walletAddrs = allAddrs[walletId] || {};
    let walletPairAddrs = walletAddrs[2] || []

    walletPairAddrs.push({address:address})
    walletAddrs[2] = walletPairAddrs;

    await Storage.set('walletAddrs', Object.assign(allAddrs, {
        [walletId]: walletAddrs
    }));

}

async function removeKeypairAddressToWalletAddr(address) {
    let wltInst = Wallets.getActiveWallet();
    const { walletId } = wltInst;

    let allAddrs = await Storage.get('walletAddrs') || {};
    let walletAddrs = allAddrs[walletId] || {};
    let walletPairAddrs = walletAddrs[2] || []

    walletPairAddrs.splice(walletPairAddrs.findIndex(i => i.address == address), 1)
    walletAddrs[2] = walletPairAddrs;

    await Storage.set('walletAddrs', Object.assign(allAddrs, {
        [walletId]: walletAddrs
    }));
}

export default class AddressService {

    static async addKeypair(pkStr) {

        let reg = /^(0x)[0-9a-fA-F]{64}$/
        if (!reg.test(pkStr)) {
            // this.$message({
            //     message: 'The formate of private key is not correct.It should be like this:0x.....,',
            //     type: 'error'
            // });
            // return;
        }
        
        //all privatekey to the flowjs  is not prefix with '0x'
        let pk = pkStr.replace('0x','').trim()
        let privateKey = new PrivateKey(pk);
        let address = new Address(privateKey.publicKey).toString()
        let [keypair, err] = await to(Storage.getKeypair())
        if (err) {
            return;
        }
        keypair = keypair || {};

        keypair[address] = pk;

        Storage.setKeypair(keypair);

        addKeypairAddressToWalletAddr(address);

        return keypair;

    }
    static async removeKeypair(address) {

        let [keypair, err] = await to(Storage.getKeypair())
        if (err) {
            return;
        }
        if (keypair[address]) {
            delete keypair[address]
        }

        Storage.setKeypair(keypair);

        removeKeypairAddressToWalletAddr(address);
        return keypair;

    }
    static async generateAddress(num, changeType, coinType) {
        let wltInst = Wallets.getActiveWallet();
        const { assets, walletId, xpubkeys } = wltInst;
        let types = [changeType];
        if (num == undefined) {
            num = CONSTANT.CREATEADDRSNUM;
        }
        if (changeType == undefined) {
            types = [0, 1];
        }
        if (coinType == undefined) {
            coinType = assets[0].coinType; // ?? 这里也不确定不同币种是不是一样的coinType
        }
        let addrs = await AddressService.getAddrs(walletId);

        let newAddrs = [];

        for (let type of types) {
            let theIndex = -1;
            let lastAddrIndex = await Storage.get('lastAddrIndex' + walletId) || {};
            if (lastAddrIndex[walletId] && lastAddrIndex[walletId][type]) {
                theIndex = lastAddrIndex[walletId][type];
            }
            for (let i = theIndex + 1; i <= num + theIndex; i++) {
                let xpub = new HDPublicKey(xpubkeys);
                var address = new Address(xpub.derive(type).derive(i).publicKey).toString();
                let newAddr = {
                    changeType: type,
                    index: i,
                    address
                }
                newAddrs.push(newAddr);
                addrs[type].push(newAddr);
            }
            lastAddrIndex[walletId] = Object.assign(lastAddrIndex[walletId] || {}, {
                [type]: theIndex + num
            });
            await Storage.set('lastAddrIndex' + walletId, lastAddrIndex);
        }
        let allAddrs = await Storage.get('walletAddrs') || {};
        await Storage.set('walletAddrs', Object.assign(allAddrs, {
            [walletId]: addrs
        }));
        return newAddrs;
    }

    static async getAddrs(walletId) {
        let allAddrs = await Storage.get('walletAddrs');
        let addrs;
        if (allAddrs && allAddrs[walletId]) {
            addrs = allAddrs[walletId];
        } else {
            addrs = Object.assign({}, {
                '0': [],
                '1': []
            });
        }
        return addrs;
    }
}