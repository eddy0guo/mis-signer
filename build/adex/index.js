"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const await_to_js_1 = require("await-to-js");
const express_1 = require("express");
const number_precision_1 = require("number-precision");
const apicache = require("apicache");
const urllib = require('url');
const crypto_sha256 = require('crypto');
const cache = apicache.middleware;
const Token_1 = require("../wallet/contract/Token");
const walletHelper_1 = require("../wallet/lib/walletHelper");
const order_1 = require("./api/order");
const trades_1 = require("./api/trades");
const market_1 = require("./api/market");
const utils_1 = require("./api/utils");
const Asset_1 = require("../wallet/asset/Asset");
const db_1 = require("./models/db");
const mist_wallet_1 = require("./api/mist_wallet");
const cfg_1 = require("../cfg");
async function my_wallet(word) {
    return await walletHelper_1.default.testWallet(word, '111111');
}
async function get_available_erc20_amount(address, symbol) {
    const mist_wallet = new mist_wallet_1.default();
    const client = new db_1.default();
    const token_info = await mist_wallet.get_token(symbol);
    const token = new Token_1.default(token_info[0].address);
    let [err, balance] = await await_to_js_1.default(token.balanceOf(address, 'child_poa'));
    if (err)
        console.error(err);
    balance = number_precision_1.default.divide(balance, 1 * 10 ** 8);
    let freeze_amount = 0;
    const freeze_result = await client.get_freeze_amount([address, symbol]);
    if (freeze_result && freeze_result.length > 0) {
        for (const freeze of freeze_result) {
            if (freeze.side == 'buy') {
                freeze_amount = number_precision_1.default.plus(freeze_amount, freeze.quote_amount);
            }
            else if (freeze.side == 'sell') {
                freeze_amount = number_precision_1.default.plus(freeze_amount, freeze.base_amount);
            }
            else {
                console.error(`${freeze.side} error`);
            }
        }
    }
    return number_precision_1.default.minus(balance, freeze_amount);
}
exports.default = () => {
    const adex = express_1.Router();
    const client = new db_1.default();
    const order = new order_1.default(client);
    const trades = new trades_1.default(client);
    const market = new market_1.default();
    const mist_wallet = new mist_wallet_1.default();
    const utils = new utils_1.default();
    adex.all('/mist_engine_info', async (req, res) => {
        const result = await trades.get_engine_info();
        console.log(result);
        res.json({ result });
    });
    adex.all('/mist_user_overview/:address', async (req, res) => {
        const address = req.params.address;
        const [current_order_err, current_orders_length] = await await_to_js_1.default(order.my_orders_length(address, 'pending', 'partial_filled'));
        const [history_order_err, history_orders_length] = await await_to_js_1.default(order.my_orders_length(address, 'cancled', 'full_filled'));
        const [trades_err, trades_length] = await await_to_js_1.default(trades.my_trades_length(address));
        const [birdge_err, bridge_length] = await await_to_js_1.default(client.my_bridge_length([address]));
        if (current_order_err || history_order_err || trades_err || birdge_err) {
            console.error('get fingo_user_overview error', current_order_err, history_order_err, trades_err, birdge_err);
            return res.json({
                success: false,
            });
        }
        res.json({
            success: true,
            current_orders_length,
            history_orders_length,
            trades_length,
            bridge_length,
        });
    });
    adex.all('/list_market_quotations', async (req, res) => {
        const result = await market.list_market_quotations();
        console.log(result);
        res.json({ result });
    });
    adex.all('/list_market_quotations_v2', async (req, res) => {
        const result = await market.list_market_quotations();
        res.json({
            success: true,
            result,
        });
    });
    adex.all('/list_tokens', async (req, res) => {
        const result = await mist_wallet.list_tokens();
        console.log(result);
        res.json({ result });
    });
    adex.all('/list_tokens_v2', async (req, res) => {
        const result = await mist_wallet.list_tokens();
        res.json({
            success: true,
            result,
        });
    });
    adex.all('/get_token_price', async (req, res) => {
        const obj = urllib.parse(req.url, true).query;
        const result = await mist_wallet.get_token_price2pi(obj.symbol);
        console.log(result);
        res.json({ result });
    });
    adex.all('/get_token_price_v2/:symbol', async (req, res) => {
        const { symbol } = req.params;
        const result = await mist_wallet.get_token_price2pi(symbol);
        res.json({
            success: true,
            result,
        });
    });
    adex.all('/get_token_price2btc', async (req, res) => {
        const obj = urllib.parse(req.url, true).query;
        const result = await mist_wallet.get_token_price2btc(obj.symbol);
        console.log(result);
        res.json({ result });
    });
    adex.all('/balances', async (req, res) => {
        const obj = urllib.parse(req.url, true).query;
        const token_arr = await mist_wallet.list_tokens();
        const balances = [];
        for (const i in token_arr) {
            const token = new Token_1.default(token_arr[i].address);
            const [err, result] = await await_to_js_1.default(token.balanceOf(obj.address));
            if (err)
                console.error(err);
            const [err3, allowance] = await await_to_js_1.default(token.allowance(obj.address, cfg_1.default.ex_address));
            if (err3)
                console.error(err3);
            const asset = new Asset_1.default(token_arr[i].asim_assetid);
            const [err4, assets_balance] = await await_to_js_1.default(asset.balanceOf(obj.address));
            if (err4)
                console.error(err4);
            let asset_balance = 0;
            for (const j in assets_balance) {
                if (token_arr[i].asim_assetid == assets_balance[j].asset) {
                    asset_balance = assets_balance[j].value;
                }
            }
            const balance_info = {
                token_symbol: token_arr[i].symbol,
                token_name: token_arr[i].name,
                balance: result / (1 * 10 ** 8),
                allowance_ex: allowance / (1 * 10 ** 8),
                asim_assetid: token_arr[i].asim_assetid,
                asim_asset_balance: asset_balance,
            };
            balances.push(balance_info);
            console.log(balance_info);
        }
        res.json(balances);
    });
    adex.all('/balances_v2', async (req, res) => {
        const obj = urllib.parse(req.url, true).query;
        const token_arr = await mist_wallet.list_tokens();
        const balances = [];
        for (const i in token_arr) {
            const token = new Token_1.default(token_arr[i].address);
            const [err, result] = await await_to_js_1.default(token.balanceOf(obj.address, 'child_poa'));
            if (err)
                console.error(err);
            const asset = new Asset_1.default(token_arr[i].asim_assetid);
            const [err4, assets_balance] = await await_to_js_1.default(asset.balanceOf(obj.address));
            if (err4)
                console.error(err4);
            console.log('---balances=%o----------', assets_balance);
            let asset_balance = 0;
            for (const j in assets_balance) {
                if (token_arr[i].asim_assetid == assets_balance[j].asset) {
                    asset_balance = assets_balance[j].value;
                }
            }
            let freeze_amount = 0;
            const freeze_result = await client.get_freeze_amount([obj.address, token_arr[i].symbol]);
            if (freeze_result && freeze_result.length > 0) {
                for (const freeze of freeze_result) {
                    if (freeze.side == 'buy') {
                        freeze_amount = number_precision_1.default.plus(freeze_amount, freeze.quote_amount);
                    }
                    else if (freeze.side == 'sell') {
                        freeze_amount = number_precision_1.default.plus(freeze_amount, freeze.base_amount);
                    }
                    else {
                        console.error(`${freeze.side} error`);
                    }
                }
            }
            const balance_info = {
                token_symbol: token_arr[i].symbol,
                erc20_address: token_arr[i].address,
                erc20_balance: result / (1 * 10 ** 8),
                erc20_freeze_amount: freeze_amount,
                asim_assetid: token_arr[i].asim_assetid,
                asim_asset_balance: asset_balance / (1 * 10 ** 8),
                asset_icon: 'http://fingo-cdn.asimov.work/res/icons/' + token_arr[i].symbol + 'a.png',
                coin_icon: 'http://fingo-cdn.asimov.work/res/icons/' + token_arr[i].symbol + 'm.png',
            };
            balances.push(balance_info);
        }
        res.json({
            success: true,
            result: balances,
        });
    });
    adex.all('/asset_balances/:address', async (req, res) => {
        const { address } = req.params;
        const token_arr = await mist_wallet.list_tokens();
        const balances = [];
        for (const i in token_arr) {
            const asset = new Asset_1.default(token_arr[i].asim_assetid);
            const [err4, assets_balance] = await await_to_js_1.default(asset.balanceOf(address));
            if (err4)
                console.error(err4);
            let asset_balance = 0;
            for (const j in assets_balance) {
                if (token_arr[i].asim_assetid == assets_balance[j].asset) {
                    asset_balance = assets_balance[j].value;
                }
            }
            const price = await mist_wallet.get_token_price2pi(token_arr[i].symbol);
            const balance_info = {
                token_symbol: token_arr[i].symbol,
                asim_assetid: token_arr[i].asim_assetid,
                asim_asset_balance: asset_balance,
                value: number_precision_1.default.times(asset_balance, price),
                token_icon: 'http://fingo-cdn.asimov.work/res/icons/' + token_arr[i].symbol + 'a.png',
            };
            balances.push(balance_info);
        }
        res.json({
            success: true,
            result: balances,
        });
    });
    adex.all('/erc20_balances/:address', async (req, res) => {
        const { address } = req.params;
        const token_arr = await mist_wallet.list_tokens();
        const balances = [];
        for (const i in token_arr) {
            const token = new Token_1.default(token_arr[i].address);
            const [err, result] = await await_to_js_1.default(token.balanceOf(address, 'child_poa'));
            if (err)
                console.error(err);
            let freeze_amount = 0;
            const freeze_result = await client.get_freeze_amount([address, token_arr[i].symbol]);
            if (freeze_result && freeze_result.length > 0) {
                for (const freeze of freeze_result) {
                    if (freeze.side == 'buy') {
                        freeze_amount = number_precision_1.default.plus(freeze_amount, freeze.quote_amount);
                    }
                    else if (freeze.side == 'sell') {
                        freeze_amount = number_precision_1.default.plus(freeze_amount, freeze.base_amount);
                    }
                    else {
                        console.error(`${freeze.side} error`);
                    }
                }
            }
            const price = await mist_wallet.get_token_price2pi(token_arr[i].symbol);
            const erc20_balance = result / (1 * 10 ** 8);
            const balance_info = {
                token_symbol: token_arr[i].symbol,
                erc20_address: token_arr[i].address,
                erc20_balance,
                erc20_freeze_amount: freeze_amount,
                asim_assetid: token_arr[i].asim_assetid,
                value: number_precision_1.default.times(erc20_balance, price),
                token_icon: 'http://fingo-cdn.asimov.work/res/icons/' + token_arr[i].symbol + 'm.png',
            };
            balances.push(balance_info);
        }
        res.json({
            success: true,
            result: balances,
        });
    });
    adex.all('/approves', async (req, res) => {
        const obj = urllib.parse(req.url, true).query;
        const token_arr = await mist_wallet.list_tokens();
        const txids = [];
        for (const i in token_arr) {
            const token = new Token_1.default(token_arr[i].address);
            const wallet = await my_wallet(obj.word);
            const address = await wallet.getAddress();
            token.unlock(wallet, '111111');
            const [err, balance] = await await_to_js_1.default(token.balanceOf(address));
            const [err3, allowance] = await await_to_js_1.default(token.allowance(address, cfg_1.default.ex_address));
            if (err || err3) {
                console.error(err, err3);
            }
            if (balance != allowance) {
                await wallet.queryAllBalance();
                const [err2, txid] = await await_to_js_1.default(token.approve(cfg_1.default.ex_address, 9999999));
                if (err2)
                    console.error(err2);
                txids.push(txid);
            }
        }
        res.json(txids);
    });
    adex.all('/get_order_id', async (req, res) => {
        const obj = urllib.parse(req.url, true).query;
        const message = {
            id: obj.null,
            trader_address: obj.trader_address,
            market_id: obj.marketID,
            side: obj.side,
            price: obj.price,
            amount: obj.amount,
            status: 'pending',
            type: 'limit',
            available_amount: obj.amount,
            confirmed_amount: 0,
            canceled_amount: 0,
            pending_amount: 0,
            updated_at: null,
            created_at: null,
        };
        const order_id = utils.get_hash(message);
        res.json(order_id);
    });
    adex.all('/get_order_id_v2/:trader_address/:marketID/:side/:price/:amount', async (req, res) => {
        const { trader_address, marketID, side, price, amount } = req.params;
        const message = {
            id: null,
            trader_address,
            market_id: marketID,
            side,
            price,
            amount,
            status: 'pending',
            type: 'limit',
            available_amount: amount,
            confirmed_amount: 0,
            canceled_amount: 0,
            pending_amount: 0,
            updated_at: null,
            created_at: null,
        };
        const order_id = utils.get_hash(message);
        res.json({
            success: true,
            result: order_id,
        });
    });
    adex.all('/build_order', async (req, res) => {
        const obj = urllib.parse(req.url, true).query;
        if (!(utils.judge_legal_num(+obj.amount) && utils.judge_legal_num(+obj.price))) {
            return res.json('amount or price is cannt support');
        }
        const message = {
            id: obj.order_id,
            trader_address: obj.trader_address,
            market_id: obj.marketID,
            side: obj.side,
            price: +obj.price,
            amount: +obj.amount,
            status: 'pending',
            type: 'limit',
            available_amount: +obj.amount,
            confirmed_amount: 0,
            canceled_amount: 0,
            pending_amount: 0,
            updated_at: null,
            created_at: null,
        };
        const [err, result2] = await await_to_js_1.default(order.build(message));
        console.log(result2, err);
        res.json({ result2, err });
    });
    adex.all('/build_order_v3', async (req, res) => {
        const { trader_address, market_id, side, price, amount, order_id, signature } = req.body;
        if (!(trader_address && market_id && side && price && amount && order_id && signature)) {
            return res.json({
                success: false,
                err: 'body\'s params mistake',
            });
        }
        const result = utils.verify(order_id, signature);
        if (!result) {
            return res.json({
                success: false,
                err: 'verify failed',
            });
        }
        if (!(utils.judge_legal_num(+amount) && utils.judge_legal_num(+price))) {
            return res.json({
                success: false,
                err: 'amount or price is cannt support',
            });
        }
        const last_trade = await trades.list_trades(market_id);
        const max_limit = number_precision_1.default.times(last_trade[0].price, 5);
        const min_limit = number_precision_1.default.divide(last_trade[0].price, 5);
        if (price < min_limit || price > max_limit) {
            return res.json({
                success: false,
                err: `The price must be between ${min_limit} and ${max_limit}`,
            });
        }
        const [base_token, quota_token] = market_id.split('-');
        if (side == 'buy') {
            const available_quota = await get_available_erc20_amount(trader_address, quota_token);
            const quota_amount = number_precision_1.default.times(+amount, +price);
            if (quota_amount > available_quota) {
                return res.json({
                    success: false,
                    err: `quotation  balance is not enoungh,available amount is ${available_quota},but your order value is ${quota_amount}`,
                });
            }
        }
        else if (side == 'sell') {
            const available_base = await get_available_erc20_amount(trader_address, base_token);
            if (amount > available_base) {
                return res.json({
                    success: false,
                    err: `base  balance is not enoungh,available amount is ${available_base},but your want to sell ${amount}`,
                });
            }
        }
        else {
            return res.json({
                success: false,
                err: `side ${side} is not supported`,
            });
        }
        const message = {
            id: order_id,
            trader_address,
            market_id,
            side,
            price,
            amount,
            status: 'pending',
            type: 'limit',
            available_amount: amount,
            confirmed_amount: 0,
            canceled_amount: 0,
            pending_amount: 0,
            updated_at: null,
            created_at: null,
        };
        const [err, result2] = await await_to_js_1.default(order.build(message));
        console.log(result2, err);
        res.json({
            success: result == undefined ? false : true,
            result: result2,
            err,
        });
    });
    adex.all('/cancle_order', async (req, res) => {
        const obj = urllib.parse(req.url, true).query;
        const message = {
            amount: obj.amount,
            id: obj.orderID,
        };
        const [err, result] = await await_to_js_1.default(order.cancle_order(message));
        res.json({ result, err });
    });
    adex.all('/cancle_order_v2', async (req, res) => {
        const { order_id, signature } = req.body;
        const success = utils.verify(order_id, signature);
        if (!success) {
            return res.json({
                success: false,
                err: 'verify failed',
            });
        }
        const order_info = await order.get_order(order_id);
        const message = {
            amount: order_info[0].available_amount,
            id: order_id,
        };
        const [err, result] = await await_to_js_1.default(order.cancle_order(message));
        res.json({
            success: result == undefined ? false : true,
            result,
            err,
        });
    });
    adex.all('/cancle_my_order/:address', async (req, res) => {
        const [err, orders] = await await_to_js_1.default(order.my_orders2(req.params.address, 1, 1000, 'pending', 'partial_filled'));
        console.log('cancle_my_order=', orders, err, req.params.address);
        if (!err) {
            for (const index in orders) {
                const message = { amount: orders[index].available_amount, id: orders[index].id };
                console.log('cancle_my_order', message);
                const [err, result] = await await_to_js_1.default(order.cancle_order(message));
                if (err) {
                    console.error(err, result);
                    return res.json({
                        success: false,
                        err,
                    });
                }
            }
        }
        res.json({
            success: true,
        });
    });
    adex.all('/cancle_orders_v2', async (req, res) => {
        const { address, orders_id, signature } = req.body;
        console.log('cancle_orders_v2', address, orders_id, signature);
        const str = orders_id.join();
        const root_hash = crypto_sha256.createHmac('sha256', '123');
        const hash = root_hash.update(str, 'utf8').digest('hex');
        console.log('cancle_orders_v2--', hash);
        const success = utils.verify(hash, signature);
        if (!success) {
            return res.json({
                success: false,
                err: 'verify failed',
            });
        }
        const results = [];
        const errs = [];
        for (const index in orders_id) {
            const order_info = await order.get_order(orders_id[index]);
            if (order_info[0].available_amount <= 0) {
                continue;
            }
            if (order_info[0].trader_address != address) {
                return res.json({
                    success: false,
                    err: 'You can‘t cancel others order',
                });
            }
            const message = {
                amount: order_info[0].available_amount,
                id: order_info[0].id,
            };
            const [err, result] = await await_to_js_1.default(order.cancle_order(message));
            if (err) {
                errs.push(err);
            }
            else {
                results.push(result);
            }
        }
        return res.json({
            success: errs.length == 0 ? true : false,
            result: results,
            err: errs,
        });
    });
    adex.all('/list_orders', async (req, res) => {
        const [err, result] = await await_to_js_1.default(order.list_orders());
        res.json({ result, err });
    });
    adex.all('/my_trades_length/:address', async (req, res) => {
        const { address } = req.params;
        const [err, result] = await await_to_js_1.default(trades.my_trades_length(address));
        res.json({
            success: result == undefined ? false : true,
            result,
            err,
        });
    });
    adex.all('/my_orders', async (req, res) => {
        const obj = urllib.parse(req.url, true).query;
        const message = { address: obj.address };
        const [err, result] = await await_to_js_1.default(order.my_orders(message));
        res.json({ result, err });
    });
    adex.all('/my_orders2/:address/:page/:perpage/:status1/:status2', async (req, res) => {
        const { address, page, perpage, status1, status2 } = req.params;
        const [err, result] = await await_to_js_1.default(order.my_orders2(address, page, perpage, status1, status2));
        res.json({ result, err });
    });
    adex.all('/my_orders_v2/:address/:page/:perpage/:status1/:status2', async (req, res) => {
        const { address, page, perpage, status1, status2 } = req.params;
        const [err, result] = await await_to_js_1.default(order.my_orders2(address, page, perpage, status1, status2));
        res.json({
            success: result == undefined ? false : true,
            result,
            err,
        });
    });
    adex.all('/order_book', async (req, res) => {
        const obj = urllib.parse(req.url, true).query;
        const [err, result] = await await_to_js_1.default(order.order_book(obj.marketID));
        res.json({ result, err });
    });
    adex.all('/order_book_v2/:market_id', async (req, res) => {
        const [err, result] = await await_to_js_1.default(order.order_book(req.params.market_id));
        if (err)
            console.error(err);
        if (result.asks.length == 0 && result.asks.length == 0) {
            res.json({
                success: false,
                err: 'MarketID not found',
            });
        }
        else {
            res.json({
                success: true,
                result,
            });
        }
    });
    adex.all('/list_markets', async (req, res) => {
        const [err, result] = await await_to_js_1.default(market.list_markets());
        res.json({ result, err });
    });
    adex.all('/list_markets_v2', async (req, res) => {
        const [err, result] = await await_to_js_1.default(market.list_markets());
        res.json({
            success: result == undefined ? false : true,
            result,
            err,
        });
    });
    adex.all('/rollback_trades', async (req, res) => {
        const [err, result] = await await_to_js_1.default(trades.rollback_trades());
        res.json({ result, err });
    });
    adex.all('/list_trades', async (req, res) => {
        const obj = urllib.parse(req.url, true).query;
        const [err, result] = await await_to_js_1.default(trades.list_trades(obj.marketID));
        res.json({ result, err });
    });
    adex.all('/list_trades_v2/:market_id', async (req, res) => {
        const { market_id } = req.params;
        const [err, result] = await await_to_js_1.default(market.get_market(market_id));
        if (err || !result || result.length == 0) {
            res.json({
                success: false,
                err: err + ' or have no this market',
            });
        }
        const [err2, result2] = await await_to_js_1.default(trades.list_trades(market_id));
        if (err2) {
            res.json({
                success: false,
                err: err2,
            });
        }
        else {
            res.json({
                success: true,
                result: result2,
            });
        }
    });
    adex.all('/my_trades', async (req, res) => {
        const obj = urllib.parse(req.url, true).query;
        const message = { address: obj.address };
        const [err, result] = await await_to_js_1.default(trades.my_trades(message));
        res.json({ result, err });
    });
    adex.all('/my_trades2/:address/:page/:per_page', async (req, res) => {
        const [err, result] = await await_to_js_1.default(trades.my_trades2(req.params.address, req.params.page, req.params.per_page));
        res.json({
            success: result == undefined ? false : true,
            result,
            err,
        });
    });
    adex.all('/my_trades_v2/:address/:page/:per_page', async (req, res) => {
        const [err, result] = await await_to_js_1.default(trades.my_trades2(req.params.address, req.params.page, req.params.per_page));
        res.json({
            success: result == undefined ? false : true,
            result,
            err,
        });
    });
    adex.all('/trading_view', cache('10 second'), async (req, res) => {
        const current_time = Math.floor(new Date().getTime() / 1000);
        const obj = urllib.parse(req.url, true).query;
        const message = {
            market_id: obj.marketID,
            from: current_time - current_time % obj.granularity - obj.granularity * obj.number,
            to: current_time - current_time % obj.granularity,
            granularity: obj.granularity,
        };
        const [err, result] = await await_to_js_1.default(trades.trading_view(message));
        res.json({ result, err });
    });
    adex.all('/trading_view_v2/:granularity/:number/:market_id', cache('10 second'), async (req, res) => {
        const { granularity, number, market_id } = req.params;
        const [err, result] = await await_to_js_1.default(market.get_market(market_id));
        if (err || !result || result.length == 0) {
            res.json({
                success: false,
                err: err + ' or have no this market',
            });
        }
        const current_time = Math.floor(new Date().getTime() / 1000);
        const message = {
            market_id,
            from: current_time - current_time % granularity - granularity * number,
            to: current_time - current_time % granularity,
            granularity,
        };
        const [err2, result2] = await await_to_js_1.default(trades.trading_view(message));
        if (err2) {
            res.json({
                success: false,
                err: err2,
            });
        }
        else {
            res.json({
                success: true,
                result: result2,
            });
        }
    });
    adex.all('/trading_view_v2/:granularity/:number/:market_id', cache('10 second'), async (req, res) => {
        const { granularity, number, market_id } = req.params;
        const [err, result] = await await_to_js_1.default(market.get_market(market_id));
        if (err || !result || result.length == 0) {
            res.json({
                success: false,
                err: err + ' or have no this market',
            });
        }
        const current_time = Math.floor(new Date().getTime() / 1000);
        const message = {
            market_id,
            from: current_time - current_time % granularity - granularity * number,
            to: current_time - current_time % granularity,
            granularity,
        };
        const [err2, result2] = await await_to_js_1.default(trades.trading_view(message));
        if (err2) {
            res.json({
                success: false,
                err: err2,
            });
        }
        else {
            res.json({
                success: true,
                result: result2,
            });
        }
    });
    return adex;
};
//# sourceMappingURL=index.js.map