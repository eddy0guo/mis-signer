"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bignumber_js_1 = require("bignumber.js");
const moment = require("moment");
const asimovjs_1 = require("@asimovdev/asimovjs");
const bip39 = require("bip39");
const bitcore_lib_1 = require("bitcore-lib");
const constant_1 = require("../constant");
const storage_1 = require("../service/storage");
moment.locale('en');
const SATOSHI_BTC = 100000000;
exports.sts2btc = value => {
    if (!value)
        return value;
    return value / SATOSHI_BTC;
};
exports.btc2sts = value => {
    if (!value)
        return value;
    const v = new bignumber_js_1.default(value.toString());
    return parseInt(v.times(SATOSHI_BTC).toFixed(0));
};
exports.getWordlistLanguage = function (text) {
    const reg = new RegExp('[\\u4E00-\\u9FFF]+', 'g');
    return reg.test(text) ? 'chinese_simplified' : 'english';
};
exports.getTimeInSection = function (timestamp) {
    timestamp *= 1000;
    const now = new Date();
    const time = moment(timestamp);
    const dist = now.getTime() - timestamp;
    let result = '';
    if (!time.isSame(now, 'year')) {
        result = time.format('YYYY-MM-DD HH:mm');
    }
    else if (dist <= 86400000) {
        if (time.isSame(now, 'day')) {
            result = time.format('HH:mm');
        }
        else {
            result = time.calendar();
        }
    }
    else {
        result = time.format('MM-DD HH:mm');
    }
    return result;
};
exports.checkContractAddress = function (addr) {
    return asimovjs_1.Address.IsPayToContractHash(addr);
};
exports.validateMnemonic = function (mnemonic) {
    const lang = constant_1.CONSTANT.MNEMONICLANGUAGES;
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
function signature(pk, message) {
    const hashbuf = bitcore_lib_1.crypto.Hash.sha256sha256(new Buffer(message));
    return bitcore_lib_1.crypto.ECDSA.sign(hashbuf, pk).toBuffer().toString('base64');
}
exports.signature = signature;
async function getWalletAddr() {
    const walletId = await storage_1.default.get('activeWltId');
    const addresses = await storage_1.default.get('walletAddrs');
    const { address } = addresses[walletId][0][0];
    return address;
}
exports.getWalletAddr = getWalletAddr;
async function getWalletPubKey() {
    const walletId = await storage_1.default.get('activeWltId');
    const pubKeys = await storage_1.default.getPubKeys();
    const { pubKey } = pubKeys[walletId][0][0];
    return pubKey;
}
exports.getWalletPubKey = getWalletPubKey;
function isArrayType(type) {
    const paramTypeArray = new RegExp(/^(.*)\[([0-9]*)\]$/);
    return paramTypeArray.test(type);
}
exports.isArrayType = isArrayType;
function callParamsConvert(type, value) {
    let result;
    switch (type) {
        case 'bool':
            if (value == '0' || value == 'false') {
                result = 0;
            }
            else {
                result = 1;
            }
            break;
        default:
            result = value;
            break;
    }
    return result;
}
exports.callParamsConvert = callParamsConvert;
//# sourceMappingURL=index.js.map