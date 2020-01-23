import bip39 from 'bip39';
import { HDPrivateKey, crypto } from 'bitcore-lib';
import EncryptoService from '../service/encrypto';
import { CONSTANT } from '../constant';

import Storage from '../service/storage';
import Wallets from '../service/wallets';

import { getWordlistLanguage } from '../utils';
// import Store from '../store';
import AddressService from '../service/address';
import { TranService } from '../service/transaction';

const PATH = 'm/44\'';
const PATH_FOR_ID = 'm/6\'/10003\'/0\'/0/0';

export default class Wallet {
  // 钱包数据分四部分：此文件只保存基本 info ; 另外3个为 address , sendTransaction , UTXO

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
    this.assets = CONSTANT.COINS;
    this.loadingInstance;
  }

  async create(config) {
    const {
      walletName,
      lang,
      mnemonicLength = 12,
      pwd,
    } = config;
    this.name = walletName;
    this.lang = CONSTANT.WordListNameDict[lang];
    const mnemonic = this.generateMnemonic(mnemonicLength, pwd);
    const seed = this.generateSeedHex(mnemonic);
    this.setWalletId(seed);
    this.setEntropy(
      bip39.mnemonicToEntropy(mnemonic, bip39.wordlists[this.lang]),
      pwd,
    );
    this.setSeed(seed, pwd);
    this.setXpubkey(seed);
  }

  async import(config) {
    let { walletName, type, mnemonic, pwd, seed } = config;
    this.isImported = true;
    this.backupFlag = true;
    this.name = walletName;

    if (type == 'mnemonic') {
      this.lang = getWordlistLanguage(mnemonic);
      seed = this.generateSeedHex(mnemonic);
      this.setWalletId(seed);
      this.setEntropy(
        bip39.mnemonicToEntropy(mnemonic, bip39.wordlists[this.lang]),
        pwd,
      );
    } else {
      this.setWalletId(seed);
    }
    this.setSeed(seed, pwd);
    this.setXpubkey(seed);
    const allWallet = await Storage.get('walletInfo') || {};
    if (allWallet[this.walletId]) {
      delete allWallet[this.walletId];
    }
    // await this.storeWltInfo();
    const allAddrs = await Storage.get('walletAddrs') || {};
    if (!allAddrs[this.walletId]) {
      await AddressService.generateAddress();
    }
  }

  async wake(info) {
    const {
      walletId,
      entropy,
      seed,
      name,
      lang,
      isTestNet = false,
      backupFlag = false,
      isImported = false,
      xpubkeys,
    } = info;
    this.walletId = walletId;
    this.entropy = entropy;
    this.seed = seed;
    this.name = name;
    this.lang = lang;
    this.isTestNet = isTestNet;
    this.backupFlag = backupFlag;
    this.isImported = isImported;
    this.assets = CONSTANT.COINS;

    this.xpubkeys = xpubkeys;
    Wallets.addWallet(this, true);

  }

  generateMnemonic(length) {
    const mnemo = bip39.generateMnemonic(
      length == 24 ? 256 : 128,
      undefined,
      bip39.wordlists[this.lang],
    );
    return mnemo;
  }

  generateSeedHex(mnemonic) {
    return bip39.mnemonicToSeedHex(mnemonic);
  }

  async setXpubkey(seed) {
    const hdPrivateKey = HDPrivateKey.fromSeed(seed).derive(
      `${PATH}/10003'/0'`);
    const xpubkeys = hdPrivateKey.xpubkey;
    this.xpubkeys = xpubkeys;

    const pubKey = hdPrivateKey.derive(0).derive(0).publicKey.toString();
    await this.savePubKey(pubKey);
  }

  async savePubKey(pubKey) {
    const pubKeys = await Storage.getPubKeys() || {};
    const pubKeyArr = [];
    pubKeyArr.push([]);
    pubKeyArr[0].push({ pubKey });

    await Storage.setPubKeys(Object.assign(pubKeys, {
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
    const prvk = HDPrivateKey.fromSeed(seed).derive(PATH_FOR_ID);
    this.walletId = crypto.Hash.sha256ripemd160(prvk.publicKey.toBuffer()).toString('hex');
  }

  async getAddress() {
    const walletId = this.walletId;
    const addresses = await Storage.get('walletAddrs');
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

  // security
  decrypt(text, pwd) {
    let k = CONSTANT.DEFAULT_PASSWORD;
    if (pwd) {
      k = k + this.walletId + EncryptoService.MD5(pwd);
    }
    return EncryptoService.sDecrypt(text, k);
  }

  encrypt(text, pwd) {
    let k = CONSTANT.DEFAULT_PASSWORD;
    if (pwd) {
      k = k + this.walletId + EncryptoService.MD5(pwd);
    }
    return EncryptoService.sEncrypt(text, k);
  }

  // for pick up pristine seed
  getPristineSeed(pwd = '') {
    return this.decrypt(this.seed, pwd);
  }

  getPristineEntropy(pwd = '') {
    return this.decrypt(this.entropy, pwd);
  }

  getMnemonic(pwd) {
    return bip39.entropyToMnemonic(
      this.getPristineEntropy(pwd),
      bip39.wordlists[this.lang],
    );
  }

  // for login
  validatePayPassword(payPassword) {
    const xpub = HDPrivateKey.fromSeed(this.getPristineSeed(payPassword)).derive(
      `${PATH}/10003'/0'`).xpubkey;
    return xpub == this.xpubkeys;
  }
  // TODO  password validate
  async getNoneBIP44PrivateKey(address) {
    const keypairs = await Storage.getKeypair();

    return keypairs[address] || '';
  }

  // for translation
  async getPrivateKeys(coinType, ins = [], pwd) {
    const seed = this.getPristineSeed(pwd);

    const rootkey = HDPrivateKey.fromSeed(seed);
    const keys = [];
    const allAddrs = await AddressService.getAddrs(this.walletId);

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
              } else {
                temp_key = pk;
              }
            } else {
              const privateKey = rootkey.derive(
                `${PATH}/${coinType}'/0'/${changeType}/${index}`,
              ).privateKey;
              //  const privkeyStr =privateKey.bn.toBuffer({ size: 32 });
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
    const rootkey = HDPrivateKey.fromSeed(seed);
    const hdprivateKey = rootkey.derive(
      `${PATH}/${coinType}'/0'/0/0`,
    ).privateKey;
    return hdprivateKey;
  }

  async queryAllBalance() {
    const allAddrs = await Storage.get('walletAddrs');
    const wltInst = Wallets.getActiveWallet();
    const strAddrs = [];
    for (const changeType in allAddrs[wltInst.walletId]) {
      const exstAddrs = allAddrs[wltInst.walletId][changeType];

      for (const addr of exstAddrs) {
        strAddrs.push(addr.address);
      }
    }

    let trans = {};
    try {
      trans = await TranService.queryTransactionsByAddresses(strAddrs, 0, 20); // ??  这里需要递归查询数量
    } catch (e) {
      console.log(JSON.stringify(e));
    }

    // get balance
    const balances = await TranService.queryBalances(strAddrs);

    // get assets array, asset utxo array
    const utxoAddrs = {},
      totalAsset = {};
    const totalAssetArray = [];

    for (const balance of balances) {
      for (const assets of balance.assets) {
        const key = assets.asset;
        if (totalAsset[key] == undefined) {
          totalAsset[key] = parseFloat(assets.value); // ?? 这里没有做 bignumbers
        } else {
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
      } else {
        preAssetsMap[asset].balance = totalAsset[asset];
      }
    }

    for (const asset in preAssetsMap) {
      temp.push(preAssetsMap[asset]);
    }

    preAssets = temp;

    // wltInst.assets = preAssets;
    // wltInst.storeWltInfo();
    const utxoByKeys = {};
    for (const asset of preAssets) {
      const key = asset.asset;
      if (utxoAddrs[key]) {
        const utxos = await TranService.queryUTXO(utxoAddrs[key], key);
        utxoByKeys[key] = utxos || [];
      }
    }
    await Storage.set(('walletTrans' + wltInst.walletId), trans);
    await Storage.set('walletUTXO' + wltInst.walletId, utxoByKeys);

  }

  async getAssetsInfo(totalAssets) {
    const assetsInfo = {};
    // let assetsInfo = Cache.getAssetInfo();
    const newAssets = [];

    CONSTANT.COINS.forEach(c => {
      if (!assetsInfo[c.asset]) {
        assetsInfo[c.asset] = Object.assign({}, c);
      }
    });

    // find new asset
    totalAssets.forEach(i => {
      if (!assetsInfo[i]) {
        newAssets.push(i);
      }
    });

    return assetsInfo;
  }
}
