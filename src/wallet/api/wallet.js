import { rpc } from '../service/request';

export const walletRPC = {
  //marshalled: `{"jsonrpc":"1.0","method":"createnewaccount","params":["acct"],"id":1}`,
  createnewaccount: function(params) {
    return rpc('createnewaccount', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"dumpwallet","params":["filename"],"id":1}`,
  dumpwallet: function(params) {
    return rpc('dumpwallet', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"importaddress","params":["1Address"],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"importaddress","params":["1Address",false],"id":1}`,
  importaddress: function(params) {
    return rpc('importaddress', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"importpubkey","params":["031234"],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"importpubkey","params":["031234",false],"id":1}`,
  importpubkey: function(params) {
    return rpc('importpubkey', params);
  },

  //marshalled: `{"jsonrpc":"1.0","method":"renameaccount","params":["oldacct","newacct"],"id":1}`,
  renameaccount: function(params) {
    return rpc('renameaccount', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"importwallet","params":["filename"],"id":1}`,
  importwallet: function(params) {
    return rpc('importwallet', params);
  },
  //钱包命令
  //marshalled: `{"jsonrpc":"1.0","method":"addmultisigaddress","params":[2,["031234","035678"]],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"addmultisigaddress","params":[2,["031234","035678"],"test"],"id":1}`,
  addmultisigaddress: function(params) {
    return rpc('addmultisigaddress', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"createmultisig","params":[2,["031234","035678"]],"id":1}`,
  createmultisig: function(params) {
    return rpc('createmultisig', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"dumpprivkey","params":["1Address"],"id":1}`,
  dumpprivkey: function(params) {
    return rpc('dumpprivkey', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"encryptwallet","params":["pass"],"id":1}`,
  encryptwallet: function(params) {
    return rpc('encryptwallet', params);
  },

  //marshalled: `{"jsonrpc":"1.0","method":"estimatefee","params":[6],"id":1}`,
  estimatefee: function(params) {
    return rpc('estimatefee', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"estimatepriority","params":[6],"id":1}`,
  estimatepriority: function(params) {
    return rpc('estimatepriority', params);
  },

  //marshalled: `{"jsonrpc":"1.0","method":"getaccount","params":["1Address"],"id":1}`,
  getaccount: function(params) {
    return rpc('getaccount', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"getaccountaddress","params":["acct"],"id":1}`,
  getaccountaddress: function(params) {
    return rpc('getaccountaddress', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"getaddressesbyaccount","params":["acct"],"id":1}`,
  getaddressesbyaccount: function(params) {
    return rpc('getaddressesbyaccount', params);
  },

  getbalance: function(params) {
    return rpc('flow_getBalance', params);
  },
  getbalances: function(params) {
    return rpc('flow_getBalances', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"getnewaddress","params":[],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"getnewaddress","params":["acct"],"id":1}`,
  getnewaddress: function(params) {
    return rpc('getnewaddress', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"getrawchangeaddress","params":[],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"getrawchangeaddress","params":["acct"],"id":1}`,
  getrawchangeaddress: function(params) {
    return rpc('getrawchangeaddress', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"getreceivedbyaccount","params":["acct"],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"getreceivedbyaccount","params":["acct",6],"id":1}`,
  getreceivedbyaccount: function(params) {
    return rpc('getreceivedbyaccount', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"getreceivedbyaddress","params":["1Address"],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"getreceivedbyaddress","params":["1Address",6],"id":1}`,
  getreceivedbyaddress: function(params) {
    return rpc('getreceivedbyaddress', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"gettransaction","params":["123"],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"gettransaction","params":["123",true],"id":1}`,
  gettransaction: function(params) {
    return rpc('gettransaction', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"gettransactionlist","params":[],"id":1}`,
  gettransactionlist: function(params) {
    return rpc('gettransactionlist', params);
  },
  getutxobyaddress:function(params){
    return rpc('flow_getUtxoByAddress', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"importprivkey","params":["abc"],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"importprivkey","params":["abc","label"],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"importprivkey","params":["abc","label",false],"id":1}`,
  importprivkey: function(params) {
    return rpc('importprivkey', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"keypoolrefill","params":[],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"keypoolrefill","params":[200],"id":1}`,
  keypoolrefill: function(params) {
    return rpc('keypoolrefill', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"listaccounts","params":[],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"listaccounts","params":[6],"id":1}`,
  listaccounts: function(params) {
    return rpc('listaccounts', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"listaddressgroupings","params":[],"id":1}`,
  listaddressgroupings: function(params) {
    return rpc('listaddressgroupings', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"listlockunspent","params":[],"id":1}`,
  listlockunspent: function(params) {
    return rpc('listlockunspent', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"listreceivedbyaccount","params":[],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"listreceivedbyaccount","params":[6],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"listreceivedbyaccount","params":[6,true],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"listreceivedbyaccount","params":[6,true,false],"id":1}`,
  listreceivedbyaccount: function(params) {
    return rpc('listreceivedbyaccount', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"listreceivedbyaddress","params":[],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"listreceivedbyaddress","params":[6],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"listreceivedbyaddress","params":[6,true],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"listreceivedbyaddress","params":[6,true,false],"id":1}`,
  listreceivedbyaddress: function(params) {
    return rpc('listreceivedbyaddress', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"listsinceblock","params":[],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"listsinceblock","params":["123"],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"listsinceblock","params":["123",6],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"listsinceblock","params":["123",6,true],"id":1}`,
  listsinceblock: function(params) {
    return rpc('listsinceblock', params);
  },

  //marshalled: `{"jsonrpc":"1.0","method":"listtransactions","params":[],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"listtransactions","params":["acct"],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"listtransactions","params":["acct",20],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"listtransactions","params":["acct",20,1],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"listtransactions","params":["acct",20,1,true],"id":1}`,
  listtransactions: function(params) {
    return rpc('listtransactions', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"listunspent","params":[],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"listunspent","params":[6],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"listunspent","params":[6,100],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"listunspent","params":[6,100,["1Address","1Address2"]],"id":1}`,
  listunspent: function(params) {
    return rpc('listunspent', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"lockunspent","params":[true,[{"txid":"123","vout":1}]],"id":1}`,
  lockunspent: function(params) {
    return rpc('lockunspent', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"move","params":["from","to",0.5],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"move","params":["from","to",0.5,6],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"move","params":["from","to",0.5,6,"comment"],"id":1}`,
  move: function(params) {
    return rpc('move', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"sendfrom","params":["from","1Address",0.5],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"sendfrom","params":["from","1Address",0.5,6],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"sendfrom","params":["from","1Address",0.5,6,"comment"],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"sendfrom","params":["from","1Address",0.5,6,"comment","commentto"],"id":1}`,
  sendfrom: function(params) {
    return rpc('sendfrom', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"sendmany","params":["from",{"1Address":0.5}],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"sendmany","params":["from",{"1Address":0.5},6],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"sendmany","params":["from",{"1Address":0.5},6,"comment"],"id":1}`,
  sendmany: function(params) {
    return rpc('sendmany', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"sendtoaddress","params":["1Address",0.5],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"sendtoaddress","params":["1Address",0.5,"comment","commentto"],"id":1}`,
  sendtoaddress: function(params) {
    return rpc('sendtoaddress', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"setaccount","params":["1Address","acct"],"id":1}`,
  setaccount: function(params) {
    return rpc('setaccount', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"settxfee","params":[0.0001],"id":1}`,
  settxfee: function(params) {
    return rpc('settxfee', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"signmessage","params":["1Address","message"],"id":1}`,
  signmessage: function(params) {
    return rpc('signmessage', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"signrawtransaction","params":["001122"],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"signrawtransaction","params":["001122",[{"txid":"123","vout":1,"scriptPubKey":"00","redeemScript":"01"}]],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"signrawtransaction","params":["001122",[],["abc"]],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"signrawtransaction","params":["001122",[],[],"ALL"],"id":1}`,
  signrawtransaction: function(params) {
    return rpc('signrawtransaction', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"walletlock","params":[],"id":1}`,
  walletlock: function(params) {
    return rpc('walletlock', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"walletpassphrase","params":["pass",60],"id":1}`,
  walletpassphrase: function(params) {
    return rpc('walletpassphrase', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"walletpassphrasechange","params":["old","new"],"id":1}`,
  walletpassphrasechange: function(params) {
    return rpc('walletpassphrasechange', params);
  },
  backupwallet: function(params) {
    return rpc('backupwallet', params);
  },

  //marshalled: `{"jsonrpc":"1.0","method":"getwalletinfo","params":[],"id":1}`,
  getwalletinfo: function(params) {
    return rpc('getwalletinfo', params);
  },
  //btcd aquery
  //marshalled: `{"jsonrpc":"1.0","method":"getbestblock","params":[],"id":1}`,
  getbestblock: function(params) {
    return rpc('getbestblock', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"getunconfirmedbalance","params":[],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"getunconfirmedbalance","params":["acct"],"id":1}`,
  getunconfirmedbalance: function(params) {
    return rpc('getunconfirmedbalance', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"listaddresstransactions","params":[["1Address"]],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"listaddresstransactions","params":[["1Address"],"acct"],"id":1}`,
  listaddresstransactions: function(params) {
    return rpc('listaddresstransactions', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"listalltransactions","params":[],"id":1}`,
  //marshalled: `{"jsonrpc":"1.0","method":"listalltransactions","params":["acct"],"id":1}`,
  listalltransactions: function(params) {
    return rpc('listalltransactions', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"recoveraddresses","params":["acct",10],"id":1}`,
  recoveraddresses: function(params) {
    return rpc('recoveraddresses', params);
  },
  //marshalled: `{"jsonrpc":"1.0","method":"walletislocked","params":[],"id":1}`,
  walletislocked: function(params) {
    return rpc('walletislocked', params);
  }
};
