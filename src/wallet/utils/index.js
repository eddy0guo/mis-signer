import BigNumber from 'bignumber.js'
import * as moment from 'moment'
import { Address } from '@spinlee/flowjs'
import * as bip39 from "bip39";
import { crypto } from "bitcore-lib";

import { CONSTANT } from "../constant"
import Storage from "../service/storage";

moment.locale('en')
const SATOSHI_BTC = 100000000

// 展示单位与接口单位换算
export const sts2btc = value => {
  if (!value) return value
  return value / SATOSHI_BTC
}
export const btc2sts = value => {
  if (!value) return value
  // validateNumber(value)
  console.log("btc2sts:",value)
  let v = new BigNumber(value.toString())
  return parseInt(v.times(SATOSHI_BTC).toFixed(0))
}

export const getWordlistLanguage = function (text) {
  let reg = new RegExp('[\\u4E00-\\u9FFF]+', 'g')
  return reg.test(text) ? 'chinese_simplified' : 'english'
}

export const getTimeInSection = function (timestamp) {
  timestamp *= 1000; // 转化毫秒
  let now = new Date()
  let now_timestamp = now.getTime()
  let today = moment()
    .startOf('day')
    .toDate()
    .getTime()
  let time = moment(timestamp)
  let dist = now.getTime() - timestamp
  let result = ''
  if (!time.isSame(now, 'year')) {
    result = time.format('YYYY-MM-DD HH:mm')
  } else if (dist <= 86400000) {
    if (time.isSame(now, 'day')) {
      result = time.format('HH:mm')
    } else {
      result = time.calendar()
    }
  } else {
    result = time.format('MM-DD HH:mm')
  }
  return result
}

export const checkContractAddress = function (addr, isTestnet = true) {
  return Address.IsPayToContractHash(addr)
}

export const validateMnemonic = function (mnemonic) {
  let lang = CONSTANT.MNEMONICLANGUAGES;
  let valid = false;
  for (let i = 0; i < lang.length; i++) {
    const wordlist = bip39.wordlists[lang[i]];
    valid = bip39.validateMnemonic(mnemonic, wordlist);
    if (valid) {
      break;
    }
  }
  return valid;
};

export const md5 = function (str) {

}


export function signature(pk, message) {
  const hashbuf = crypto.Hash.sha256sha256(new Buffer(message));
  return crypto.ECDSA.sign(hashbuf, pk).toBuffer().toString('base64');
}

export async function getWalletAddr() {
  const walletId = await Storage.get("activeWltId");
  const addresses = await Storage.get("walletAddrs");
  const { address } = addresses[walletId][0][0];
  return address;
}

export async function getWalletPubKey() {
  const walletId = await Storage.get("activeWltId");
  const pubKeys = await Storage.getPubKeys();
  const { pubKey } = pubKeys[walletId][0][0];
  return pubKey;
}

export function isArrayType(type) {
  var paramTypeArray = new RegExp(/^(.*)\[([0-9]*)\]$/);
  return paramTypeArray.test(type);
}

export function callParamsConvert(type, value) {
  let result;
  switch (type) {
    /*    case 'address':
          let data = encoding.Base58.decode(value);
          //remove vertion and checksum bytes
          data = data.slice(1, data.length - 4);

          result = '0x' + toHexString(data);
          break;*/
    case 'bool':
      if (value == '0' || value == 'false') {
        result = 0;
      } else {
        result = 1;
      }
      break;
    default:
      result = value;
      break;
  }
  return result;
}