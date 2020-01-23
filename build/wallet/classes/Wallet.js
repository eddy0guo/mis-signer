"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bip39_1 = require("bip39");
const bitcore_lib_1 = require("bitcore-lib");
const encrypto_1 = require("../service/encrypto");
const constant_1 = require("../constant");
const storage_1 = require("../service/storage");
const wallets_1 = require("../service/wallets");
const utils_1 = require("../utils");
const address_1 = require("../service/address");
const transaction_1 = require("../service/transaction");
const PATH = 'm/44\'';
const PATH_FOR_ID = 'm/6\'/10003\'/0\'/0/0';
class Wallet {
    constructor() {
        this.isTestNet = false;
        this.walletId;
        this.entropy;
        this.seed;
        this.xpubkeys;
        this.name;
        this.lang;
        this.isTestNet = false;
        this.backupFlag = false;
        this.isImported = false;
        this.assets = constant_1.CONSTANT.COINS;
        this.loadingInstance;
    }
    async create(config) {
        const { walletName, lang, mnemonicLength = 12, pwd, } = config;
        this.name = walletName;
        this.lang = constant_1.CONSTANT.WordListNameDict[lang];
        const mnemonic = this.generateMnemonic(mnemonicLength, pwd);
        const seed = this.generateSeedHex(mnemonic);
        this.setWalletId(seed);
        this.setEntropy(bip39_1.default.mnemonicToEntropy(mnemonic, bip39_1.default.wordlists[this.lang]), pwd);
        this.setSeed(seed, pwd);
        this.setXpubkey(seed);
    }
    async import(config) {
        let { walletName, type, mnemonic, pwd, seed } = config;
        this.isImported = true;
        this.backupFlag = true;
        this.name = walletName;
        if (type == 'mnemonic') {
            this.lang = utils_1.getWordlistLanguage(mnemonic);
            seed = this.generateSeedHex(mnemonic);
            this.setWalletId(seed);
            this.setEntropy(bip39_1.default.mnemonicToEntropy(mnemonic, bip39_1.default.wordlists[this.lang]), pwd);
        }
        else {
            this.setWalletId(seed);
        }
        this.setSeed(seed, pwd);
        this.setXpubkey(seed);
        const allWallet = await storage_1.default.get('walletInfo') || {};
        if (allWallet[this.walletId]) {
            delete allWallet[this.walletId];
        }
        const allAddrs = await storage_1.default.get('walletAddrs') || {};
        if (!allAddrs[this.walletId]) {
            await address_1.default.generateAddress();
        }
    }
    async wake(info) {
        const { walletId, entropy, seed, name, lang, isTestNet = false, backupFlag = false, isImported = false, xpubkeys, } = info;
        this.walletId = walletId;
        this.entropy = entropy;
        this.seed = seed;
        this.name = name;
        this.lang = lang;
        this.isTestNet = isTestNet;
        this.backupFlag = backupFlag;
        this.isImported = isImported;
        this.assets = constant_1.CONSTANT.COINS;
        this.xpubkeys = xpubkeys;
        wallets_1.default.addWallet(this, true);
    }
    generateMnemonic(length) {
        const mnemo = bip39_1.default.generateMnemonic(length == 24 ? 256 : 128, undefined, bip39_1.default.wordlists[this.lang]);
        return mnemo;
    }
    generateSeedHex(mnemonic) {
        return bip39_1.default.mnemonicToSeedHex(mnemonic);
    }
    async setXpubkey(seed) {
        const hdPrivateKey = bitcore_lib_1.HDPrivateKey.fromSeed(seed).derive(`${PATH}/10003'/0'`);
        const xpubkeys = hdPrivateKey.xpubkey;
        this.xpubkeys = xpubkeys;
        const pubKey = hdPrivateKey.derive(0).derive(0).publicKey.toString();
        await this.savePubKey(pubKey);
    }
    async savePubKey(pubKey) {
        const pubKeys = await storage_1.default.getPubKeys() || {};
        const pubKeyArr = [];
        pubKeyArr.push([]);
        pubKeyArr[0].push({ pubKey });
        await storage_1.default.setPubKeys(Object.assign(pubKeys, {
            [this.walletId]: pubKeyArr,
        }));
    }
    setSeed(seed, pwd = '') {
        this.seed = this.encrypt(seed, pwd);
    }
    setEntropy(entropy, pwd = '') {
        this.entropy = this.encrypt(entropy, pwd);
    }
    setWalletId(seed) {
        const prvk = bitcore_lib_1.HDPrivateKey.fromSeed(seed).derive(PATH_FOR_ID);
        this.walletId = bitcore_lib_1.crypto.Hash.sha256ripemd160(prvk.publicKey.toBuffer()).toString('hex');
    }
    async getAddress() {
        const walletId = this.walletId;
        const addresses = await storage_1.default.get('walletAddrs');
        return addresses[walletId][0][0].address;
    }
    getInfo() {
        const info = {
            walletId: this.walletId,
            entropy: this.entropy,
            seed: this.seed,
            name: this.name,
            lang: this.lang,
            isTestNet: this.isTestNet,
            backupFlag: this.backupFlag,
            isImported: this.isImported,
            assets: this.assets,
            xpubkeys: this.xpubkeys,
        };
        return info;
    }
    decrypt(text, pwd) {
        let k = constant_1.CONSTANT.DEFAULT_PASSWORD;
        if (pwd) {
            k = k + this.walletId + encrypto_1.default.MD5(pwd);
        }
        return encrypto_1.default.sDecrypt(text, k);
    }
    encrypt(text, pwd) {
        let k = constant_1.CONSTANT.DEFAULT_PASSWORD;
        if (pwd) {
            k = k + this.walletId + encrypto_1.default.MD5(pwd);
        }
        return encrypto_1.default.sEncrypt(text, k);
    }
    getPristineSeed(pwd = '') {
        return this.decrypt(this.seed, pwd);
    }
    getPristineEntropy(pwd = '') {
        return this.decrypt(this.entropy, pwd);
    }
    getMnemonic(pwd) {
        return bip39_1.default.entropyToMnemonic(this.getPristineEntropy(pwd), bip39_1.default.wordlists[this.lang]);
    }
    validatePayPassword(payPassword) {
        const xpub = bitcore_lib_1.HDPrivateKey.fromSeed(this.getPristineSeed(payPassword)).derive(`${PATH}/10003'/0'`).xpubkey;
        return xpub == this.xpubkeys;
    }
    async getNoneBIP44PrivateKey(address) {
        const keypairs = await storage_1.default.getKeypair();
        return keypairs[address] || '';
    }
    async getPrivateKeys(coinType, ins = [], pwd) {
        const seed = this.getPristineSeed(pwd);
        const rootkey = bitcore_lib_1.HDPrivateKey.fromSeed(seed);
        const keys = [];
        const allAddrs = await address_1.default.getAddrs(this.walletId);
        for (const utxo of ins) {
            let temp_key;
            for (const type in allAddrs) {
                for (const addrObj of allAddrs[type]) {
                    if (addrObj.address == utxo.address) {
                        const index = addrObj.index;
                        const changeType = addrObj.changeType;
                        if (index == undefined || changeType == undefined) {
                            const pk = await this.getNoneBIP44PrivateKey(utxo.address, pwd);
                            if (!pk) {
                                console.error('address ' + utxo.address + 'has no private key ');
                            }
                            else {
                                temp_key = pk;
                            }
                        }
                        else {
                            const privateKey = rootkey.derive(`${PATH}/${coinType}'/0'/${changeType}/${index}`).privateKey;
                            temp_key = privateKey.toString('hex');
                        }
                        break;
                    }
                }
            }
            keys.push(temp_key);
        }
        return keys;
    }
    getAuthPrivateKey(pwd, coinType) {
        const seed = this.getPristineSeed(pwd);
        const rootkey = bitcore_lib_1.HDPrivateKey.fromSeed(seed);
        const hdprivateKey = rootkey.derive(`${PATH}/${coinType}'/0'/0/0`).privateKey;
        return hdprivateKey;
    }
    async queryAllBalance() {
        const allAddrs = await storage_1.default.get('walletAddrs');
        const wltInst = wallets_1.default.getActiveWallet();
        const strAddrs = [];
        for (const changeType in allAddrs[wltInst.walletId]) {
            const exstAddrs = allAddrs[wltInst.walletId][changeType];
            for (const addr of exstAddrs) {
                strAddrs.push(addr.address);
            }
        }
        let trans = {};
        try {
            trans = await transaction_1.TranService.queryTransactionsByAddresses(strAddrs, 0, 20);
        }
        catch (e) {
            console.log(JSON.stringify(e));
        }
        const balances = await transaction_1.TranService.queryBalances(strAddrs);
        const utxoAddrs = {}, totalAsset = {};
        const totalAssetArray = [];
        for (const balance of balances) {
            for (const assets of balance.assets) {
                const key = assets.asset;
                if (totalAsset[key] == undefined) {
                    totalAsset[key] = parseFloat(assets.value);
                }
                else {
                    totalAsset[key] += parseFloat(assets.value);
                }
                if (!utxoAddrs[key]) {
                    utxoAddrs[key] = [];
                }
                if (utxoAddrs[key].indexOf(balance.address) == -1) {
                    utxoAddrs[key].push(balance.address);
                }
            }
        }
        for (const key in totalAsset) {
            totalAssetArray.push(key);
        }
        const assetsInfo = await this.getAssetsInfo(totalAssetArray);
        let preAssets = JSON.parse(JSON.stringify(this.assets));
        const preAssetsMap = {};
        preAssets.forEach(pa => {
            if (pa) {
                preAssetsMap[pa.asset] = pa;
            }
        });
        const temp = [];
        for (const asset in totalAsset) {
            const assetInfo = assetsInfo[asset];
            if (assetInfo) {
                assetInfo.balance = totalAsset[asset];
            }
            if (!preAssetsMap[asset]) {
                preAssetsMap[asset] = assetInfo;
            }
            else {
                preAssetsMap[asset].balance = totalAsset[asset];
            }
        }
        for (const asset in preAssetsMap) {
            temp.push(preAssetsMap[asset]);
        }
        preAssets = temp;
        const utxoByKeys = {};
        for (const asset of preAssets) {
            const key = asset.asset;
            if (utxoAddrs[key]) {
                const utxos = await transaction_1.TranService.queryUTXO(utxoAddrs[key], key);
                utxoByKeys[key] = utxos || [];
            }
        }
        await storage_1.default.set(('walletTrans' + wltInst.walletId), trans);
        await storage_1.default.set('walletUTXO' + wltInst.walletId, utxoByKeys);
    }
    async getAssetsInfo(totalAssets) {
        const assetsInfo = {};
        const newAssets = [];
        constant_1.CONSTANT.COINS.forEach(c => {
            if (!assetsInfo[c.asset]) {
                assetsInfo[c.asset] = Object.assign({}, c);
            }
        });
        totalAssets.forEach(i => {
            if (!assetsInfo[i]) {
                newAssets.push(i);
            }
        });
        return assetsInfo;
    }
}
exports.default = Wallet;
//# sourceMappingURL=Wallet.js.map