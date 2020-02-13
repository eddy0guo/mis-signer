import { HDPublicKey, PrivateKey } from 'bitcore-lib';
import { Address } from '@asimovdev/asimovjs';
import to from 'await-to-js';

import Wallets from './wallets';
import { CONSTANT } from '../constant';
import Storage from './storage';

async function addKeypairAddressToWalletAddr(address) {

    const wltInst = Wallets.getActiveWallet();
    const { walletId } = wltInst;

    const allAddrs = await Storage.get('walletAddrs') || {};
    const walletAddrs = allAddrs[walletId] || {};
    const walletPairAddrs = walletAddrs[2] || [];

    walletPairAddrs.push({address});
    walletAddrs[2] = walletPairAddrs;

    await Storage.set('walletAddrs', Object.assign(allAddrs, {
        [walletId]: walletAddrs,
    }));

}

async function removeKeypairAddressToWalletAddr(address) {
    const wltInst = Wallets.getActiveWallet();
    const { walletId } = wltInst;

    const allAddrs = await Storage.get('walletAddrs') || {};
    const walletAddrs = allAddrs[walletId] || {};
    const walletPairAddrs = walletAddrs[2] || [];

    walletPairAddrs.splice(walletPairAddrs.findIndex(i => i.address === address), 1);
    walletAddrs[2] = walletPairAddrs;

    await Storage.set('walletAddrs', Object.assign(allAddrs, {
        [walletId]: walletAddrs,
    }));
}

export default class AddressService {

    static async addKeypair(pkStr) {

        const reg = /^(0x)[0-9a-fA-F]{64}$/;
        if (!reg.test(pkStr)) {
            // this.$message({
            //     message: 'The formate of private key is not correct.It should be like this:0x.....,',
            //     type: 'error'
            // });
            // return;
        }

        // all privatekey to the flowjs  is not prefix with '0x'
        const pk = pkStr.replace('0x', '').trim();
        const privateKey = new PrivateKey(pk);
        const address = new Address(privateKey.publicKey).toString();
        let [keypair, err] = await to(Storage.getKeypair());
        if (err) {
            console.error(err)
            err = null;
            return;
        }
		//unuseful code ?
        //keypair = keypair || {};

        keypair[address] = pk;

        Storage.setKeypair(keypair);

        addKeypairAddressToWalletAddr(address);

        return keypair;

    }
    static async removeKeypair(address) {

        const [keypair, err] = await to(Storage.getKeypair());
        if (err) {
            return;
        }
        if (keypair[address]) {
            delete keypair[address];
        }

        Storage.setKeypair(keypair);

        removeKeypairAddressToWalletAddr(address);
        return keypair;

    }
    static async generateAddress(num, changeType, coinType) {
        const wltInst = Wallets.getActiveWallet();
        const { assets, walletId, xpubkeys } = wltInst;
        let types = [changeType];
        if (num === undefined) {
            num = CONSTANT.CREATEADDRSNUM;
        }
        if (changeType === undefined) {
            types = [0, 1];
        }
        if (coinType === undefined) {
            coinType = assets[0].coinType; // ?? 这里也不确定不同币种是不是一样的coinType
        }
        const addrs = await AddressService.getAddrs(walletId);

        const newAddrs = [];

        for (const type of types) {
            let theIndex = -1;
            const lastAddrIndex = await Storage.get('lastAddrIndex' + walletId) || {};
            if (lastAddrIndex[walletId] && lastAddrIndex[walletId][type]) {
                theIndex = lastAddrIndex[walletId][type];
            }
            for (let i = theIndex + 1; i <= num + theIndex; i++) {
                const xpub = new HDPublicKey(xpubkeys);
                const address = new Address(xpub.derive(type).derive(i).publicKey).toString();
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
            await Storage.set('lastAddrIndex' + walletId, lastAddrIndex);
        }
        const allAddrs = await Storage.get('walletAddrs') || {};
        await Storage.set('walletAddrs', Object.assign(allAddrs, {
            [walletId]: addrs,
        }));
        return newAddrs;
    }

    static async getAddrs(walletId) {
        const allAddrs = await Storage.get('walletAddrs');
        let addrs;
        if (allAddrs && allAddrs[walletId]) {
            addrs = allAddrs[walletId];
        } else {
            addrs = Object.assign({}, {
                0: [],
                1: [],
            });
        }
        return addrs;
    }
}
