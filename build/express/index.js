"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const await_to_js_1 = require("await-to-js");
const number_precision_1 = require("number-precision");
const express_1 = require("express");
const chain_1 = require("../wallet/api/chain");
const walletHelper_1 = require("../wallet/lib/walletHelper");
const Asset_1 = require("../wallet//asset/Asset");
const mist_wallet_1 = require("../adex/api/mist_wallet");
const order_1 = require("../adex/api/order");
const utils_1 = require("../adex/api/utils");
const db_1 = require("./models/db");
const cfg_1 = require("../cfg");
const express_config = [
    {
        token: 'CNYC',
        min: 60,
        max: 60000,
    }, {
        token: 'USDT',
        min: 10,
        max: 10000,
    }, {
        token: 'ASIM',
        min: 1,
        max: 1000,
    }, {
        token: 'MT',
        min: 1,
        max: 1000,
    }, {
        token: 'ETH',
        min: 0.06,
        max: 60,
    }, {
        token: 'BTC',
        min: 0.001,
        max: 1,
    }
];
async function my_wallet(word) {
    return await walletHelper_1.default.testWallet(word, '111111');
}
async function get_price(base_token_name, quote_token_name, amount, order) {
    let base_value = 0;
    let base_amount = 0;
    if (base_token_name != 'CNYC') {
        const base_book = await order.order_book(base_token_name + '-CNYC');
        const base_bids = base_book.bids;
        for (const index in base_bids) {
            const tmp_amount = base_amount;
            base_amount += (+base_bids[index][1]);
            if (base_amount >= amount) {
                base_value += number_precision_1.default.times(amount - tmp_amount, base_bids[index][0]);
                break;
            }
            else {
                base_value += number_precision_1.default.times(base_bids[index][1], base_bids[index][0]);
            }
        }
    }
    else {
        base_value = number_precision_1.default.times(amount, 1);
    }
    let quote_value = 0;
    let quote_amount = 0;
    if (quote_token_name != 'CNYC') {
        const quote_book = await order.order_book(quote_token_name + '-CNYC');
        const quote_asks = quote_book.asks.reverse();
        for (const index in quote_asks) {
            const tmp_value = quote_value;
            quote_value += number_precision_1.default.times(quote_asks[index][1], quote_asks[index][0]);
            if (quote_value >= base_value) {
                quote_amount += number_precision_1.default.divide(base_value - tmp_value, quote_asks[index][0]);
                break;
            }
            else {
                quote_amount += (+quote_asks[index][1]);
            }
        }
    }
    else {
        quote_amount = number_precision_1.default.divide(base_value, 1);
    }
    const price = number_precision_1.default.divide(quote_amount, amount).toFixed(8);
    return price;
}
exports.default = () => {
    const express = express_1.Router();
    const mist_wallet = new mist_wallet_1.default();
    const psql_db = new db_1.default();
    const utils = new utils_1.default();
    const order = new order_1.default(psql_db);
    express.all('/my_records/:address/:page/:perpage', async (req, res) => {
        const { address, page, perpage } = req.params;
        const offset = (+page - 1) * +perpage;
        const [err, records] = await await_to_js_1.default(psql_db.my_express([address, offset, perpage]));
        for (const record of records) {
            record.base_token_icon = 'http://fingo-cdn.asimov.work/res/icons/' + record.base_asset_name + 'a.png';
            record.quote_token_icon = 'http://fingo-cdn.asimov.work/res/icons/' + record.quote_asset_name + 'a.png';
        }
        res.json({
            success: records == undefined ? false : true,
            result: records,
            err
        });
    });
    express.all('/get_express_trade/:trade_id', async (req, res) => {
        const { trade_id } = req.params;
        const [err, record] = await await_to_js_1.default(psql_db.find_express([trade_id]));
        if (err) {
            return res.json({
                success: false,
                err
            });
        }
        if (record && record.length == 0) {
            return res.json({
                success: true,
                result: []
            });
        }
        if (record[0].base_asset_name && record[0].quote_asset_name) {
            record[0].base_token_icon = 'http://fingo-cdn.asimov.work/res/icons/' + record[0].base_asset_name + 'a.png';
            record[0].quote_token_icon = 'http://fingo-cdn.asimov.work/res/icons/' + record[0].quote_asset_name + 'a.png';
        }
        else {
            record[0].base_token_icon = null;
            record[0].quote_token_icon = null;
        }
        res.json({
            success: true,
            result: record[0],
            err
        });
    });
    express.all('/config', async (req, res) => {
        res.json({
            success: true,
            result: express_config
        });
    });
    express.all('/get_price/:base_token_name/:quote_token_name/:base_amount', async (req, res) => {
        const { base_token_name, quote_token_name, base_amount } = req.params;
        const [err, price] = await await_to_js_1.default(get_price(base_token_name, quote_token_name, base_amount, order));
        res.json({
            success: price == undefined ? false : true,
            result: price,
            err
        });
    });
    express.all('/my_express_length/:address', async (req, res) => {
        const { address } = req.params;
        const [err, result] = await await_to_js_1.default(psql_db.my_express_length([address]));
        res.json({
            success: result == undefined ? false : true,
            result,
            err
        });
    });
    express.all('/get_pool_info', async (req, res) => {
        const token_arr = await mist_wallet.list_tokens();
        const balances = [];
        for (const i in token_arr) {
            const asset = new Asset_1.default(token_arr[i].asim_assetid);
            const [err4, assets_balance] = await await_to_js_1.default(asset.balanceOf(cfg_1.default.express_address));
            if (err4)
                console.error(err4);
            let asset_balance = 0;
            for (const j in assets_balance) {
                if (token_arr[i].asim_assetid == assets_balance[j].asset) {
                    asset_balance = assets_balance[j].value;
                }
            }
            const icon = 'http://fingo-cdn.asimov.work/res/icons/' + token_arr[i].symbol + 'a.png';
            const balance_info = {
                token_symbol: token_arr[i].symbol,
                asim_asset_id: token_arr[i].asim_assetid,
                asim_asset_balance: asset_balance,
                icon
            };
            balances.push(balance_info);
            console.log(balance_info);
        }
        res.json({
            success: true,
            result: balances,
        });
    });
    express.all('/sendrawtransaction/build_express/:base_token_name/:quote_token_name/:amount/:address/:sign_data', async (req, res) => {
        const { base_token_name, quote_token_name, amount, address, sign_data } = req.params;
        const [base_err, base_txid] = await await_to_js_1.default(chain_1.chain.sendrawtransaction([sign_data]));
        const base_tx_status = base_txid == undefined ? 'failed' : 'successful';
        const [err, price] = await await_to_js_1.default(get_price(base_token_name, quote_token_name, amount, order));
        if (err)
            console.error(err);
        const quote_amount = number_precision_1.default.times(amount, Number(price), 0.995);
        const fee_amount = number_precision_1.default.times(amount, Number(price), 0.005);
        let quote_tx_status, quote_err, quote_txid;
        if (!base_err) {
            const walletInst = await my_wallet(cfg_1.default.express_word);
            const tokens = await psql_db.get_tokens([quote_token_name]);
            const asset = new Asset_1.default(tokens[0].asim_assetid);
            asset.unlock(walletInst, cfg_1.default.wallet_default_passwd);
            await walletInst.queryAllBalance();
            [quote_err, quote_txid] = await await_to_js_1.default(asset.transfer(address, quote_amount));
            quote_tx_status = quote_txid == undefined ? 'failed' : 'successful';
        }
        const info = {
            trade_id: null,
            address,
            base_asset_name: base_token_name,
            base_amount: amount,
            price,
            quote_asset_name: quote_token_name,
            quote_amount,
            fee_rate: 0.005,
            fee_token: quote_token_name,
            fee_amount,
            base_txid,
            base_tx_status,
            quote_txid,
            quote_tx_status
        };
        info.trade_id = utils.get_hash(info);
        const info_arr = utils.arr_values(info);
        const [err3, result3] = await await_to_js_1.default(psql_db.insert_express(info_arr));
        if (err3)
            console.error(err3, result3);
        let success;
        if (base_tx_status == 'successful' && quote_tx_status == 'successful' && !err3) {
            success = true;
        }
        else {
            success = false;
        }
        res.json({
            success,
            trade_id: info.trade_id,
            base_err,
            quote_err
        });
    });
    express.all('/sendrawtransaction/build_express_v2/:quote_token_name/:sign_data', async (req, res) => {
        const { quote_token_name, sign_data } = req.params;
        const [base_err, base_txid] = await await_to_js_1.default(chain_1.chain.sendrawtransaction([sign_data]));
        let trade_id;
        if (base_txid) {
            const info = {
                trade_id: null,
                address: null,
                base_asset_name: null,
                base_amount: null,
                price: null,
                quote_asset_name: quote_token_name,
                quote_amount: null,
                fee_rate: 0.005,
                fee_token: quote_token_name,
                fee_amount: null,
                base_txid,
                base_tx_status: 'pending',
                quote_txid: null,
                quote_tx_status: 'pending'
            };
            info.trade_id = utils.get_hash(info);
            trade_id = info.trade_id;
            const info_arr = utils.arr_values(info);
            const [err3, result3] = await await_to_js_1.default(psql_db.insert_express(info_arr));
            if (err3)
                console.error(err3, result3);
            res.json({
                success: true,
                trade_id: info.trade_id,
            });
        }
        else {
            res.json({
                success: false,
                err: base_err
            });
        }
        setTimeout(async () => {
            const [decode_err, decode_info] = await await_to_js_1.default(utils.decode_transfer_info(base_txid));
            const { from, asset_id, vin_amount, to_amount, remain_amount } = decode_info;
            let base_tx_status;
            if (!decode_err) {
                base_tx_status = 'successful';
            }
            else {
                console.error(decode_err, from, asset_id, vin_amount, to_amount, remain_amount);
                base_tx_status = 'illegaled';
            }
            if (decode_info.to != cfg_1.default.express_address) {
                base_tx_status = 'illegaled';
                console.error(`reciver ${decode_info.to}  is not official address`);
            }
            const [err3, base_token] = await await_to_js_1.default(psql_db.get_tokens([asset_id]));
            if (err3 || !base_token || base_token.length == 0) {
                base_tx_status = 'illegaled';
                console.error(`asset ${asset_id}  is not support`);
            }
            const [err, price] = await await_to_js_1.default(get_price(base_token[0].symbol, quote_token_name, to_amount, order));
            if (err)
                console.error(err);
            const current_time = utils.get_current_time();
            const quote_amount = number_precision_1.default.times(to_amount, Number(price), 0.995);
            const fee_amount = number_precision_1.default.times(to_amount, Number(price), 0.005);
            const info = {
                address: from,
                base_asset_name: base_token[0].symbol,
                base_amount: to_amount,
                price,
                quote_amount,
                fee_amount,
                base_tx_status,
                quote_tx_status: 'pending',
                updated_at: current_time,
                trade_id
            };
            const info_arr = utils.arr_values(info);
            const [err4, result4] = await await_to_js_1.default(psql_db.update_base(info_arr));
            if (err4)
                console.error(err4, result4);
        }, 10000);
    });
    return express;
};
//# sourceMappingURL=index.js.map