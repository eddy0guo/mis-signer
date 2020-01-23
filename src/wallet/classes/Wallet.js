import bip39 from "bip39";
import { HDPrivateKey, crypto } from "bitcore-lib";
import EncryptoService from "../service/encrypto";
import { CONSTANT } from "../constant";

import Storage from '../service/storage';
import Wallets from "../service/wallets";
import to from 'await-to-js';
import { getWordlistLanguage } from "../utils";
// import Store from '../store';
import AddressService from "../service/address";
import { TranService } from "../service/transaction";

const PATH = "m/44'";
const PATH_FOR_ID = "m/6'/10003'/0'/0/0";

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
    // this.showLoading();
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        const {
          walletName,
          lang,
          mnemonicLength = 12,
          pwd
        } = config;
        this.name = walletName;
        this.lang = CONSTANT.WordListNameDict[lang];
        let mnemonic = this.generateMnemonic(mnemonicLength, pwd);
        let seed = this.generateSeedHex(mnemonic);
        this.setWalletId(seed);
        this.setEntropy(
          bip39.mnemonicToEntropy(mnemonic, bip39.wordlists[this.lang]),
          pwd
        );
        this.setSeed(seed, pwd);
        this.setXpubkey(seed);
        // await this.storeWltInfo();
       // await AddressService.generateAddress();
        // this.closeLoading();
        resolve();
      }, 200);
    })
  }

  async import(config) {
    // this.showLoading();
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
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
            pwd
          );
        } else {
          this.setWalletId(seed);
        }
        this.setSeed(seed, pwd);
        this.setXpubkey(seed);
        let allWallet = await Storage.get("walletInfo") || {};
        if (allWallet[this.walletId]) {
          delete allWallet[this.walletId];
        }
        // await this.storeWltInfo();
        let allAddrs = await Storage.get('walletAddrs') || {};
        if (!allAddrs[this.walletId]) {
          await AddressService.generateAddress();
        }
        // Store.dispatch('queryAllBalance');
        // this.closeLoading();
        resolve();
      }, 100)
    })
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
      assets = [],
      xpubkeys
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
    this.initRedux();
    // Store.dispatch('queryAllBalance');
  }

  // async storeWltInfo() {
  //   // 分为三类 storage、redux 、instance
  //   let walletData = this.getInfo();
  //   await Storage.set('walletInfo', {
  //     [this.walletId]: walletData
  //   });
  //   Wallets.addWallet(this, true);
  //   this.initRedux();
  // }

  initRedux() {
    const { walletId, name, lang, isTestNet, backupFlag, isImported } = this;

    Store.dispatch('initWltState', {
      info: {
        walletId,
        name,
        lang,
        isTestNet,
        backupFlag,
        isImported
      },
      assets: this.assets
    })
  }

  generateMnemonic(length) {
    let mnemo = bip39.generateMnemonic(
      length == 24 ? 256 : 128,
      undefined,
      bip39.wordlists[this.lang]
    );
    return mnemo;
  }

  generateSeedHex(mnemonic) {
    return bip39.mnemonicToSeedHex(mnemonic);
  }

  async setXpubkey(seed) {
    let defaultAsset = CONSTANT.DEFAULT_COIN;
    // let xpubkeys = HDPrivateKey.fromSeed(seed).derive(
    //     `${PATH}/${defaultAsset.coinType}'/0'`).xpubkey;
    const hdPrivateKey = HDPrivateKey.fromSeed(seed).derive(
      `${PATH}/10003'/0'`);
    let xpubkeys = hdPrivateKey.xpubkey;
    this.xpubkeys = xpubkeys;

    const pubKey = hdPrivateKey.derive(0).derive(0).publicKey.toString();
    await this.savePubKey(pubKey);
  }

  async savePubKey(pubKey) {
    let pubKeys = await Storage.getPubKeys() || {}
    const pubKeyArr = [];
    pubKeyArr.push([]);
    pubKeyArr[0].push({ pubKey })

    await Storage.setPubKeys(Object.assign(pubKeys, {
      [this.walletId]: pubKeyArr
    }))
  }

  setSeed(seed, pwd = "") {
    this.seed = this.encrypt(seed, pwd);
  }

  setEntropy(entropy, pwd = "") {
    this.entropy = this.encrypt(entropy, pwd);
  }

  setWalletId(seed) {
    let prvk = HDPrivateKey.fromSeed(seed).derive(PATH_FOR_ID);
    this.walletId = crypto.Hash.sha256ripemd160(prvk.publicKey.toBuffer()).toString("hex");
  }

  async getAddress(){
    let walletId = this.walletId;
    let addresses = await Storage.get("walletAddrs");
    return addresses[walletId][0][0].address
  }

  getInfo() {
    let info = {
      walletId: this.walletId,
      entropy: this.entropy,
      seed: this.seed,
      name: this.name,
      lang: this.lang,
      isTestNet: this.isTestNet,
      backupFlag: this.backupFlag,
      isImported: this.isImported,
      assets: this.assets,
      xpubkeys: this.xpubkeys
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
  getPristineSeed(pwd = "") {
    return this.decrypt(this.seed, pwd);
  }

  getPristineEntropy(pwd = "") {
    return this.decrypt(this.entropy, pwd);
  }

  getMnemonic(pwd) {
    return bip39.entropyToMnemonic(
      this.getPristineEntropy(pwd),
      bip39.wordlists[this.lang]
    );
  }

  // for login
  validatePayPassword(payPassword) {
    let defaultAsset = CONSTANT.DEFAULT_COIN;
    // let xpub = HDPrivateKey.fromSeed(this.getPristineSeed(payPassword)).derive(
    //   `${PATH}/${defaultAsset.coinType}'/0'`).xpubkey;
    let xpub = HDPrivateKey.fromSeed(this.getPristineSeed(payPassword)).derive(
      `${PATH}/10003'/0'`).xpubkey;
    return xpub == this.xpubkeys;
  }
  //TODO  password validate
  async getNoneBIP44PrivateKey(address, pwd) {
    let keypairs = await Storage.getKeypair();

    return keypairs[address] || '';
  }

  // for translation
  async getPrivateKeys(coinType, ins = [], pwd) {
    let seed = this.getPristineSeed(pwd);

    let rootkey = HDPrivateKey.fromSeed(seed);
    let keys = [];
    let allAddrs = await AddressService.getAddrs(this.walletId);

    for (let utxo of ins) {
      let temp_key;
      for (let type in allAddrs) {
        for (let addrObj of allAddrs[type]) {
          if (addrObj.address == utxo.address) {
            let index = addrObj.index;
            let changeType = addrObj.changeType;
            if (index == undefined || changeType == undefined) {
              let pk = await this.getNoneBIP44PrivateKey(utxo.address, pwd);
              if (!pk) {
                console.error('address ' + utxo.address + 'has no private key ')
              } else {
                temp_key = pk;
              }
            } else {
              let privateKey = rootkey.derive(
                `${PATH}/${coinType}'/0'/${changeType}/${index}`
              ).privateKey;
              //  const privkeyStr =privateKey.bn.toBuffer({ size: 32 });
              temp_key = privateKey.toString('hex');
            }
            break;
          }
        }
      }

      keys.push(temp_key)
    }
    return keys;
  }

  getAuthPrivateKey(pwd, coinType) {
    const seed = this.getPristineSeed(pwd);
    const rootkey = HDPrivateKey.fromSeed(seed);
    const hdprivateKey = rootkey.derive(
      `${PATH}/${coinType}'/0'/0/0`
    ).privateKey;
    return hdprivateKey
  }

  async queryAllBalance() { 
    let allAddrs = await Storage.get("walletAddrs");
    let wltInst = Wallets.getActiveWallet();
    let sendTrans = [],
      usedAddrs = [],
      strAddrs = [];
    for (let changeType in allAddrs[wltInst.walletId]) {
      let exstAddrs = allAddrs[wltInst.walletId][changeType];

      for (let addr of exstAddrs) {
        strAddrs.push(addr.address);
      }
    }

    // console.log(allAddrs)


    let pureAddrNums = 0;
    let trans = {}
    try {
      trans = await TranService.queryTransactionsByAddresses(strAddrs, 0, 20) // ??  这里需要递归查询数量
    } catch (e) {
      console.log(JSON.stringify(e))
    }

    //get balance
    let balances = await TranService.queryBalances(strAddrs);


    //get assets array, asset utxo array
    let utxoAddrs = {},
      totalAsset = {};
    let totalAssetArray = [];

    for (let balance of balances) {
      for (let assets of balance.assets) {
        let key = assets.asset;
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



    for (let key in totalAsset) {
      totalAssetArray.push(key);
    }

    let assetsInfo = await this.getAssetsInfo(totalAssetArray)


    let preAssets = JSON.parse(JSON.stringify(this.assets));

    let preAssetsMap = {}

    preAssets.forEach(pa => {
      if (pa) {
        preAssetsMap[pa.asset] = pa;
      }

    });

    let temp = [];

    for (let asset in totalAsset) {
      let assetInfo = assetsInfo[asset]

      if (assetInfo) {
        assetInfo.balance = totalAsset[asset];
      }


      if (!preAssetsMap[asset]) {
        preAssetsMap[asset] = assetInfo
      } else {
        preAssetsMap[asset].balance = totalAsset[asset];
      }
    }

    for (let asset in preAssetsMap) {
      temp.push(preAssetsMap[asset]);
    }

    preAssets = temp;

    //wltInst.assets = preAssets;
    // wltInst.storeWltInfo();
    let utxoByKeys = {};
    for (let asset of preAssets) {
      let key = asset.asset;
      if (utxoAddrs[key]) {
        let utxos = await TranService.queryUTXO(utxoAddrs[key], key);
        utxoByKeys[key] = utxos || [];
      }
    }
    await Storage.set(("walletTrans" + wltInst.walletId), trans);
    await Storage.set("walletUTXO" + wltInst.walletId, utxoByKeys);


  }

  async getAssetsInfo(totalAssets) {
    let assetsInfo = {};
    //let assetsInfo = Cache.getAssetInfo();
    let newAssets = [];
  
  
    CONSTANT.COINS.forEach(c => {
      if (!assetsInfo[c.asset]) {
        assetsInfo[c.asset] = Object.assign({}, c);
      }
    });
  
  
    //find new asset
    totalAssets.forEach(i => {
      if (!assetsInfo[i]) {
        newAssets.push(i)
      }
    });
  
    // 暂时屏蔽新资产检测
    let checkNewAssets = false
    if (checkNewAssets && newAssets.length) {
  
      let walletAddrs = await Storage.get("walletAddrs");
      let activeWltId = await Storage.get("activeWltId");
      let addrs = walletAddrs[activeWltId];
      let caller = addrs[0][0].address;
      let contract = new Contract({ abi: CONSTANT.ASSETINFO_ABI })
      let contractAddrs = await chain.getcontractaddressesbyassets([
        newAssets
      ])
  
      for (let i = 0, len = newAssets.length; i < len; i++) {
  
        let asset = newAssets[i];
        let assetIndex = parseInt(asset.slice(16))
        let abiStr = JSON.stringify(CONSTANT.ASSETINFO_ABI);
        let data = contract.encodeCallData(CONSTANT.ASSETINFO_ABI[0], [assetIndex]);
  
        let [res, err] = await to(chain.callreadonlyfunction([caller, contractAddrs[i], data, CONSTANT.ASSETINFO_ABI_NAME, abiStr]));
  
        if (err) {
          assetsInfo[asset] = {
            name: 'UNKNOWN',
            coinSlug: 'UNKNOWN',
            coinName: 'UNKNOWN',
            coinType: 0,
            icon: 'default',
            addressPrefix: '',
            asset: asset,
            unit: 'UNKNOWN',
            balance: 0,
            totalAmount: ''
          }
          console.log('asset ' + asset + ' has no detail info')
        } else {
  
          if (res[0]) {
            assetsInfo[asset] = {
              name: res[3],
              coinSlug: res[3],
              coinName: res[1],
              coinType: 0,
              icon: res[2],
              addressPrefix: res[3] || res[3].toLowerCase(),
              asset: asset,
              unit: res[2],
              balance: 0,
              totalAmount: sts2btc(res[4])
            }
          } else {
            console.log('asset ' + asset + ' has no detail info')
          }
        }
      }
      for (var a in assetsInfo) {
        if (a !== CONSTANT.DEFAULT_ASSET) {
          assetsInfo[a].icon = 'default';
        }
      }
  
    }
    return assetsInfo
  }
}
