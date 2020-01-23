"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const await_to_js_1 = require("await-to-js");
const number_precision_1 = require("number-precision");
const asimov_wallet_1 = require("@fingo/asimov-wallet");
const crypto_sha256 = require('crypto');
const chain_1 = require("./api/chain");
const walletHelper_1 = require("./lib/walletHelper");
const AssetToken_1 = require("./contract/AssetToken");
const cfg_1 = require("../cfg");
const utils_1 = require("../adex/api/utils");
const db_1 = require("../adex/models/db");
const mist_wallet_1 = require("../adex/api/mist_wallet");
const users_1 = require("../adex/cli/users");
const coin2asset_fee = [
    {
        token: 'CNYC',
        amount: 10,
    }, {
        token: 'USDT',
        amount: 1.5,
    }, {
        token: 'ASIM',
        amount: 0.6,
    }, {
        token: 'MT',
        amount: 0.2,
    }, {
        token: 'ETH',
        amount: 0.01,
    }, {
        token: 'BTC',
        amount: 0.0002,
    },
];
let walletInst;
async function getTestInst() {
    walletInst = await walletHelper_1.default.testWallet(cfg_1.default.fauct_word, '111111');
    return walletInst;
}
const faucet_amount = [600, 100, 0.1, 1000, 5, 1000];
const big_faucet_amount = [500000, 1000, 5, 200000, 200000, 200000];
exports.default = () => {
    const wallet = express_1.Router();
    const psql_db = new db_1.default();
    const utils = new utils_1.default();
    const mist_wallet = new mist_wallet_1.default();
    wallet.all('/', async (req, res) => {
        walletInst = await getTestInst();
        const address = await walletInst.getAddress();
        res.json({ wallet: address });
    });
    wallet.all('/get_user_info/:address', async (req, res) => {
        const token_arr = await mist_wallet.list_tokens();
        let mist_user = await psql_db.find_user([req.params.address]);
        const users_obj = new users_1.default();
        if (!mist_user[0]) {
            const infos = [];
            for (const i in token_arr) {
                const total_balance = await users_obj.get_total_balance(token_arr[i], req.params.address);
                const price = await mist_wallet.get_token_price2pi(token_arr[i].symbol);
                const valuation = number_precision_1.default.times(price, total_balance);
                mist_user = {
                    address: req.params.address,
                    token_symbol: token_arr[i].symbol,
                    balance: total_balance,
                    valuation,
                };
                infos.push(mist_user);
            }
            mist_user = {
                address: infos[0].address,
                pi: infos[0].balance,
                asim: infos[1].balance,
                usdt: infos[3].balance,
                eth: infos[4].balance,
                mt: infos[5].balance,
                btc: infos[2].balance,
                pi_valuation: infos[0].valuation,
                asim_valuation: infos[1].valuation,
                usdt_valuation: infos[3].valuation,
                eth_valuation: infos[4].valuation,
                mt_valuation: infos[5].valuation,
                btc_valuation: infos[2].valuation,
            };
        }
        res.json({ result: mist_user });
    });
    wallet.all('/list_assets_info', async (req, res) => {
        const [err, info] = await await_to_js_1.default(psql_db.list_assets_info());
        res.json({ result: info, err });
    });
    wallet.all('/get_asset_info/:token_name', async (req, res) => {
        const tokens = await psql_db.get_tokens([req.params.token_name]);
        const assetToken = new AssetToken_1.default(tokens[0].asim_address);
        walletInst = await getTestInst();
        assetToken.unlock(walletInst, '111111');
        const [err, result] = await await_to_js_1.default(assetToken.getAssetInfo());
        console.log(result, err);
        res.json({ result, err });
    });
    wallet.all('/faucet/:address', async (req, res) => {
        console.log(req.params);
        const token_arr = await mist_wallet.list_tokens();
        const results = [];
        const wallet = new asimov_wallet_1.AsimovWallet({
            name: cfg_1.default.fauct_address,
            rpc: cfg_1.default.asimov_master_rpc,
            mnemonic: cfg_1.default.fauct_word,
        });
        const address = req.params.address;
        for (const i in token_arr) {
            setTimeout(async () => {
                const [err, result] = await await_to_js_1.default(wallet.commonTX.transfer(address, faucet_amount[i], token_arr[i].asim_assetid));
                results.push[result];
                if (err)
                    console.error(err);
            }, Number(i) * 20000);
        }
        console.log(results);
        res.json({ result: results });
    });
    wallet.all('/faucet_asim/:address', async (req, res) => {
        console.log(req.params);
        await mist_wallet.list_tokens();
        const wallet = new asimov_wallet_1.AsimovWallet({
            name: cfg_1.default.fauct_address,
            rpc: cfg_1.default.asimov_child_rpc,
            mnemonic: cfg_1.default.fauct_word,
        });
        const address = req.params.address;
        const token_info = await psql_db.get_tokens(['ASIM']);
        const [err, result] = await await_to_js_1.default(wallet.commonTX.transfer(address, 10000, token_info[0].asim_assetid));
        if (err)
            console.log(err);
        res.json({ result });
    });
    wallet.all('/faucet3/:address', async (req, res) => {
        console.log(req.params);
        const token_arr = await mist_wallet.list_tokens();
        const results = [];
        const wallet = new asimov_wallet_1.AsimovWallet({
            name: cfg_1.default.fauct_address,
            rpc: cfg_1.default.asimov_master_rpc,
            mnemonic: cfg_1.default.fauct_word,
        });
        const address = req.params.address;
        for (const i in token_arr) {
            setTimeout(async () => {
                const [err, result] = await await_to_js_1.default(wallet.commonTX.transfer(address, big_faucet_amount[i], token_arr[i].asim_assetid));
                results.push[result];
                if (err)
                    console.log(err);
            }, Number(i) * 20000);
        }
        console.log(results);
        res.json({ result: results });
    });
    wallet.all('/sendrawtransaction/asset2coin/:amount/:address/:token_name/:sign_data', async (req, res) => {
        const sign_data = [req.params.sign_data];
        const [err, result] = await await_to_js_1.default(chain_1.chain.sendrawtransaction(sign_data));
        if (!err) {
            const token_info = await psql_db.get_tokens([req.params.token_name]);
            console.log('sss--', token_info);
            const current_time = utils.get_current_time();
            const info = {
                id: null,
                address: req.params.address,
                asim_token_name: req.params.token_name,
                erc20_totken_name: req.params.token_name,
                side: 'asset2coin',
                asim_token_contract: token_info[0].asim_address,
                asim_token_id: token_info[0].asim_assetid,
                erc20_token_contract: token_info[0].address,
                status: 'successful',
                txid: result,
                amount: req.params.amount,
                fee_token: 'ASIM',
                fee_token_amount: 0.2,
                created_at: current_time,
            };
            if (err) {
                info.status = 'failed';
            }
            info.id = utils.get_hash(info);
            const arr_info = utils.arr_values(info);
            const [err2, result2] = await await_to_js_1.default(psql_db.insert_converts(arr_info));
            if (err2)
                console.log(err2, result2);
        }
        res.json({ result, err });
    });
    wallet.all('/sendrawtransaction/coin2asset/:amount/:address/:token_name/:sign_data', async (req, res) => {
        const sign_data = [req.params.sign_data];
        const [err, result] = await await_to_js_1.default(chain_1.chain.sendrawtransaction(sign_data));
        if (!err) {
            const token_info = await psql_db.get_tokens([req.params.token_name]);
            const current_time = utils.get_current_time();
            const info = {
                id: null,
                address: req.params.address,
                asim_token_name: req.params.token_name,
                erc20_totken_name: req.params.token_name,
                side: 'coin2asset',
                asim_token_contract: token_info[0].asim_address,
                asim_token_id: token_info[0].asim_assetid,
                erc20_token_contract: token_info[0].address,
                status: 'successful',
                txid: result,
                amount: req.params.amount,
                fee_token: 'ASIM',
                fee_token_amount: 0.2,
                created_at: current_time,
            };
            if (err) {
                info.status = 'failed';
            }
            info.id = utils.get_hash(info);
            const arr_info = utils.arr_values(info);
            const [err2, result2] = await await_to_js_1.default(psql_db.insert_converts(arr_info));
            if (err2)
                console.log(err2, result2);
        }
        res.json({ result, err });
    });
    wallet.all('/my_converts/:address', async (req, res) => {
        const [err, result] = await await_to_js_1.default(psql_db.my_converts([req.params.address]));
        res.json({ result, err });
    });
    wallet.all('/my_converts2/:address/:page/:perpage', async (req, res) => {
        const { address, page, perpage } = req.params;
        const offset = (+page - 1) * +perpage;
        const [err, result] = await await_to_js_1.default(psql_db.my_converts2([address, offset, perpage]));
        res.json({ result, err });
    });
    wallet.all('/sendrawtransaction/asset2coin_v2/:sign_data', async (req, res) => {
        const sign_data = [req.params.sign_data];
        const [master_err, master_txid] = await await_to_js_1.default(chain_1.chain.sendrawtransaction(sign_data));
        if (master_err == undefined) {
            const current_time = utils.get_current_time();
            const tmp_info = {
                txid: master_txid,
                time: current_time,
            };
            const tmp_id = utils.get_hash(tmp_info);
            setTimeout(async () => {
                const [decode_err, decode_info] = await await_to_js_1.default(utils.decode_transfer_info(master_txid));
                const { from, asset_id, vin_amount, to_amount, remain_amount, fee_amount, fee_asset } = decode_info;
                if (decode_err) {
                    console.log('utils.decode_transfer_info error', decode_err, decode_info, vin_amount, to_amount, remain_amount);
                    return res.json({
                        success: false,
                        err: decode_err.message,
                    });
                }
                if (decode_info.to != cfg_1.default.bridge_address) {
                    return res.json({
                        success: false,
                        err: 'reciver ' + decode_info.to + ' is not official address',
                    });
                }
                const transfer_tokens = await psql_db.get_tokens([asset_id]);
                const fee_tokens = await psql_db.get_tokens([fee_asset]);
                const wallet = new asimov_wallet_1.AsimovWallet({
                    name: 'test',
                    rpc: cfg_1.default.asimov_child_rpc,
                    mnemonic: cfg_1.default.bridge_word,
                });
                const [child_err, child_txid] = await await_to_js_1.default(wallet.contractCall.call(transfer_tokens[0].address, 'mint(address,uint256)', [from, number_precision_1.default.times(to_amount, 100000000)], asimov_wallet_1.AsimovConst.DEFAULT_GAS_LIMIT, 0, asimov_wallet_1.AsimovConst.DEFAULT_ASSET_ID, asimov_wallet_1.AsimovConst.DEFAULT_FEE_AMOUNT, asimov_wallet_1.AsimovConst.DEFAULT_ASSET_ID, asimov_wallet_1.AsimovConst.CONTRACT_TYPE.CALL));
                if (child_err)
                    console.log('child_err,child_txid', child_err, child_txid);
                const info = {
                    id: null,
                    address: from,
                    token_name: transfer_tokens[0].symbol,
                    amount: to_amount,
                    side: 'asset2coin',
                    master_txid,
                    master_txid_status: 'successful',
                    child_txid,
                    child_txid_status: child_txid == undefined ? 'failed' : 'successful',
                    fee_asset: fee_tokens[0].symbol,
                    fee_amount,
                };
                info.id = tmp_id;
                const info_arr = utils.arr_values(info);
                const [err3, result3] = await await_to_js_1.default(psql_db.insert_bridge(info_arr));
                if (err3)
                    console.log(err3, result3);
                return res.json({
                    success: err3 == undefined ? true : false,
                    err: err3,
                });
            }, 10000);
            return res.json({ success: true, id: tmp_id });
        }
        res.json({ success: false, err: master_err });
    });
    wallet.all('/sendrawtransaction/coin2asset_v2', async (req, res) => {
        const { signature, address, token_name, amount, expire_time } = req.body;
        const current_time = new Date().getTime();
        if (+current_time > +expire_time) {
            return res.json({ success: false, err: 'sign data expire' });
        }
        const tokens = await psql_db.get_tokens([token_name]);
        const info = ['MIST_BURN', tokens[0].address, cfg_1.default.bridge_address, amount, expire_time];
        const str = info.join('');
        const root_hash = crypto_sha256.createHmac('sha256', '123');
        const hash = root_hash.update(str, 'utf8').digest('hex');
        const result = utils.verify(hash, signature);
        if (!result) {
            return res.json({
                success: false,
                err: 'verify failed',
            });
        }
        const child_wallet = new asimov_wallet_1.AsimovWallet({
            name: 'test',
            rpc: cfg_1.default.asimov_child_rpc,
            mnemonic: cfg_1.default.bridge_word,
        });
        const [child_err, child_txid] = await await_to_js_1.default(child_wallet.contractCall.call(tokens[0].address, 'burn(address,uint256)', [address, number_precision_1.default.times(amount, 100000000)], asimov_wallet_1.AsimovConst.DEFAULT_GAS_LIMIT, 0, asimov_wallet_1.AsimovConst.DEFAULT_ASSET_ID, asimov_wallet_1.AsimovConst.DEFAULT_FEE_AMOUNT, asimov_wallet_1.AsimovConst.DEFAULT_ASSET_ID, asimov_wallet_1.AsimovConst.CONTRACT_TYPE.CALL));
        if (child_err)
            console.log('child_err---child_txid', child_err, child_txid);
        const master_wallet = new asimov_wallet_1.AsimovWallet({
            name: 'test3',
            rpc: cfg_1.default.asimov_master_rpc,
            mnemonic: cfg_1.default.bridge_word,
        });
        await master_wallet.account.createAccount();
        const [master_err, master_txid] = await await_to_js_1.default(master_wallet.commonTX.transfer(address, amount, tokens[0].asim_assetid));
        if (master_err)
            console.log('err,master_txid', master_err, master_txid, tokens[0].asim_assetid);
        const insert_info = {
            id: null,
            address,
            token_name: tokens[0].symbol,
            amount,
            side: 'coin2asset',
            master_txid,
            master_txid_status: 'successful',
            child_txid,
            child_txid_status: child_txid == undefined ? 'failed' : 'successful',
            fee_asset: 'ASIM',
            fee_amount: 0.02,
        };
        insert_info.id = utils.get_hash(insert_info);
        const info_arr = utils.arr_values(insert_info);
        const [err3, result3] = await await_to_js_1.default(psql_db.insert_bridge(info_arr));
        if (err3)
            console.log(err3, result3);
        return res.json({
            success: result3 == undefined ? false : true,
            id: insert_info.id,
        });
    });
    wallet.all('/sendrawtransaction/asset2coin_v3/:sign_data', async (req, res) => {
        const sign_data = [req.params.sign_data];
        const [master_err, master_txid] = await await_to_js_1.default(chain_1.chain.sendrawtransaction(sign_data));
        if (master_err == undefined) {
            const info = {
                id: null,
                address: null,
                token_name: null,
                amount: null,
                side: 'asset2coin',
                master_txid,
                master_txid_status: 'pending',
                child_txid: null,
                child_txid_status: 'pending',
                fee_asset: null,
                fee_amount: null,
            };
            info.id = utils.get_hash(info);
            const info_arr = utils.arr_values(info);
            const [err3, result3] = await await_to_js_1.default(psql_db.insert_bridge(info_arr));
            if (err3)
                console.log(err3, result3);
            setTimeout(async () => {
                const [decode_err, decode_info] = await await_to_js_1.default(utils.decode_transfer_info(master_txid));
                const { from, asset_id, vin_amount, to_amount, remain_amount, fee_amount, fee_asset } = decode_info;
                if (decode_err)
                    console.log(decode_err, vin_amount, remain_amount);
                let master_txid_status;
                if (!decode_err) {
                    master_txid_status = 'successful';
                }
                else {
                    master_txid_status = 'illegaled';
                }
                if (decode_info.to != cfg_1.default.bridge_address) {
                    master_txid_status = 'illegaled';
                    console.error(`reciver ${decode_info.to}  is not official address`);
                    return;
                }
                const transfer_tokens = await psql_db.get_tokens([asset_id]);
                const fee_tokens = await psql_db.get_tokens([fee_asset]);
                const current_time = utils.get_current_time();
                const update_info = {
                    address: from,
                    token_name: transfer_tokens[0].symbol,
                    amount: to_amount,
                    master_txid_status,
                    child_txid_status: 'pending',
                    fee_asset: fee_tokens[0].symbol,
                    fee_amount,
                    updated_at: current_time,
                    id: info.id,
                };
                const update_info_arr = utils.arr_values(update_info);
                const [err3, result3] = await await_to_js_1.default(psql_db.update_asset2coin_decode(update_info_arr));
                if (err3)
                    console.log('psql_db.update_asset2coin_decode----', err3, result3);
            }, 10000);
            return res.json({ success: true, id: info.id });
        }
        res.json({ success: false, err: master_err });
    });
    wallet.all('/sendrawtransaction/coin2asset_v3', async (req, res) => {
        const { signature, address, token_name, amount, expire_time } = req.body;
        const current_time = new Date().getTime();
        if (+current_time > +expire_time) {
            return res.json({ success: false, err: 'sign data expire' });
        }
        const tokens = await psql_db.get_tokens([token_name]);
        const info = ['MIST_BURN', tokens[0].address, cfg_1.default.bridge_address, amount, expire_time];
        const str = info.join('');
        const root_hash = crypto_sha256.createHmac('sha256', '123');
        const hash = root_hash.update(str, 'utf8').digest('hex');
        const result = utils.verify(hash, signature);
        if (!result) {
            return res.json({
                success: false,
                err: 'verify failed',
            });
        }
        let fee_amount = 0;
        for (const fee of coin2asset_fee) {
            if (token_name == fee.token) {
                fee_amount = fee.amount;
                if (amount <= fee_amount) {
                    return res.json({
                        success: false,
                        err: 'fee is not enough',
                    });
                }
            }
        }
        const insert_info = {
            id: null,
            address,
            token_name: tokens[0].symbol,
            amount: number_precision_1.default.minus(amount, fee_amount),
            side: 'coin2asset',
            master_txid: null,
            master_txid_status: 'pending',
            child_txid: null,
            child_txid_status: 'pending',
            fee_asset: tokens[0].symbol,
            fee_amount,
        };
        insert_info.id = utils.get_hash(insert_info);
        const info_arr = utils.arr_values(insert_info);
        const [err3, result3] = await await_to_js_1.default(psql_db.insert_bridge(info_arr));
        if (err3)
            console.log(err3);
        return res.json({
            success: result3 == undefined ? false : true,
            id: result3 == undefined ? '' : insert_info.id,
        });
    });
    wallet.all('/burn_coin_tohex/:address/:token_name/:amount', async (req, res) => {
        const { address, token_name, amount } = req.params;
        const expire_time = 600;
        const tokens = await psql_db.get_tokens([token_name]);
        const wallet = new asimov_wallet_1.AsimovWallet({
            name: address,
            rpc: cfg_1.default.asimov_child_rpc,
            address,
        });
        await wallet.account.createAccount();
        const balance = await wallet.contractCall.callReadOnly(tokens[0].address, 'balanceOf(address)', [address]);
        const available_amount = number_precision_1.default.divide(balance, 100000000);
        if (available_amount < amount) {
            return res.json({
                success: false,
                err: `Lack of balance,you have ${available_amount} ${token_name} but want spend ${amount}`,
            });
        }
        if (expire_time <= 0 || expire_time > 3600) {
            return res.json({
                success: false,
                err: 'the expire_time must be less than 1 hour and more than 0',
            });
        }
        const expire_at = new Date().getTime() + expire_time * 1000;
        const info = ['MIST_BURN', tokens[0].address, cfg_1.default.bridge_address, amount, expire_at];
        const str = info.join('');
        const root_hash = crypto_sha256.createHmac('sha256', '123');
        const hash = root_hash.update(str, 'utf8').digest('hex');
        res.json({
            success: true,
            hash,
            expire_at,
        });
    });
    wallet.all('/find_convert/:id', async (req, res) => {
        const [err, convert] = await await_to_js_1.default(psql_db.find_bridge([req.params.id]));
        if (err) {
            return res.json({
                success: false,
                err,
            });
        }
        else if (convert && convert.length == 0) {
            return res.json({
                success: true,
                result: [],
            });
        }
        else {
            return res.json({
                success: true,
                result: convert[0],
            });
        }
    });
    wallet.all('/my_converts_v2/:address/:page/:perpage', async (req, res) => {
        const { address, page, perpage } = req.params;
        const offset = (+page - 1) * +perpage;
        const [err, result] = await await_to_js_1.default(psql_db.my_bridge([address, offset, perpage]));
        const success = result == undefined ? false : true;
        res.json({ success, result, err });
    });
    wallet.all('/my_converts_v3/:address/:token_name/:page/:perpage', async (req, res) => {
        const { address, token_name, page, perpage } = req.params;
        const offset = (+page - 1) * +perpage;
        const [err, result] = await await_to_js_1.default(psql_db.my_bridge_v3([address, token_name, offset, perpage]));
        const success = result == undefined ? false : true;
        res.json({ success, result, err });
    });
    wallet.all('/coin2asset_fee_config', async (req, res) => {
        res.json({
            success: true,
            result: coin2asset_fee,
        });
    });
    wallet.all('/sendrawtransaction/:sign_data', async (req, res) => {
        const sign_data = [req.params.sign_data];
        const [err, result] = await await_to_js_1.default(chain_1.chain.sendrawtransaction(sign_data));
        res.json({ result, err });
    });
    wallet.all('/list_cdp_info', async (req, res) => {
        const [err, result] = await await_to_js_1.default(psql_db.list_cdp());
        res.json({ result, err });
    });
    wallet.all('/erc20_faucet/:address', async (req, res) => {
        const token_arr = await mist_wallet.list_tokens();
        const results = [];
        for (const i in token_arr) {
            setTimeout(async () => {
                const wallet = new asimov_wallet_1.AsimovWallet({
                    name: 'test',
                    rpc: cfg_1.default.asimov_child_rpc,
                    mnemonic: cfg_1.default.bridge_word,
                });
                const to_amount = 90000000;
                const [child_err, child_txid] = await await_to_js_1.default(wallet.contractCall.call(token_arr[i].address, 'mint(address,uint256)', [req.params.address, number_precision_1.default.times(to_amount, 100000000)], asimov_wallet_1.AsimovConst.DEFAULT_GAS_LIMIT, 0, asimov_wallet_1.AsimovConst.DEFAULT_ASSET_ID, asimov_wallet_1.AsimovConst.DEFAULT_FEE_AMOUNT, asimov_wallet_1.AsimovConst.DEFAULT_ASSET_ID, asimov_wallet_1.AsimovConst.CONTRACT_TYPE.CALL));
                results.push[child_txid];
                if (child_err)
                    console.log('---------erc20_token_arr--err-result', child_err, child_txid, '\n\n\n\n');
            }, Number(i) * 20000);
        }
        res.json({ result: '', err: '' });
    });
    wallet.all('/get_blockchain_info', async (req, res) => {
        const [err, result] = await await_to_js_1.default(chain_1.chain.getblockchaininfo());
        const [err2, result2] = await await_to_js_1.default(chain_1.chain.getblockchaininfo(undefined, 'child_poa'));
        if (err2)
            console.error(err2);
        res.json({ result, result2, err });
    });
    wallet.all('/my_bridge_length/:address', async (req, res) => {
        const { address } = req.params;
        const [err, result] = await await_to_js_1.default(psql_db.my_bridge_length([address]));
        return res.json({
            success: result == undefined ? false : true,
            result,
            err,
        });
    });
    wallet.all('/list_fingo_config', async (req, res) => {
        const conf = {
            dex_address: cfg_1.default.ex_address,
            express_address: cfg_1.default.express_address,
            asimov_chain_rpc: cfg_1.default.asimov_chain_rpc,
            bridge_address: cfg_1.default.bridge_address,
        };
        res.json({
            success: true,
            result: conf,
        });
    });
    return wallet;
};
//# sourceMappingURL=index.js.map