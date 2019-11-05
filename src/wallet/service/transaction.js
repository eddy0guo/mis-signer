import { chain } from '../api/chain';
import { walletRPC } from "../api/wallet";

import { Transaction } from "@asimovdev/asimovjs"
import Storage from "./storage";
import { btc2sts } from "../utils";
import AddressService from "./address";
import { CONSTANT } from "../constant";
import to from 'await-to-js';


function formateTransactionData(raw, addrs) {
    let transType = 0;
    let { blocktime, confirmations, vin = [], vout = [] } = raw;

    let isSend = vin.some(function (i) {
        return i.prevOut && i.prevOut.addresses && i.prevOut.addresses.every(function (addr) {
            return addrs.indexOf(addr) > -1
        })
    });
    let isCoinbase = !!vin[0].coinbase

    if (isSend) {
        let isMove = vout && vout.every(function (out) {
            return out.scriptPubKey.addresses && out.scriptPubKey.addresses.every(function (addr) {
                return addrs.indexOf(addr) > -1;
            })
        })
        if (isMove) {
            transType = 2;
        } else {
            transType = 1;
        }
    }
    let asset = isCoinbase ? CONSTANT.DEFAULT_ASSET : (vin[0]['prevOut'] && vin[0]['prevOut']['assets'])
    let recieveAddress = vout[0].scriptPubKey.addresses && vout[0].scriptPubKey.addresses[0];
    let fromAddress = isCoinbase ? 'coinbase' : vin[0].prevOut.addresses && vin[0].prevOut.addresses[0];
    return {
        type: transType, // 0: 接收 , 1: 发送 , 2: 迁移
        amount: vout[0].value,
        asset: asset,
        confirmations,
        blocktime,
        txid: raw.txid,
        fee: 0, // ?? 这里也没处理，还需考虑不同资产的
        fromAddress: fromAddress,
        recieveAddress: recieveAddress
    };


}



function PickUtoxs(total, utxos) {
    let t = 0;
    let result = [];


    if (!utxos.length) {
        return [result, t];
    }

    if (total == 0) {
        let min;
        min = utxos[0];
        for (let i = 0; i < utxos.length; i++) {
            if (min && (min.amount > utxos[i].amount)) {
                min = utxos[i];
            }
        }

        t = min.amount;
        min.amount = btc2sts(min.amount);
        result.push(min);
    } else {
        for (let i = 0; i < utxos.length; i++) {

            if (t < total) {
                let addr = utxos[i].address;

                result.push(utxos[i])
                t += utxos[i].amount;
                utxos[i].amount = btc2sts(utxos[i].amount);
            } else {
                break;
            }

        }
    }

    return [result, t];
}




