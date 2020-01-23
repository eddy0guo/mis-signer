"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request_1 = require("../service/request");
const child_request_1 = require("../service/child_request");
exports.chain = {
    addnode(params) {
        return request_1.rpc('addnode', params);
    },
    createrawtransaction(params) {
        return request_1.rpc('createrawtransaction', params);
    },
    decoderawtransaction(params, network) {
        return network == 'child_poa' ? child_request_1.child_rpc('asimov_decodeRawTransaction', params) : request_1.rpc('asimov_decodeRawTransaction', params);
    },
    getbestblock(params) {
        return child_request_1.child_rpc('asimov_getBestBlock', params);
    },
    decodescript(params) {
        return request_1.rpc('decodescript', params);
    },
    getaddednodeinfo(params) {
        return request_1.rpc('getaddednodeinfo', params);
    },
    getbestblockhash(params) {
        return request_1.rpc('getbestblockhash', params);
    },
    getrecentblocklist(params) {
        return request_1.rpc('getrecentblocklist', params);
    },
    getblock(params) {
        return request_1.rpc('getblock', params);
    },
    getblocklist(params) {
        return request_1.rpc('getblocklist', params);
    },
    getblockchaininfo(params, network) {
        return network == 'child_poa' ? child_request_1.child_rpc('asimov_getBlockChainInfo', params) : request_1.rpc('asimov_getBlockChainInfo', params);
    },
    getblockcount(params) {
        return request_1.rpc('getblockcount', params);
    },
    getblockhash(params) {
        return request_1.rpc('getblockhash', params);
    },
    getblockheader(params) {
        return request_1.rpc('getblockheader', params);
    },
    getblocktemplate(params) {
        return request_1.rpc('getblocktemplate', params);
    },
    getcfilter(params) {
        return request_1.rpc('getcfilter', params);
    },
    getcfilterheader(params) {
        return request_1.rpc('getcfilterheader', params);
    },
    getchaintips(params) {
        return request_1.rpc('getchaintips', params);
    },
    getconnectioncount(params) {
        return request_1.rpc('getconnectioncount', params);
    },
    getdifficulty(params) {
        return request_1.rpc('getdifficulty', params);
    },
    getgenerate(params) {
        return request_1.rpc('getgenerate', params);
    },
    gethashespersec(params) {
        return request_1.rpc('gethashespersec', params);
    },
    getinfo(params) {
        return request_1.rpc('getinfo', params);
    },
    getmempoolentry(params) {
        return request_1.rpc('getmempoolentry', params);
    },
    getmempoolinfo(params) {
        return request_1.rpc('getmempoolinfo', params);
    },
    getnetworkinfo(params) {
        return request_1.rpc('getnetworkinfo', params);
    },
    getnettotals(params) {
        return request_1.rpc('getnettotals', params);
    },
    getnetworkhashps(params) {
        return request_1.rpc('getnetworkhashps', params);
    },
    getpeerinfo(params) {
        return request_1.rpc('getpeerinfo', params);
    },
    getrawmempool(params) {
        return request_1.rpc('getrawmempool', params);
    },
    getrawtransaction(params, network) {
        return network == 'child_poa' ? child_request_1.child_rpc('asimov_getRawTransaction', params) : request_1.rpc('asimov_getRawTransaction', params);
    },
    gettxout(params) {
        return request_1.rpc('gettxout', params);
    },
    gettxoutproof(params) {
        return request_1.rpc('gettxoutproof', params);
    },
    gettxoutsetinfo(params) {
        return request_1.rpc('gettxoutsetinfo', params);
    },
    getwork(params) {
        return request_1.rpc('getwork', params);
    },
    help(params) {
        return request_1.rpc('help', params);
    },
    invalidateblock(params) {
        return request_1.rpc('invalidateblock', params);
    },
    ping(params) {
        return request_1.rpc('ping', params);
    },
    preciousblock(params) {
        return request_1.rpc('preciousblock', params);
    },
    reconsiderblock(params) {
        return request_1.rpc('reconsiderblock', params);
    },
    setgenerate(params) {
        return request_1.rpc('setgenerate', params);
    },
    stop(params) {
        return request_1.rpc('stop', params);
    },
    submitblock(params) {
        return request_1.rpc('submitblock', params);
    },
    uptime(params) {
        return request_1.rpc('uptime', params);
    },
    validateaddress(params) {
        return request_1.rpc('validateaddress', params);
    },
    verifychain(params) {
        return request_1.rpc('verifychain', params);
    },
    verifymessage(params) {
        return request_1.rpc('verifymessage', params);
    },
    verifytxoutproof(params) {
        return request_1.rpc('verifytxoutproof', params);
    },
    listsinceblock(params) {
        return request_1.rpc('listsinceblock', params);
    },
    sendfrom(params) {
        return request_1.rpc('sendfrom', params);
    },
    signrawtransaction(params) {
        return request_1.rpc('signrawtransaction', params);
    },
    getcoinvalue(params) {
        return request_1.rpc('getcoinvalue', params);
    },
    getassetvalue(params) {
        return request_1.rpc('getassetvalue', params);
    },
    getallcoinvalues(params) {
        return request_1.rpc('getallcoinvalues', params);
    },
    getallassetvalues(params) {
        return request_1.rpc('signrawtransaction', params);
    },
    searchrawtransactions(params, network) {
        return network == 'child_poa' ? child_request_1.child_rpc('asimov_searchRawTransactions', params) : request_1.rpc('asimov_searchRawTransactions', params);
    },
    searchrawtransactionsbyaddrs(addrs, network) {
        return network == 'child_poa' ? child_request_1.child_rpc('asimov_searchAllRawTransactions', [addrs, true, true, false]) : request_1.rpc('asimov_searchAllRawTransactions', [addrs, true, true, false]);
    },
    sendrawtransaction(params, network) {
        return network == 'child_poa' ? child_request_1.child_rpc('asimov_sendRawTransaction', params) : request_1.rpc('asimov_sendRawTransaction', params);
    },
    getmempooltransactions(params, network) {
        return network == 'child_poa' ? child_request_1.child_rpc('asimov_getMempoolTransactions', params) : request_1.rpc('asimov_getMempoolTransactions', params);
    },
    calculatecontractaddress(params, network) {
        return network == 'child_poa' ? child_request_1.child_rpc('asimov_calculateContractAddress', params) : request_1.rpc('asimov_calculateContractAddress', params);
    },
    getcontractaddressesbyassets(params, network) {
        return network == 'child_poa' ? child_request_1.child_rpc('asimov_getContractAddressesByAssets', params) : request_1.rpc('asimov_getContractAddressesByAssets', params);
    },
    callreadonlyfunction(params, network) {
        return network == 'child_poa' ? child_request_1.child_rpc('asimov_callReadOnlyFunction', params) : request_1.rpc('asimov_callReadOnlyFunction', params);
    },
    gettransactionsbyaddresses(params, network) {
        return network == 'child_poa' ? child_request_1.child_rpc('asimov_getTransactionsByAddresses', params) : request_1.rpc('asimov_getTransactionsByAddresses', params);
    },
};
//# sourceMappingURL=chain.js.map