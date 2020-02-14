import * as CryptoJS from 'crypto-js';

import scrypt from 'scryptsy';
import { CONSTANT } from '../constant';
import Storage from './storage';
import * as uuidv1 from 'uuid/v1';

const sha256 = CryptoJS.SHA256;
const OPTIONDEIV = '1231231231231231';
const DEFAULT_IV = CryptoJS.enc.Hex.parse(OPTIONDEIV);
const encryptOptions = {
  iv: CryptoJS.enc.Utf8.parse(OPTIONDEIV),
  mode: CryptoJS.mode.CBC,
  padding: CryptoJS.pad.NoPadding,
};

export default class EncryptoService {
  static uuid;
  constructor() {
    EncryptoService.uuid = CONSTANT.DEFAULT_SALT;
  }

  static async setUUId() {
    let uuid = await Storage.get('wallet-uuid');
    if (!uuid) {
      uuid = uuidv1();
      await Storage.set('wallet-uuid', uuid);
    }
    this.uuid = uuid;
    const iv = CryptoJS.SHA256(this.uuid + OPTIONDEIV).toString();
    encryptOptions.iv = CryptoJS.enc.Utf8.parse(iv.substring(0, 16));
  }

  static MD5(text) {
    return CryptoJS.MD5(text).toString();
  }

  static scryptHashSync(psw) {
    const buffer = scrypt(psw, this.uuid, Math.pow(2, 11), 8, 1, 512);
    const hexResult = buffer.toString('hex');
    return CryptoJS.enc.Hex.parse(hexResult);
  }

  static encodePassword(password: string) {
    const encoded256 = sha256(password);
    const substr = encoded256.toString().substr(0, 16);
    return CryptoJS.enc.Hex.parse(substr);
  }

  static sEncrypt(word: string, password: string) {
    // let srcs = CryptoJS.enc.Hex.parse(word);
    const srcs = word;
    const secret = EncryptoService.encodePassword(password);

    const encrypted = CryptoJS.AES.encrypt(srcs, secret, {
      iv: DEFAULT_IV,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return encrypted.ciphertext.toString().toUpperCase();
  }

  static sDecrypt(word: string, password: string) {
    const encryptedHex = CryptoJS.enc.Hex.parse(word);
    const srcs = CryptoJS.enc.Base64.stringify(encryptedHex);
    const secret = EncryptoService.encodePassword(password);

    const decrypt = CryptoJS.AES.decrypt(srcs, secret, {
      iv: DEFAULT_IV,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const decryptedStr = decrypt.toString(CryptoJS.enc.Utf8);
    return decryptedStr.toString();
  }

  static generateSha256(key) {
    return CryptoJS.SHA256(key);
  }
}

EncryptoService.setUUId();
