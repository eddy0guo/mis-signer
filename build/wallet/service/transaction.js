"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chain_1 = require("../api/chain");
const wallet_1 = require("../api/wallet");
const asimovjs_1 = require("@asimovdev/asimovjs");
const storage_1 = require("./storage");
const utils_1 = require("../utils");
const address_1 = require("./address");
const constant_1 = require("../constant");
const await_to_js_1 = require("await-to-js");
function formateTransactionData(raw, addrs) {
    let transType = 0;
    const { blocktime, confirmations, vin = [], vout = [], } = raw;
    const isSend = vin.some(function (i) {
        return i.prevOut && i.prevOut.addresses && i.prevOut.addresses.every(function (addr) {
            return addrs.indexOf(addr) > -1;
        });
    });
    const isCoinbase = !!vin[0].coinbase;
    if (isSend) {
        const isMove = vout && vout.every(function (out) {
            return out.scriptPubKey.addresses && out.scriptPubKey.addresses.every(function (addr) {
                return addrs.indexOf(addr) > -1;
            });
        });
        if (isMove) {
            transType = 2;
        }
        else {
            transType = 1;
        }
    }
    const asset = isCoinbase ? constant_1.CONSTANT.DEFAULT_ASSET : (vin[0].prevOut && vin[0].prevOut.assets);
    const recieveAddress = vout[0].scriptPubKey.addresses && vout[0].scriptPubKey.addresses[0];
    const fromAddress = isCoinbase ? 'coinbase' : vin[0].prevOut.addresses && vin[0].prevOut.addresses[0];
    return {
        type: transType,
        amount: vout[0].value,
        asset,
        confirmations,
        blocktime,
        txid: raw.txid,
        fee: 0,
        fromAddress,
        recieveAddress,
    };
}
function PickUtoxs(total, utxos) {
    let t = 0;
    const result = [];
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
        min.amount = utils_1.btc2sts(min.amount);
        result.push(min);
    }
    else {
        for (let i = 0; i < utxos.length; i++) {
            if (t < total) {
                const addr = utxos[i].address;
                result.push(utxos[i]);
                t += utxos[i].amount;
                utxos[i].amount = utils_1.btc2sts(utxos[i].amount);
            }
            else {
                break;
            }
        }
    }
    return [result, t];
}
exports.TranService = {
    async queryAllSendTransaction(addrs, offset, count) {
        let rawTransactions = {}, transactions = {}, pureAddrNums = 0, lastErrorIndex, usedAddrs = [];
        const [res] = await await_to_js_1.default(chain_1.chain.searchrawtransactionsbyaddrs(addrs));
        return res;
    },
    async queryTransactionsByAddresses(addrs, offset, count) {
        const [res] = await await_to_js_1.default(chain_1.chain.gettransactionsbyaddresses([addrs, offset, count]));
        let trans = [];
        const transactions = [];
        const rawTransactions = {};
        for (const addr in res) {
            if (res[addr].length) {
                trans = trans.concat(res[addr]);
            }
        }
        trans.forEach(raw => {
            rawTransactions[raw.txid] = raw;
            const formatedTrans = formateTransactionData(raw, addrs);
            const assetKey = formatedTrans.asset;
            if (!transactions[assetKey]) {
                transactions[assetKey] = [];
            }
            transactions[assetKey].push(formatedTrans);
        });
        return transactions;
    },
    async querySendTransaction(addrs, offset = 0, count = 1) {
        let rawTransactions = {}, transactions = {}, pureAddrNums = 0, lastErrorIndex, usedAddrs = [];
        for (let i = 0; i < addrs.length; i++) {
            const addr = addrs[i];
            let tplOffset = offset;
            let canLoopSearch = true;
            const [res] = await await_to_js_1.default(chain_1.chain.searchrawtransactions([addr, true, tplOffset, count, true, false, []]));
            try {
                for (; canLoopSearch;) {
                    const [res, err] = await await_to_js_1.default(chain_1.chain.searchrawtransactions([addr, true, tplOffset, count, true, false, []]));
                    if (err) {
                        console.log(err);
                    }
                    if (res) {
                        usedAddrs.push(addr);
                        for (const raw of res) {
                            if (!rawTransactions[raw.txid]) {
                                rawTransactions[raw.txid] = raw;
                                let transType = 0;
                                const { blocktime, confirmations, vin = [], vout, } = raw;
                                const isSend = vin.some(function (xin) {
                                    return (xin.prevOut.addresses).indexOf(addr) > -1;
                                });
                                if (isSend) {
                                    const isMove = vout.every(function (out) {
                                        return out.scriptPubKey.addresses.every(function (addr) {
                                            return addrs.indexOf(addr) > -1;
                                        });
                                    });
                                    if (isMove) {
                                        transType = 2;
                                    }
                                    else {
                                        transType = 1;
                                    }
                                }
                                const assetKey = vin[0].prevOut.assets;
                                if (!transactions[assetKey])
                                    transactions[assetKey] = [];
                                transactions[assetKey].push({
                                    type: transType,
                                    amount: vout[0].value,
                                    assets: assetKey,
                                    confirmations,
                                    blocktime,
                                    txid: raw.txid,
                                    fee: 0,
                                    fromAddress: vin[0].prevOut.addresses[0],
                                    recieveAddress: vout[0].scriptPubKey.addresses[0],
                                });
                            }
                        }
                        if (res.length >= count) {
                            tplOffset += count;
                        }
                        else {
                            break;
                        }
                    }
                }
            }
            catch (e) {
                if (tplOffset == offset) {
                    if ((lastErrorIndex == undefined) || (lastErrorIndex + 1 == i)) {
                        lastErrorIndex = i;
                        pureAddrNums++;
                    }
                }
                else {
                    canLoopSearch = false;
                }
            }
        }
        return [transactions, usedAddrs, pureAddrNums];
    },
    async queryBalances(addrs) {
        const balances = await wallet_1.walletRPC.getbalances([addrs]);
        return balances || [];
    },
    async queryUTXO(addrs, assetKey) {
        const params = [];
        params.push(addrs);
        params.push(assetKey);
        return await wallet_1.walletRPC.getutxobyaddress(params);
    },
    async queryBalance(addr) {
        const balance = await wallet_1.walletRPC.getbalance([addr]);
        return balance;
    },
    async decodeRawTx(rawTxs) {
        if (typeof rawTxs == 'string')
            rawTxs = [rawTxs];
        const transData = await chain_1.chain.decoderawtransaction(rawTxs);
        return transData;
    },
    async chooseUTXO(walletId, assetObjArr, addr = '') {
        const allUtxos = await storage_1.default.get('walletUTXO' + walletId);
        const allAddrs = await address_1.default.getAddrs(walletId);
        let ins = [], changeOut = [], success = true;
        const proxyAssetObjArr = [];
        for (const assetObj of assetObjArr) {
            let mark = false;
            for (const proxyAssetObj of proxyAssetObjArr) {
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
        for (const assetObj of proxyAssetObjArr) {
            if (!assetObj || !assetObj.asset || !allUtxos) {
                break;
            }
            let utxos = allUtxos[assetObj.asset];
            const otherAddrUtxos = [];
            if (addr) {
                const proxy_utxos = [];
                for (const utxo of utxos) {
                    if (utxo.address === addr) {
                        proxy_utxos.push(utxo);
                    }
                    else {
                        otherAddrUtxos.push(utxo);
                    }
                }
                utxos = proxy_utxos;
            }
            if (typeof assetObj.amount == 'string') {
                assetObj.amount = parseFloat(assetObj.amount);
            }
            let [willspendUTXO, totalAmount] = PickUtoxs(assetObj.amount, utxos);
            if (totalAmount < assetObj.amount) {
                const [otherAddrWillspendUTXO, otherAddrTotalAmount] = PickUtoxs(assetObj.amount - totalAmount, otherAddrUtxos);
                if (otherAddrTotalAmount + totalAmount >= assetObj.amount) {
                    changeOut.push({
                        amount: utils_1.btc2sts(totalAmount + otherAddrTotalAmount - assetObj.amount),
                        assets: assetObj.asset,
                        address: addr ? addr : allAddrs[0][0].address,
                    });
                    willspendUTXO = willspendUTXO.concat(otherAddrWillspendUTXO);
                }
                else {
                    success = false;
                    break;
                }
            }
            else {
                changeOut.push({
                    amount: utils_1.btc2sts(totalAmount - assetObj.amount),
                    assets: assetObj.asset,
                    address: addr ? addr : allAddrs[0][0].address,
                });
            }
            ins = ins.concat(willspendUTXO);
        }
        if (!success) {
            ins = [], changeOut = [];
        }
        changeOut = changeOut.filter(out => out.amount > 0);
        return {
            ins,
            changeOut,
        };
    },
    async chooseUTXO_V2(walletId, assetObjArr, addr = '') {
        const allUtxos = await storage_1.default.get('walletUTXO' + walletId);
        const allAddrs = await address_1.default.getAddrs(walletId);
        let ins = [], changeOut = [], success = true;
        const proxyAssetObjArr = [];
        for (const assetObj of assetObjArr) {
            let mark = false;
            for (const proxyAssetObj of proxyAssetObjArr) {
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
        for (const assetObj of proxyAssetObjArr) {
            if (!assetObj || !assetObj.asset) {
                break;
            }
            let utxos = allUtxos[assetObj.asset];
            const otherAddrUtxos = [];
            const transCache = Cache.getTransCache(walletId, assetObj.asset);
            for (const tran of transCache) {
                for (const freezeUtxo of tran.freezeUtxo) {
                    for (let i = 0; i < utxos.length; i++) {
                        if (utxos[i].txid === freezeUtxo.txid && utxos[i].vout === freezeUtxo.vout) {
                            utxos.splice(i, 1);
                            break;
                        }
                    }
                }
            }
            if (addr) {
                const proxy_utxos = [];
                for (const utxo of utxos) {
                    if (utxo.address === addr) {
                        proxy_utxos.push(utxo);
                    }
                    else {
                        otherAddrUtxos.push(utxo);
                    }
                }
                utxos = proxy_utxos;
            }
            if (typeof assetObj.amount == 'string') {
                assetObj.amount = parseFloat(assetObj.amount);
            }
            let [willspendUTXO, totalAmount] = PickUtoxs(assetObj.amount, utxos);
            if (totalAmount < assetObj.amount) {
                const [otherAddrWillspendUTXO, otherAddrTotalAmount] = PickUtoxs(assetObj.amount - totalAmount, otherAddrUtxos);
                if (otherAddrTotalAmount + totalAmount >= assetObj.amount) {
                    changeOut.push({
                        amount: utils_1.btc2sts(totalAmount + otherAddrTotalAmount - assetObj.amount),
                        assets: assetObj.asset,
                        address: addr ? addr : allAddrs[0][0].address,
                    });
                    willspendUTXO = willspendUTXO.concat(otherAddrWillspendUTXO);
                }
                else {
                    success = false;
                    break;
                }
            }
            else {
                changeOut.push({
                    amount: utils_1.btc2sts(totalAmount - assetObj.amount),
                    assets: assetObj.asset,
                    address: addr ? addr : allAddrs[0][0].address,
                });
            }
            ins = ins.concat(willspendUTXO);
        }
        if (!success) {
            ins = [], changeOut = [];
        }
        changeOut = changeOut.filter(out => out.amount > 0);
        return {
            ins,
            changeOut,
        };
    },
    generateRawTx(inputs, outputs, keys, gasLimit = 0) {
        let tx;
        try {
            tx = new asimovjs_1.Transaction({
                inputs,
                outputs,
                gasLimit,
            });
        }
        catch (e) {
            console.log('交易构建错误，请检查交易数据', e);
            return '';
        }
        try {
            console.log('adcdefg-before:', keys, tx);
            tx.sign(keys);
        }
        catch (e) {
            console.log('签名错误，请检查密码', e);
            return '';
        }
        try {
            console.log('adcdefg-after:', tx.toHex());
            return tx.toHex();
        }
        catch (e) {
            console.log('交易格式化错误，请检查数据', e);
            return '';
        }
    },
    generateTxHex(inputs, outputs, keys, gasLimit = 0) {
        let tx;
        try {
            tx = new asimovjs_1.Transaction({
                inputs,
                outputs,
                gasLimit,
            });
        }
        catch (e) {
            console.log('交易构建错误，请检查交易数据', e);
            return '';
        }
        try {
            const hex = tx.toUnsignHex();
            return hex;
        }
        catch (e) {
            console.log('交易格式化错误，请检查数据', e);
            return '';
        }
    },
    signHex(keys, hex) {
        let tx;
        try {
            console.log('\n', hex, '\n');
            tx = asimovjs_1.Transaction.fromHex(hex);
            console.log('gxy222', tx);
        }
        catch (e) {
            console.log('交易构建错误，请检查交易数据', e);
            return '';
        }
        try {
            tx.sign(keys);
        }
        catch (e) {
            console.log('签名错误，请检查密码', e);
            return '';
        }
        try {
            return tx.toHex();
        }
        catch (e) {
            console.log('交易格式化错误，请检查数据', e);
            return '';
        }
    },
};
//# sourceMappingURL=transaction.js.map