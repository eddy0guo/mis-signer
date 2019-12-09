
import CryptoJS from "crypto-js";
import scrypt from "scryptsy";
import { CONSTANT } from "../constant";
import Storage from "./storage";
const uuidv1 = require('uuid/v1');

const OPTIONDEIV = "1231231231231231";
let encryptOptions = {
    iv: CryptoJS.enc.Utf8.parse(OPTIONDEIV),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.NoPadding
};

export default class EncryptoService {
    static uuid = CONSTANT.DEFAULT_SALT;

    static async setUUId(){
        let uuid = await Storage.get('wallet-uuid');
        if (!uuid){
            uuid = uuidv1();
            await Storage.set('wallet-uuid', uuid);
        }
        this.uuid = uuid;
        let iv = CryptoJS.SHA256(this.uuid + OPTIONDEIV).toString();
        encryptOptions.iv = CryptoJS.enc.Utf8.parse(iv.substring(0, 16));
    }

    static MD5(text) {
        return CryptoJS.MD5(text).toString();
    }

    static scryptHashSync(psw) {
        let buffer = scrypt(psw, this.uuid, Math.pow(2, 11), 8, 1, 512);
        let hexResult = buffer.toString("hex");
        return CryptoJS.enc.Hex.parse(hexResult);
    }

    static sEncrypt(text, psw) {
        let pswHash = CryptoJS.SHA256(psw).toString();
        let key = this.scryptHashSync(pswHash);
        let hexText = CryptoJS.enc.Hex.parse(text);
        let encrypted = CryptoJS.AES.encrypt(hexText, key, encryptOptions);
        let encryptedText = encrypted.ciphertext.toString(CryptoJS.enc.Hex);
        return encryptedText;
    }

    static sDecrypt(encryptedText, psw) {
        let pswHash = CryptoJS.SHA256(psw).toString();
        let key = this.scryptHashSync(pswHash);
        let hexText = CryptoJS.lib.CipherParams.create({ ciphertext: CryptoJS.enc.Hex.parse(encryptedText) });
        let decrypted = CryptoJS.AES.decrypt(hexText, key, encryptOptions);
        let decryptedStr = decrypted.toString(CryptoJS.enc.Hex);
        return decryptedStr;
    }

    static generateSha256(key) {
        return CryptoJS.SHA256(key);
    }
}

EncryptoService.setUUId();