export const TranService = {
    async queryAllSendTransaction(addrs, offset, count) {
        let rawTransactions = {},
            transactions = {},
            pureAddrNums = 0,
            lastErrorIndex, usedAddrs = [];

        let [res] = await to(chain.searchrawtransactionsbyaddrs(addrs));

        return res;

    },

    async queryTransactionsByAddresses(addrs, offset, count) {

        let [res] = await to(chain.gettransactionsbyaddresses([addrs, offset, count]));

        let trans = [];
        let transactions = [];
        let rawTransactions = {};

        for (let addr in res) {
            if (res[addr].length) {
                trans = trans.concat(res[addr]);
            }
        }

        trans.forEach(raw => {
            rawTransactions[raw.txid] = raw;

            let formatedTrans = formateTransactionData(raw, addrs)

            let assetKey = formatedTrans.asset;

            if (!transactions[assetKey]) {
                transactions[assetKey] = [];
            }
            transactions[assetKey].push(formatedTrans);

        })
        return transactions;

    },
    /**
     * [querySendTransaction description]
     * @param  {[type]} addrs  [address array]
     * @param  {Number} offset [block offset]
     * @param  {Number} count  [block count]
     * @return {[type]}        [description]
     */
    async querySendTransaction(addrs, offset = 0, count = 1) {
        let rawTransactions = {},
            transactions = {},
            pureAddrNums = 0,
            lastErrorIndex, usedAddrs = [];
        for (let i = 0; i < addrs.length; i++) {
            let addr = addrs[i];
            let tplOffset = offset;
            let canLoopSearch = true;

            let [res] = await to(chain.searchrawtransactions([addr, true, tplOffset, count, true, false, []]));


            try {
                for (; canLoopSearch;) {
                    let [res, err] = await to(chain.searchrawtransactions([addr, true, tplOffset, count, true, false, []]));

                    if (err) {
                        console.log(err);
                    }

                    if (res) {
                        usedAddrs.push(addr);
                        for (let raw of res) {
                            if (!rawTransactions[raw.txid]) {
                                rawTransactions[raw.txid] = raw;
                                let transType = 0;
                                let { blocktime, confirmations, vin = [], vout } = raw;
                                let isSend = vin.some(function (xin) {
                                    return (xin.prevOut.addresses).indexOf(addr) > -1;
                                });
                                if (isSend) {
                                    let isMove = vout.every(function (out) {
                                        return out.scriptPubKey.addresses.every(function (addr) {
                                            return addrs.indexOf(addr) > -1;
                                        })
                                    })
                                    if (isMove) {
                                        transType = 2;
                                    } else {
                                        transType = 1;
                                    }
                                }
                                let assetKey = vin[0]['prevOut']['assets'];
                                if (!transactions[assetKey]) transactions[assetKey] = [];
                                transactions[assetKey].push({
                                    type: transType, // 0: 接收 , 1: 发送 , 2: 迁移
                                    amount: vout[0].value,
                                    assets: assetKey,
                                    confirmations,
                                    blocktime,
                                    txid: raw.txid,
                                    fee: 0, // ?? 这里也没处理，还需考虑不同资产的
                                    fromAddress: vin[0].prevOut.addresses[0],
                                    recieveAddress: vout[0].scriptPubKey.addresses[0]
                                });
                            }
                        }
                        if (res.length >= count) {
                            tplOffset += count;
                        } else {
                            break;
                        }
                    }
                }
            } catch (e) {
                if (tplOffset == offset) {
                    if ((lastErrorIndex == undefined) || (lastErrorIndex + 1 == i)) {
                        lastErrorIndex = i;
                        pureAddrNums++;
                    }
                } else {
                    canLoopSearch = false;
                }
            }
            // if (pureAddrNums >= addrs.length) {  // ?? 这里可能需要生成地址，递归查询
            //     break;
            // }
        }
        return [transactions, usedAddrs, pureAddrNums];
    },
    async queryBalances(addrs) {
        let balances = await walletRPC.getbalances([addrs]);
        return balances || [];
    },
    async queryUTXO(addrs, assetKey) {
        let params = [];
        params.push(addrs);
        params.push(assetKey);
        return await walletRPC.getutxobyaddress(params);
    },
    async queryBalance(addr) {
        let balance = await walletRPC.getbalance([addr])
        return balance;
    },
    async decodeRawTx(rawTxs) {
        if (typeof rawTxs == 'string') rawTxs = [rawTxs];
        let transData = await chain.decoderawtransaction(rawTxs);
        return transData;
    },

  async chooseUTXO(walletId, assetObjArr, addr = "") {
    let allUtxos = await Storage.get("walletUTXO" + walletId);
    let allAddrs = await AddressService.getAddrs(walletId);

    let ins = [], changeOut = [], success = true;

    // Asset classification
    const proxyAssetObjArr = [];
    for (let assetObj of assetObjArr) {
      let mark = false;
      for (let proxyAssetObj of proxyAssetObjArr) {
        if (assetObj.asset === proxyAssetObj.asset) {
          mark = true;
          proxyAssetObj.amount = parseFloat(proxyAssetObj.amount) + parseFloat(assetObj.amount);
          break;
        }
      }
      if (!mark) {
        proxyAssetObjArr.push(assetObj);
      }
    }

    // multi-currency
    // assetObj:{amount,asset}
    for (const assetObj of proxyAssetObjArr) {
      if (!assetObj || !assetObj.asset || !allUtxos) {
        break;
      }
      let utxos = allUtxos[assetObj.asset];
      let otherAddrUtxos = [];





	if (addr) {
        const proxy_utxos = [];
        for (let utxo of utxos) {
          if (utxo.address === addr) {
            proxy_utxos.push(utxo);
          } else {
            otherAddrUtxos.push(utxo);
          }
        }
        utxos = proxy_utxos;
      }

      if (typeof assetObj.amount == 'string') {
        assetObj.amount = parseFloat(assetObj.amount);
      }

      // pick utxo
      let [willspendUTXO, totalAmount] = PickUtoxs(assetObj.amount, utxos);
      if (totalAmount < assetObj.amount) {
        let [otherAddrWillspendUTXO, otherAddrTotalAmount] = PickUtoxs(assetObj.amount - totalAmount, otherAddrUtxos);
        if (otherAddrTotalAmount + totalAmount >= assetObj.amount) {
          changeOut.push({
            amount: btc2sts(totalAmount + otherAddrTotalAmount - assetObj.amount),
            assets: assetObj.asset,
            address: addr ? addr : allAddrs[0][0].address
          })
          willspendUTXO = willspendUTXO.concat(otherAddrWillspendUTXO);
        } else {
          success = false;
          break;
        }
      } else {
        changeOut.push({
          amount: btc2sts(totalAmount - assetObj.amount),
          assets: assetObj.asset,
          address: addr ? addr : allAddrs[0][0].address
        })
      }

      ins = ins.concat(willspendUTXO);
    }

    if (!success) {
      ins = [], changeOut = []
    }
changeOut = changeOut.filter(out => out.amount > 0);
    return { ins, changeOut };
  },




  	

    /**
     * 暂时没用，支持多币种手续费的方法。
     * @param {*} walletId 
     * @param {*} assetObjArr 
     * @param {*} addr 
     */
    async chooseUTXO_V2(walletId, assetObjArr, addr = "") {
        let allUtxos = await Storage.get("walletUTXO" + walletId);
        let allAddrs = await AddressService.getAddrs(walletId);
    
        let ins = [], changeOut = [], success = true;
    
        // Asset classification
        const proxyAssetObjArr = [];
        for (let assetObj of assetObjArr) {
          let mark = false;
          for (let proxyAssetObj of proxyAssetObjArr) {
            if (assetObj.asset === proxyAssetObj.asset) {
              mark = true;
              proxyAssetObj.amount = parseFloat(proxyAssetObj.amount) + parseFloat(assetObj.amount);
              break;
            }
          }
          if (!mark) {
            proxyAssetObjArr.push(assetObj);
          }
        }
    
        // multi-currency
        // assetObj:{amount,asset}
        for (const assetObj of proxyAssetObjArr) {
          if (!assetObj || !assetObj.asset) {
            break;
          }
          let utxos = allUtxos[assetObj.asset];
          let otherAddrUtxos = [];
    
          let transCache = Cache.getTransCache(walletId, assetObj.asset);
    
          // filter freeze utxo
          for (let tran of transCache) {
            for (let freezeUtxo of tran.freezeUtxo) {
              for (let i = 0; i < utxos.length; i++) {
                if (utxos[i].txid === freezeUtxo.txid && utxos[i].vout === freezeUtxo.vout) {
                  utxos.splice(i, 1);
                  break;
                }
              }
            }
          }
    
          // multiple address
          if (addr) {
            const proxy_utxos = [];
            for (let utxo of utxos) {
              if (utxo.address === addr) {
                proxy_utxos.push(utxo);
              } else {
                otherAddrUtxos.push(utxo);
              }
            }
            utxos = proxy_utxos;
          }
    
          if (typeof assetObj.amount == 'string') {
            assetObj.amount = parseFloat(assetObj.amount);
          }
    
          // pick utxo
          let [willspendUTXO, totalAmount] = PickUtoxs(assetObj.amount, utxos);
          if (totalAmount < assetObj.amount) {
            let [otherAddrWillspendUTXO, otherAddrTotalAmount] = PickUtoxs(assetObj.amount - totalAmount, otherAddrUtxos);
            if (otherAddrTotalAmount + totalAmount >= assetObj.amount) {
              changeOut.push({
                amount: btc2sts(totalAmount + otherAddrTotalAmount - assetObj.amount),
                assets: assetObj.asset,
                address: addr ? addr : allAddrs[0][0].address
              })
              willspendUTXO = willspendUTXO.concat(otherAddrWillspendUTXO);
            } else {
              success = false;
              break;
            }
          } else {
            changeOut.push({
              amount: btc2sts(totalAmount - assetObj.amount),
              assets: assetObj.asset,
              address: addr ? addr : allAddrs[0][0].address
            })
          }
    
          ins = ins.concat(willspendUTXO);
        }
    
        if (!success) {
          ins = [], changeOut = []
        }
    
        changeOut = changeOut.filter(out => out.amount > 0);
        return { ins, changeOut };
      },
    generateRawTx(inputs, outputs, keys,gasLimit = 0) {
        let tx;
        try {
            //validate
            tx = new Transaction({
                inputs,
                outputs,
                gasLimit
            });

        } catch (e) {
            console.log('交易构建错误，请检查交易数据',e)
            return ''
        }

        try {
            console.log("KEYS:",keys)
            console.log("TX:",tx.toHex())
            tx.sign(keys)
        } catch (e) {
            console.log('签名错误，请检查密码',e);
            return ''
        }

        try {
            return tx.toHex();
        } catch (e) {
            console.log('交易格式化错误，请检查数据',e);
            return ''
        }
    }
}
