import BigNumber from 'bignumber.js';
import * as moment from 'moment';
import * as bip39 from 'bip39';

import { CONSTANT } from '../constant';
import Storage from '../service/storage';

moment.locale('en');
const SATOSHI_BTC = 100000000;

// 展示单位与接口单位换算
export const sts2btc = value => {
  if (!value) return value;
  return value / SATOSHI_BTC;
};
export const btc2sts = value => {
  if (!value) return value;
  const v = new BigNumber(value.toString());
  return v.times(SATOSHI_BTC).toFixed(0);
};

export function getWordlistLanguage (text) {
  const reg = new RegExp('[\\u4E00-\\u9FFF]+', 'g');
  return reg.test(text) ? 'chinese_simplified' : 'english';
};

export function validateMnemonic (mnemonic) {
  const lang = CONSTANT.MNEMONICLANGUAGES;
  let valid = false;
  for (const element of lang) {
    const wordlist = bip39.wordlists[element];
    valid = bip39.validateMnemonic(mnemonic, wordlist);
    if (valid) {
      break;
    }
  }
  return valid;
};

export async function getWalletPubKey() {
  const walletId = await Storage.get('activeWltId');
  const pubKeys = await Storage.getPubKeys();
  const { pubKey } = pubKeys[walletId as string][0][0];
  return pubKey;
}

export function isArrayType(type) {
  const paramTypeArray = new RegExp(/^(.*)\[([0-9]*)\]$/);
  return paramTypeArray.test(type);
}

export function callParamsConvert(type, value) {
  let result;
  switch (type) {
    case 'bool':
      if (value === '0' || value === 'false') {
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