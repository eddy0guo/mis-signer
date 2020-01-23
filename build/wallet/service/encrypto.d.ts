import * as CryptoJS from 'crypto-js';
export default class EncryptoService {
    constructor();
    static setUUId(): Promise<void>;
    static MD5(text: any): string;
    static scryptHashSync(psw: any): any;
    static sEncrypt(text: any, psw: any): string;
    static sDecrypt(encryptedText: any, psw: any): string;
    static generateSha256(key: any): CryptoJS.WordArray;
}
