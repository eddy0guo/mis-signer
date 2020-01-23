export default class AddressService {
    static addKeypair(pkStr: any): Promise<any>;
    static removeKeypair(address: any): Promise<any>;
    static generateAddress(num: any, changeType: any, coinType: any): Promise<any[]>;
    static getAddrs(walletId: any): Promise<any>;
}
