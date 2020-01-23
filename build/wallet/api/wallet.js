"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request_1 = require("../service/request");
exports.walletRPC = {
    createnewaccount(params) {
        return request_1.rpc('createnewaccount', params);
    },
    dumpwallet(params) {
        return request_1.rpc('dumpwallet', params);
    },
    importaddress(params) {
        return request_1.rpc('importaddress', params);
    },
    importpubkey(params) {
        return request_1.rpc('importpubkey', params);
    },
    renameaccount(params) {
        return request_1.rpc('renameaccount', params);
    },
    importwallet(params) {
        return request_1.rpc('importwallet', params);
    },
    addmultisigaddress(params) {
        return request_1.rpc('addmultisigaddress', params);
    },
    createmultisig(params) {
        return request_1.rpc('createmultisig', params);
    },
    dumpprivkey(params) {
        return request_1.rpc('dumpprivkey', params);
    },
    encryptwallet(params) {
        return request_1.rpc('encryptwallet', params);
    },
    estimatefee(params) {
        return request_1.rpc('estimatefee', params);
    },
    estimatepriority(params) {
        return request_1.rpc('estimatepriority', params);
    },
    getaccount(params) {
        return request_1.rpc('getaccount', params);
    },
    getaccountaddress(params) {
        return request_1.rpc('getaccountaddress', params);
    },
    getaddressesbyaccount(params) {
        return request_1.rpc('getaddressesbyaccount', params);
    },
    getbalance(params) {
        return request_1.rpc('asimov_getBalance', params);
    },
    getbalances(params) {
        return request_1.rpc('asimov_getBalances', params);
    },
    getnewaddress(params) {
        return request_1.rpc('getnewaddress', params);
    },
    getrawchangeaddress(params) {
        return request_1.rpc('getrawchangeaddress', params);
    },
    getreceivedbyaccount(params) {
        return request_1.rpc('getreceivedbyaccount', params);
    },
    getreceivedbyaddress(params) {
        return request_1.rpc('getreceivedbyaddress', params);
    },
    gettransaction(params) {
        return request_1.rpc('gettransaction', params);
    },
    gettransactionlist(params) {
        return request_1.rpc('gettransactionlist', params);
    },
    getutxobyaddress(params) {
        return request_1.rpc('asimov_getUtxoByAddress', params);
    },
    importprivkey(params) {
        return request_1.rpc('importprivkey', params);
    },
    keypoolrefill(params) {
        return request_1.rpc('keypoolrefill', params);
    },
    listaccounts(params) {
        return request_1.rpc('listaccounts', params);
    },
    listaddressgroupings(params) {
        return request_1.rpc('listaddressgroupings', params);
    },
    listlockunspent(params) {
        return request_1.rpc('listlockunspent', params);
    },
    listreceivedbyaccount(params) {
        return request_1.rpc('listreceivedbyaccount', params);
    },
    listreceivedbyaddress(params) {
        return request_1.rpc('listreceivedbyaddress', params);
    },
    listsinceblock(params) {
        return request_1.rpc('listsinceblock', params);
    },
    listtransactions(params) {
        return request_1.rpc('listtransactions', params);
    },
    listunspent(params) {
        return request_1.rpc('listunspent', params);
    },
    lockunspent(params) {
        return request_1.rpc('lockunspent', params);
    },
    move(params) {
        return request_1.rpc('move', params);
    },
    sendfrom(params) {
        return request_1.rpc('sendfrom', params);
    },
    sendmany(params) {
        return request_1.rpc('sendmany', params);
    },
    sendtoaddress(params) {
        return request_1.rpc('sendtoaddress', params);
    },
    setaccount(params) {
        return request_1.rpc('setaccount', params);
    },
    settxfee(params) {
        return request_1.rpc('settxfee', params);
    },
    signmessage(params) {
        return request_1.rpc('signmessage', params);
    },
    signrawtransaction(params) {
        return request_1.rpc('signrawtransaction', params);
    },
    walletlock(params) {
        return request_1.rpc('walletlock', params);
    },
    walletpassphrase(params) {
        return request_1.rpc('walletpassphrase', params);
    },
    walletpassphrasechange(params) {
        return request_1.rpc('walletpassphrasechange', params);
    },
    backupwallet(params) {
        return request_1.rpc('backupwallet', params);
    },
    getwalletinfo(params) {
        return request_1.rpc('getwalletinfo', params);
    },
    getbestblock(params) {
        return request_1.rpc('getbestblock', params);
    },
    getunconfirmedbalance(params) {
        return request_1.rpc('getunconfirmedbalance', params);
    },
    listaddresstransactions(params) {
        return request_1.rpc('listaddresstransactions', params);
    },
    listalltransactions(params) {
        return request_1.rpc('listalltransactions', params);
    },
    recoveraddresses(params) {
        return request_1.rpc('recoveraddresses', params);
    },
    walletislocked(params) {
        return request_1.rpc('walletislocked', params);
    },
};
//# sourceMappingURL=wallet.js.map