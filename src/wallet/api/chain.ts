import {rpc} from '../service/request';
import {child_rpc} from '../service/child_request';

export const chain = {
    // marshalled:   {"jsonrpc":"1.0","method":"addnode","params":["127.0.0.1","remove"],"id":1}

    addnode(params) {
        return rpc('addnode', params);
    },
    // marshalled: {"jsonrpc":"1.0","method":"createrawtransaction","params":[type,[{"txid":"123","vout":1}],{"456":0.0123}],"id":1}
    // marshalled: {"jsonrpc":"1.0","method":"createrawtransaction","params":[type,[{"txid":"123","vout":1}],{"456":0.0123},12312333333],"id":1}
    createrawtransaction(params) {
        return rpc('createrawtransaction', params);
    },

    // marshalled:   {"jsonrpc":"1.0","method":"asimov_decodeRawTransaction","params":["123"],"id":1},
    decoderawtransaction(params, network?) {
        return network === 'child_poa' ?  child_rpc('asimov_decodeRawTransaction', params) : rpc('asimov_decodeRawTransaction', params);
    },

	getbestblock(params?) {
        return child_rpc('asimov_getBestBlock', params);
    },

    // marshalled:   {"jsonrpc":"1.0","method":"decodescript","params":["00"],"id":1},
    decodescript(params) {
        return rpc('decodescript', params);
    },

    // marshalled:   {"jsonrpc":"1.0","method":"getaddednodeinfo","params":[true],"id":1}
    // marshalled: {"jsonrpc":"1.0","method":"getaddednodeinfo","params":[true,"127.0.0.1"],"id":1}
    getaddednodeinfo(params) {
        return rpc('getaddednodeinfo', params);
    },

    // marshalled:   {"jsonrpc":"1.0","method":"getbestblockhash","params":[],"id":1}
    getbestblockhash(params) {
        return rpc('getbestblockhash', params);
    },

    // marshalled: {"jsonrpc":"1.0","method":"getblock","params":["123"],"id":1}
    // marshalled: {"jsonrpc":"1.0","method":"getblock","params":["123",true],"id":1}
    // marshalled: {"jsonrpc":"1.0","method":"getblock","params":["123",true,true],"id":1}
    getrecentblocklist(params) {
        return rpc('getrecentblocklist', params);
    },

    // marshalled: {"jsonrpc":"1.0","method":"getblock","params":["123"],"id":1}
    // marshalled: {"jsonrpc":"1.0","method":"getblock","params":["123",true],"id":1}
    // marshalled: {"jsonrpc":"1.0","method":"getblock","params":["123",true,true],"id":1}
    getblock(params) {
        return rpc('getblock', params);
    },
    // marshalled: {"jsonrpc":"1.0","method":"getblocklist","params":[],"id":1}
    getblocklist(params) {
        return rpc('getblocklist', params);
    },

    // 区块链信息
    // marshalled:   {"jsonrpc":"1.0","method":"getblockchaininfo","params":[],"id":1}
    getblockchaininfo(params?, network?) {

        return network === 'child_poa' ?  child_rpc('asimov_getBlockChainInfo', params) : rpc('asimov_getBlockChainInfo', params);
    },

    // marshalled:   {"jsonrpc":"1.0","method":"getblockcount","params":[],"id":1}
    getblockcount(params) {
        return rpc('getblockcount', params);
    },

    // marshalled:   {"jsonrpc":"1.0","method":"getblockhash","params":[123],"id":1}
    getblockhash(params) {
        return rpc('getblockhash', params);
    },
    // marshalled: {"jsonrpc":"1.0","method":"getblockheader","params":["123"],"id":1},
    getblockheader(params) {
        return rpc('getblockheader', params);
    },

    // marshalled:   {"jsonrpc":"1.0","method":"getblocktemplate","params":[],"id":1},
    // marshalled: {"jsonrpc":"1.0","method":"getblocktemplate","params":[{"mode":"template","capabilities":["longpoll","coinbasetxn"]}],"id":1},
    // marshalled: {"jsonrpc":"1.0","method":"getblocktemplate","params":[{"mode":"template","capabilities":["longpoll","coinbasetxn"],"sigoplimit":500,"sizelimit":100000000,"maxversion":2}],"id":1},
    // marshalled: {"jsonrpc":"1.0","method":"getblocktemplate","params":[{"mode":"template","capabilities":["longpoll","coinbasetxn"],"sigoplimit":true,"sizelimit":100000000,"maxversion":2}],"id":1},
    getblocktemplate(params) {
        return rpc('getblocktemplate', params);
    },

    // marshalled: {"jsonrpc":"1.0","method":"getcfilter","params":["123",0],"id":1},
    getcfilter(params) {
        return rpc('getcfilter', params);
    },

    // marshalled: {"jsonrpc":"1.0","method":"getcfilterheader","params":["123",0],"id":1},
    getcfilterheader(params) {
        return rpc('getcfilterheader', params);
    },

    // marshalled:   {"jsonrpc":"1.0","method":"getchaintips","params":[],"id":1},
    getchaintips(params) {
        return rpc('getchaintips', params);
    },

    // marshalled:   {"jsonrpc":"1.0","method":"getconnectioncount","params":[],"id":1},
    getconnectioncount(params) {
        return rpc('getconnectioncount', params);
    },

    // marshalled:   {"jsonrpc":"1.0","method":"getdifficulty","params":[],"id":1},
    getdifficulty(params) {
        return rpc('getdifficulty', params);
    },

    // marshalled:   {"jsonrpc":"1.0","method":"getgenerate","params":[],"id":1},
    getgenerate(params) {
        return rpc('getgenerate', params);
    },

    // marshalled:   {"jsonrpc":"1.0","method":"gethashespersec","params":[],"id":1},
    gethashespersec(params) {
        return rpc('gethashespersec', params);
    },
    // 钱包信息
    // marshalled:   {"jsonrpc":"1.0","method":"getinfo","params":[],"id":1},
    getinfo(params) {
        return rpc('getinfo', params);
    },

    // marshalled: {"jsonrpc":"1.0","method":"getmempoolentry","params":["txhash"],"id":1},
    getmempoolentry(params) {
        return rpc('getmempoolentry', params);
    },

    // marshalled:   {"jsonrpc":"1.0","method":"getmempoolinfo","params":[],"id":1},
    getmempoolinfo(params) {
        return rpc('getmempoolinfo', params);
    },

    // marshalled:   {"jsonrpc":"1.0","method":"getnetworkinfo","params":[],"id":1},
    getnetworkinfo(params) {
        return rpc('getnetworkinfo', params);
    },

    // marshalled:   {"jsonrpc":"1.0","method":"getnettotals","params":[],"id":1},
    getnettotals(params) {
        return rpc('getnettotals', params);
    },

    // marshalled: {"jsonrpc":"1.0","method":"getnetworkhashps","params":[],"id":1},
    // marshalled: {"jsonrpc":"1.0","method":"getnetworkhashps","params":[200],"id":1},
    // marshalled: {"jsonrpc":"1.0","method":"getnetworkhashps","params":[200,123],"id":1},
    getnetworkhashps(params) {
        return rpc('getnetworkhashps', params);
    },

    // marshalled:   {"jsonrpc":"1.0","method":"getpeerinfo","params":[],"id":1},
    getpeerinfo(params) {
        return rpc('getpeerinfo', params);
    },

    // marshalled: {"jsonrpc":"1.0","method":"getrawmempool","params":[],"id":1},
    // marshalled: {"jsonrpc":"1.0","method":"getrawmempool","params":[false],"id":1},
    getrawmempool(params) {
        return rpc('getrawmempool', params);
    },

    // marshalled: {"jsonrpc":"1.0","method":"asimov_getRawTransaction","params":["123"],"id":1},
    // marshalled: {"jsonrpc":"1.0","method":"asimov_getRawTransaction","params":["123",1],"id":1},
    getrawtransaction(params, network) {
        return network === 'child_poa' ?  child_rpc('asimov_getRawTransaction', params) : rpc('asimov_getRawTransaction', params);
    },

    // marshalled: {"jsonrpc":"1.0","method":"gettxout","params":["123",1],"id":1},
    // marshalled: {"jsonrpc":"1.0","method":"gettxout","params":["123",1,true],"id":1},
    gettxout(params) {
        return rpc('gettxout', params);
    },

    // marshalled: {"jsonrpc":"1.0","method":"gettxoutproof","params":[["123","456"]],"id":1},
    // marshalled: {"jsonrpc":"1.0","method":"gettxoutproof","params":[["123","456"],"000000000000034a7dedef4a161fa058a2d67a173a90155f3a2fe6fc132e0ebf"],"id":1}
    gettxoutproof(params) {
        return rpc('gettxoutproof', params);
    },

    // marshalled:   {"jsonrpc":"1.0","method":"gettxoutsetinfo","params":[],"id":1},
    gettxoutsetinfo(params) {
        return rpc('gettxoutsetinfo', params);
    },

    // marshalled: {"jsonrpc":"1.0","method":"getwork","params":[],"id":1},
    // marshalled: {"jsonrpc":"1.0","method":"getwork","params":["00112233"],"id":1},
    getwork(params) {
        return rpc('getwork', params);
    },

    // marshalled: {"jsonrpc":"1.0","method":"help","params":[],"id":1},
    // marshalled: {"jsonrpc":"1.0","method":"help","params":["getblock"],"id":1},
    help(params) {
        return rpc('help', params);
    },

    // marshalled: {"jsonrpc":"1.0","method":"invalidateblock","params":["123"],"id":1},
    invalidateblock(params) {
        return rpc('invalidateblock', params);
    },

    // marshalled:   {"jsonrpc":"1.0","method":"ping","params":[],"id":1},
    ping(params) {
        return rpc('ping', params);
    },

    // marshalled: {"jsonrpc":"1.0","method":"preciousblock","params":["0123"],"id":1},
    preciousblock(params) {
        return rpc('preciousblock', params);
    },

    // marshalled: {"jsonrpc":"1.0","method":"reconsiderblock","params":["123"],"id":1},
    reconsiderblock(params) {
        return rpc('reconsiderblock', params);
    },

    // marshalled: {"jsonrpc":"1.0","method":"setgenerate","params":[true],"id":1},
    // marshalled: {"jsonrpc":"1.0","method":"setgenerate","params":[true,6],"id":1},
    setgenerate(params) {
        return rpc('setgenerate', params);
    },

    // marshalled:   {"jsonrpc":"1.0","method":"stop","params":[],"id":1},
    stop(params) {
        return rpc('stop', params);
    },

    // marshalled: {"jsonrpc":"1.0","method":"submitblock","params":["112233"],"id":1},
    // marshalled: {"jsonrpc":"1.0","method":"submitblock","params":["112233",{"workid":"12345"}],"id":1},
    submitblock(params) {
        return rpc('submitblock', params);
    },

    // marshalled:   {"jsonrpc":"1.0","method":"uptime","params":[],"id":1},
    uptime(params) {
        return rpc('uptime', params);
    },

    // marshalled: {"jsonrpc":"1.0","method":"validateaddress","params":["1Address"],"id":1},
    validateaddress(params) {
        return rpc('validateaddress', params);
    },

    // marshalled: {"jsonrpc":"1.0","method":"verifychain","params":[],"id":1},
    // marshalled: {"jsonrpc":"1.0","method":"verifychain","params":[2],"id":1},
    // marshalled: {"jsonrpc":"1.0","method":"verifychain","params":[2,500],"id":1},
    verifychain(params) {
        return rpc('verifychain', params);
    },

    // marshalled: {"jsonrpc":"1.0","method":"verifymessage","params":["1Address","301234","test"],"id":1},
    verifymessage(params) {
        return rpc('verifymessage', params);
    },

    // marshalled: {"jsonrpc":"1.0","method":"verifytxoutproof","params":["test"],"id":1},
    verifytxoutproof(params) {
        return rpc('verifytxoutproof', params);
    },

    listsinceblock(params) {
        return rpc('listsinceblock', params);
    },
    // marshalled: {"jsonrpc":"1.0","method":"sendfrom","params":[],"id":1},
    sendfrom(params) {
        return rpc('sendfrom', params);
    },
    // marshalled: {"jsonrpc":"1.0","method":"signrawtransaction","params":[],"id":1},
    signrawtransaction(params) {
        return rpc('signrawtransaction', params);
    },
    // marshalled: {"jsonrpc":"1.0","method":"getcoinvalue","params":[1],"id":1},
    getcoinvalue(params) {
        return rpc('getcoinvalue', params);
    },
    // marshalled: {"jsonrpc":"1.0","method":"getassetvalue","params":['123'],"id":1},
    getassetvalue(params) {
        return rpc('getassetvalue', params);
    },
    // marshalled: {"jsonrpc":"1.0","method":"getallcoinvalues","params":[],"id":1},
    getallcoinvalues(params) {
        return rpc('getallcoinvalues', params);
    },
    // marshalled: {"jsonrpc":"1.0","method":"signrawtransaction","params":[],"id":1},
    getallassetvalues(params) {
        return rpc('signrawtransaction', params);
    },
    // marshalled: {"jsonrpc":"1.0","method":"asimov_searchRawTransactions","params":["1Address"],"id":1},
    // marshalled: {"jsonrpc":"1.0","method":"asimov_searchRawTransactions","params":["1Address",0],"id":1},
    // marshalled: {"jsonrpc":"1.0","method":"asimov_searchRawTransactions","params":["1Address",0,5],"id":1},
    // marshalled: {"jsonrpc":"1.0","method":"asimov_searchRawTransactions","params":    ["1Address",0,5,10],"id":1},
    // marshalled: {"jsonrpc":"1.0","method":"asimov_searchRawTransactions","params":["1Address",0,5,10,1],"id":1},
    // marshalled: {"jsonrpc":"1.0","method":"asimov_searchRawTransactions","params":["1Address",0,5,10,1,true],"id":1},
    // marshalled: {"jsonrpc":"1.0","method":"asimov_searchRawTransactions","params":["1Address",0,5,10,1,true,["1Address"]],"id":1},
    // address string, verbose bool, skip int, count int, vinExtra bool, reverse bool, filterAddress []string
    searchrawtransactions(params, network?) {
        return network === 'child_poa' ?  child_rpc('asimov_searchRawTransactions', params) : rpc('asimov_searchRawTransactions', params);
    },

    searchrawtransactionsbyaddrs(addrs, network?) {
        return network === 'child_poa' ?  child_rpc('asimov_searchAllRawTransactions', [addrs, true, true, false]) : rpc('asimov_searchAllRawTransactions', [addrs, true, true, false]);
    },

    // marshalled: {"jsonrpc":"1.0","method":"asimov_sendRawTransaction","params":["1122"],"id":1},
    // marshalled: {"jsonrpc":"1.0","method":"asimov_sendRawTransaction","params":["1122",false],"id":1},
    sendrawtransaction(params, network?: string|undefined): Promise<string> {
        // console.log("sendrawtransaction:",params)
        return network === 'child_poa' ?  child_rpc('asimov_sendRawTransaction', params) : rpc('asimov_sendRawTransaction', params);
    },
    getmempooltransactions(params, network) {
        return network === 'child_poa' ?  child_rpc('asimov_getMempoolTransactions', params) : rpc('asimov_getMempoolTransactions', params);
    },
    calculatecontractaddress(params, network) {
        return network === 'child_poa' ?  child_rpc('asimov_calculateContractAddress', params) : rpc('asimov_calculateContractAddress', params);
    },
    getcontractaddressesbyassets(params, network) {
        return network === 'child_poa' ?  child_rpc('asimov_getContractAddressesByAssets', params) : rpc('asimov_getContractAddressesByAssets', params);
    },
    // callerAddress string, contractAddress string, data string, name string, abi string
    callreadonlyfunction(params, network?) {
        // console.log("callreadonlyfunction:",params)
        return network === 'child_poa' ?  child_rpc('asimov_callReadOnlyFunction', params) : rpc('asimov_callReadOnlyFunction', params);
    },
    gettransactionsbyaddresses(params, network?) {
        return network === 'child_poa' ?  child_rpc('asimov_getTransactionsByAddresses', params) : rpc('asimov_getTransactionsByAddresses', params);
    },
};
