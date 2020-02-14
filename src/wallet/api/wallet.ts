import { rpc } from '../service/request';

export const walletRPC = {
  // marshalled: `{"jsonrpc":"1.0","method":"createnewaccount","params":["acct"],"id":1}`,
  createnewaccount(params) {
    return rpc('createnewaccount', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"dumpwallet","params":["filename"],"id":1}`,
  dumpwallet(params) {
    return rpc('dumpwallet', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"importaddress","params":["1Address"],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"importaddress","params":["1Address",false],"id":1}`,
  importaddress(params) {
    return rpc('importaddress', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"importpubkey","params":["031234"],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"importpubkey","params":["031234",false],"id":1}`,
  importpubkey(params) {
    return rpc('importpubkey', params);
  },

  // marshalled: `{"jsonrpc":"1.0","method":"renameaccount","params":["oldacct","newacct"],"id":1}`,
  renameaccount(params) {
    return rpc('renameaccount', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"importwallet","params":["filename"],"id":1}`,
  importwallet(params) {
    return rpc('importwallet', params);
  },
  // 钱包命令
  // marshalled: `{"jsonrpc":"1.0","method":"addmultisigaddress","params":[2,["031234","035678"]],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"addmultisigaddress","params":[2,["031234","035678"],"test"],"id":1}`,
  addmultisigaddress(params) {
    return rpc('addmultisigaddress', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"createmultisig","params":[2,["031234","035678"]],"id":1}`,
  createmultisig(params) {
    return rpc('createmultisig', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"dumpprivkey","params":["1Address"],"id":1}`,
  dumpprivkey(params) {
    return rpc('dumpprivkey', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"encryptwallet","params":["pass"],"id":1}`,
  encryptwallet(params) {
    return rpc('encryptwallet', params);
  },

  // marshalled: `{"jsonrpc":"1.0","method":"estimatefee","params":[6],"id":1}`,
  estimatefee(params) {
    return rpc('estimatefee', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"estimatepriority","params":[6],"id":1}`,
  estimatepriority(params) {
    return rpc('estimatepriority', params);
  },

  // marshalled: `{"jsonrpc":"1.0","method":"getaccount","params":["1Address"],"id":1}`,
  getaccount(params) {
    return rpc('getaccount', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"getaccountaddress","params":["acct"],"id":1}`,
  getaccountaddress(params) {
    return rpc('getaccountaddress', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"getaddressesbyaccount","params":["acct"],"id":1}`,
  getaddressesbyaccount(params) {
    return rpc('getaddressesbyaccount', params);
  },

  getbalance(params) {
    return rpc('asimov_getBalance', params);
  },
  getbalances(params) {
    return rpc('asimov_getBalances', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"getnewaddress","params":[],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"getnewaddress","params":["acct"],"id":1}`,
  getnewaddress(params) {
    return rpc('getnewaddress', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"getrawchangeaddress","params":[],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"getrawchangeaddress","params":["acct"],"id":1}`,
  getrawchangeaddress(params) {
    return rpc('getrawchangeaddress', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"getreceivedbyaccount","params":["acct"],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"getreceivedbyaccount","params":["acct",6],"id":1}`,
  getreceivedbyaccount(params) {
    return rpc('getreceivedbyaccount', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"getreceivedbyaddress","params":["1Address"],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"getreceivedbyaddress","params":["1Address",6],"id":1}`,
  getreceivedbyaddress(params) {
    return rpc('getreceivedbyaddress', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"gettransaction","params":["123"],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"gettransaction","params":["123",true],"id":1}`,
  gettransaction(params) {
    return rpc('gettransaction', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"gettransactionlist","params":[],"id":1}`,
  gettransactionlist(params) {
    return rpc('gettransactionlist', params);
  },
  getutxobyaddress(params){
    return rpc('asimov_getUtxoByAddress', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"importprivkey","params":["abc"],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"importprivkey","params":["abc","label"],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"importprivkey","params":["abc","label",false],"id":1}`,
  importprivkey(params) {
    return rpc('importprivkey', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"keypoolrefill","params":[],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"keypoolrefill","params":[200],"id":1}`,
  keypoolrefill(params) {
    return rpc('keypoolrefill', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"listaccounts","params":[],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"listaccounts","params":[6],"id":1}`,
  listaccounts(params) {
    return rpc('listaccounts', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"listaddressgroupings","params":[],"id":1}`,
  listaddressgroupings(params) {
    return rpc('listaddressgroupings', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"listlockunspent","params":[],"id":1}`,
  listlockunspent(params) {
    return rpc('listlockunspent', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"listreceivedbyaccount","params":[],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"listreceivedbyaccount","params":[6],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"listreceivedbyaccount","params":[6,true],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"listreceivedbyaccount","params":[6,true,false],"id":1}`,
  listreceivedbyaccount(params) {
    return rpc('listreceivedbyaccount', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"listreceivedbyaddress","params":[],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"listreceivedbyaddress","params":[6],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"listreceivedbyaddress","params":[6,true],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"listreceivedbyaddress","params":[6,true,false],"id":1}`,
  listreceivedbyaddress(params) {
    return rpc('listreceivedbyaddress', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"listsinceblock","params":[],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"listsinceblock","params":["123"],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"listsinceblock","params":["123",6],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"listsinceblock","params":["123",6,true],"id":1}`,
  listsinceblock(params) {
    return rpc('listsinceblock', params);
  },

  // marshalled: `{"jsonrpc":"1.0","method":"listtransactions","params":[],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"listtransactions","params":["acct"],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"listtransactions","params":["acct",20],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"listtransactions","params":["acct",20,1],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"listtransactions","params":["acct",20,1,true],"id":1}`,
  listtransactions(params) {
    return rpc('listtransactions', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"listunspent","params":[],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"listunspent","params":[6],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"listunspent","params":[6,100],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"listunspent","params":[6,100,["1Address","1Address2"]],"id":1}`,
  listunspent(params) {
    return rpc('listunspent', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"lockunspent","params":[true,[{"txid":"123","vout":1}]],"id":1}`,
  lockunspent(params) {
    return rpc('lockunspent', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"move","params":["from","to",0.5],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"move","params":["from","to",0.5,6],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"move","params":["from","to",0.5,6,"comment"],"id":1}`,
  move(params) {
    return rpc('move', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"sendfrom","params":["from","1Address",0.5],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"sendfrom","params":["from","1Address",0.5,6],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"sendfrom","params":["from","1Address",0.5,6,"comment"],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"sendfrom","params":["from","1Address",0.5,6,"comment","commentto"],"id":1}`,
  sendfrom(params) {
    return rpc('sendfrom', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"sendmany","params":["from",{"1Address":0.5}],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"sendmany","params":["from",{"1Address":0.5},6],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"sendmany","params":["from",{"1Address":0.5},6,"comment"],"id":1}`,
  sendmany(params) {
    return rpc('sendmany', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"sendtoaddress","params":["1Address",0.5],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"sendtoaddress","params":["1Address",0.5,"comment","commentto"],"id":1}`,
  sendtoaddress(params) {
    return rpc('sendtoaddress', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"setaccount","params":["1Address","acct"],"id":1}`,
  setaccount(params) {
    return rpc('setaccount', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"settxfee","params":[0.0001],"id":1}`,
  settxfee(params) {
    return rpc('settxfee', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"signmessage","params":["1Address","message"],"id":1}`,
  signmessage(params) {
    return rpc('signmessage', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"signrawtransaction","params":["001122"],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"signrawtransaction","params":["001122",[{"txid":"123","vout":1,"scriptPubKey":"00","redeemScript":"01"}]],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"signrawtransaction","params":["001122",[],["abc"]],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"signrawtransaction","params":["001122",[],[],"ALL"],"id":1}`,
  signrawtransaction(params) {
    return rpc('signrawtransaction', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"walletlock","params":[],"id":1}`,
  walletlock(params) {
    return rpc('walletlock', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"walletpassphrase","params":["pass",60],"id":1}`,
  walletpassphrase(params) {
    return rpc('walletpassphrase', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"walletpassphrasechange","params":["old","new"],"id":1}`,
  walletpassphrasechange(params) {
    return rpc('walletpassphrasechange', params);
  },
  backupwallet(params) {
    return rpc('backupwallet', params);
  },

  // marshalled: `{"jsonrpc":"1.0","method":"getwalletinfo","params":[],"id":1}`,
  getwalletinfo(params) {
    return rpc('getwalletinfo', params);
  },
  // btcd aquery
  // marshalled: `{"jsonrpc":"1.0","method":"getbestblock","params":[],"id":1}`,
  getbestblock(params) {
    return rpc('getbestblock', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"getunconfirmedbalance","params":[],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"getunconfirmedbalance","params":["acct"],"id":1}`,
  getunconfirmedbalance(params) {
    return rpc('getunconfirmedbalance', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"listaddresstransactions","params":[["1Address"]],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"listaddresstransactions","params":[["1Address"],"acct"],"id":1}`,
  listaddresstransactions(params) {
    return rpc('listaddresstransactions', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"listalltransactions","params":[],"id":1}`,
  // marshalled: `{"jsonrpc":"1.0","method":"listalltransactions","params":["acct"],"id":1}`,
  listalltransactions(params) {
    return rpc('listalltransactions', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"recoveraddresses","params":["acct",10],"id":1}`,
  recoveraddresses(params) {
    return rpc('recoveraddresses', params);
  },
  // marshalled: `{"jsonrpc":"1.0","method":"walletislocked","params":[],"id":1}`,
  walletislocked(params) {
    return rpc('walletislocked', params);
  },
};
