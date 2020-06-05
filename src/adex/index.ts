import to from 'await-to-js';
import {Router} from 'express';
import NP from '../common/NP';

import {IBalance, IOrder as IOrder} from './interface'
import OrderAPI from './api/order';
import TradesAPI from './api/trades';
import MarketAPI from './api/market';
import Utils from './api/utils';

import DBClient from './models/db';
import MistWallet from './api/mist_wallet';

import MistConfig from '../cfg';
import mistConfig, {BullOption, OrderQueueConfig} from '../cfg';
import Token from '../wallet/contract/Token';
import Asset from '../wallet/contract/Asset';
import {Networks} from 'bitcore-lib';
import * as redis from 'redis';
import {promisify} from 'util';
import {errorCode} from '../error_code'
import urllib = require('url');
import crypto_sha256 = require('crypto');
import add = Networks.add;
const ENGINE_ORDERS = 'engine_orders';


// TODO :  这个RPC请求很高频，可能成为性能瓶颈
// 1 优化可能：rpc请求加入块高度缓存，这样一个块高度只请求一次（已在wallet sdk完成）
// 2 同余额接口，让用户在交易所API那边也有一个登录操作，让服务端可以知道需要持续更新哪些用户的余额。
// 对于已经登录的用户，服务端启动固定的进程去定时更新余额。该接口改为直接返回缓存余额
// 3 sql查询的优化
async function get_available_erc20_amount(address, symbol, client:DBClient, mist_wallet,redisClient) {
    // fixme:此处本地账本传用户地址链上账本用合约地址，容易歧义
    const token = new Token(address);
    const [err, balance] = await to(token.localBalanceOf(symbol,redisClient));
    if (err) console.error(err);
    const hgetAsync = promisify(redisClient.hget).bind(redisClient);
    const [freezeErr,freezeRes] = await to(hgetAsync(address, 'freeze::' + symbol));
    if(freezeErr || freezeRes === null){
        console.error('localBalanceOf2 ',freezeErr,freezeRes);
        return balance;
    }
    const freeze = +freezeRes.toString();
    return NP.minus(balance, freeze);
}

export default () => {
    const adex: Router = Router();
    const client: DBClient = new DBClient();
    const order: OrderAPI = new OrderAPI(client);
    const trades: TradesAPI = new TradesAPI(client);
    const market: MarketAPI = new MarketAPI(client);

    const mist_wallet: MistWallet = new MistWallet(client);

    const utils = new Utils();
    let redisClient;
    if (typeof BullOption.redis !== 'string') {
        redisClient = redis.createClient(BullOption.redis.port, BullOption.redis.host);
        redisClient.auth(BullOption.redis.password);
    }


    adex.all('/compat_query/:sql', async (req, res) => {
        let {sql} = req.params;
        sql = sql.toLowerCase();
        const select = sql.includes('select');
        const write = sql.includes('drop ') || sql.includes('create ') || sql.includes('update ') || sql.includes('insert ') || sql.includes('delete ');
        if (select && !write ) {
            const [err, result] = await to(client.compat_query(sql));
            res.json({
                code: errorCode.SUCCESSFUL,
                errorMsg:err,
                timeStamp:Date.now(),
                data:result
            });
        } else {
            res.json({
                code: errorCode.INVALID_PARAMS,
                errorMsg:'support readonly',
                timeStamp:Date.now(),
                data:null
            });
        }
    });

    /**
     * @api {post} /adex/list_market_quotations_v2 list_market_quotations_v2
     * @apiDescription Get the current price of the exchange
     * @apiName list_market_quotations_v2
     * @apiGroup adex
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
    "code": 0,
    "errorMsg": null,
    "timeStamp": 1589332916122,
    "data": [
            {
                "token_symbol": "CNYC",
                "erc20_address": "0x63cc0bfe91b31388dbd9eeafb233616bacc42cab31",
                "erc20_balance": 3960320.141435896,
                "value": 3960320.141435896,
                "erc20_freeze_amount": 755264.263254,
                "asim_assetid": "000000000000000300000000",
                "asim_asset_balance": 0,
                "asset_icon": "http://fingo-cdn.asimov.work/res/icons/CNYCa.png",
                "coin_icon": "http://fingo-cdn.asimov.work/res/icons/CNYCm.png"
            },
            {
                "token_symbol": "MT",
                "erc20_address": "0x63064685c84dfe141c9ffe51c13c46bea61e57bf3a",
                "erc20_balance": 4940347.76184583,
                "value": 256058224.49646935,
                "erc20_freeze_amount": 2406215.0608910006,
                "asim_assetid": "000000000000000500000001",
                "asim_asset_balance": 0,
                "asset_icon": "http://fingo-cdn.asimov.work/res/icons/MTa.png",
                "coin_icon": "http://fingo-cdn.asimov.work/res/icons/MTm.png"
            }
        ]
     }
     * @apiSampleRequest http://119.23.181.166:21000/adex/list_market_quotations_v2
     * @apiVersion 1.0.0
     */
    adex.all('/list_market_quotations_v2', async (req, res) => {
        const [err,result] = await to(market.list_market_quotations());
        res.json({
            code: err ? errorCode.EXTERNAL_DEPENDENCIES_ERROR:errorCode.SUCCESSFUL,
            errorMsg:err ? err:null,
            timeStamp:Date.now(),
            data:result
        });
    });


    adex.all('/list_tokens_v2', async (req, res) => {
        const [err,result] = await to(mist_wallet.list_mist_tokens());
        res.json({
            code: err ? errorCode.EXTERNAL_DEPENDENCIES_ERROR:errorCode.SUCCESSFUL,
            errorMsg:err ? err:null,
            timeStamp:Date.now(),
            data:result
        });
    });

    /**
     * @api {post} /adex/get_token_price_v2/:symbol  get_token_price_v2
     * @apiDescription Get the current RMB price for the coin
     * @apiName get_token_price_v2
     * @apiGroup adex
     * @apiParam {string} symbol coin's symbol
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
         {
            "code": 0,
            "errorMsg": null,
            "timeStamp": 1589333610881,
            "data": 39685.29
        }
     * @apiSampleRequest http://119.23.181.166:21000/adex/get_token_price_v2/BTC
     * @apiVersion 1.0.0
     */

    adex.all('/get_token_price_v2/:symbol', async (req, res) => {
        const {symbol} = req.params;
        const [err,result] = await to(mist_wallet.get_token_price2pi(symbol));
        res.json({
            code: err ? errorCode.EXTERNAL_DEPENDENCIES_ERROR:errorCode.SUCCESSFUL,
            errorMsg:err ? err:null,
            timeStamp:Date.now(),
            data:result
        });
    });

    adex.all('/get_token_price2btc/:symbol', async (req, res) => {
        const {symbol} =  req.params;
        const [err,result] = await to(mist_wallet.get_token_price2btc(symbol));
        res.json({
            code: err ? errorCode.EXTERNAL_DEPENDENCIES_ERROR:errorCode.SUCCESSFUL,
            errorMsg:err ? err:null,
            timeStamp:Date.now(),
            data:result
        });
    });

    /**
     * @api {post} /adex/balances_v2 balances_v2
     * @apiDescription Returns details of blockchain assets, exchange coin, and exchange coin frozen amount
     * @apiName balances_v2
     * @apiGroup adex
     * @apiParam {string} address user's address
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
        "success": true,
        "result": [
            {
                "token_symbol": "CNYC",
                "erc20_address": "0x63fb23599aec99b1f9e1267190b17d82ecdae36c19",
                "erc20_balance": 89578127.6224786,
                "erc20_freeze_amount": 26401.778159,
                "asim_assetid": "000000000000000300000000",
                "asim_asset_balance": 0,
                "asset_icon": "http://fingo-cdn.asimov.work/res/icons/CNYCa.png",
                "coin_icon": "http://fingo-cdn.asimov.work/res/icons/CNYCm.png"
            },
            {
                "token_symbol": "MT",
                "erc20_address": "0x630c4d576096fbe5a2a8c0f1017772cf84858ac8c0",
                "erc20_balance": 90018582.2210041,
                "erc20_freeze_amount": 1257.422328,
                "asim_assetid": "000000000000000500000001",
                "asim_asset_balance": 0,
                "asset_icon": "http://fingo-cdn.asimov.work/res/icons/MTa.png",
                "coin_icon": "http://fingo-cdn.asimov.work/res/icons/MTm.png"
            }
        ]
     }

     * @apiSampleRequest http://119.23.181.166:21000/adex/balances_v2?address=0x660b26beb33778dbece8148bf32e83373dd1fee80e
     * @apiVersion 1.0.0
     */
    adex.all('/balances_v2', async (req, res) => {
        const obj = urllib.parse(req.url, true).query;
        const balances: IBalance[] = [];
        if(obj.address === undefined){
            res.json({
                code: errorCode.INVALID_PARAMS,
                errorMsg:'Parameter incomplete',
                timeStamp:Date.now(),
                data:null
            });
        }
        const address: string = obj.address as string;

        const asset = new Asset(mistConfig.asimov_master_rpc);
        const [err4, result4] = await to(asset.balanceOf(address));
        if (err4 || !result4 || result4[0].assets === undefined) {
            console.error('[MIST SIGNER]::(asset.balanceOf):', err4, result4);
            return res.json({
                success: false,
                errorCode:errorCode.EXTERNAL_DEPENDENCIES_ERROR,
                err: err4,
            });
        }
        const assets_balance = result4[0].assets;

        const [listTokenErr,listTokenRes] = await to(mist_wallet.list_mist_tokens());
        if (!listTokenRes) {
            console.error('[MIST SIGNER]::list_mist_tokens:', listTokenErr, listTokenRes);
            return res.json({
                success: false,
                errorCode:errorCode.EXTERNAL_DEPENDENCIES_ERROR,
                err: err4,
            });
        }
        for (const i in listTokenRes as any[]) {
            if (!listTokenRes[i]) continue;
            const token = new Token(address);
            const [err, localErc20Err] = await to(token.localBalanceOf(listTokenRes[i].symbol,redisClient));
            if (err || localErc20Err === undefined || typeof localErc20Err !== 'number') {
                console.error('[MIST SIGNER]::(token.balanceOf):', err, localErc20Err);
                return res.json({
                    code: errorCode.EXTERNAL_DEPENDENCIES_ERROR,
                    errorMsg:err,
                    timeStamp:Date.now(),
                    data:null
                });
            }
            let asset_balance = 0;
            for (const j in assets_balance) {
                if (!assets_balance[j]) continue;
                if (listTokenRes[i].asim_assetid === assets_balance[j].asset) {
                    asset_balance = assets_balance[j].value;
                }
            }
            const available_amount = await get_available_erc20_amount(
                address,
                listTokenRes[i].symbol,
                client,
                mist_wallet,
                redisClient
            );
            const price = await mist_wallet.get_token_price2pi(listTokenRes[i].symbol);
            const balance_info = {
                token_symbol: listTokenRes[i].symbol,
                erc20_address: listTokenRes[i].address,
                erc20_balance: localErc20Err,
                value: +NP.times(localErc20Err, price),
                erc20_freeze_amount: +NP.minus(localErc20Err,available_amount),
                asim_assetid: listTokenRes[i].asim_assetid,
                asim_asset_balance: asset_balance / (1 * 10 ** 8),
                asset_icon:
                    MistConfig.icon_url +
                    listTokenRes[i].symbol +
                    'a.png',
                coin_icon:
                    MistConfig.icon_url +
                    listTokenRes[i].symbol +
                    'm.png',
            };

            balances.push(balance_info);
        }

        res.json({
            code: errorCode.SUCCESSFUL,
            errorMsg:null,
            timeStamp:Date.now(),
            data:balances
        });
    });
    /**
     * @api {post} /adex/erc20_balances/:address  erc20_balances
     * @apiDescription user's balance of exchange coins and exchange coin frozen amount
     * @apiName erc20_balances
     * @apiGroup adex
     * @apiParam {string} address user's address
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
        "success": true,
        "result": [
            {
                "token_symbol": "CNYC",
                "erc20_address": "0x63fb23599aec99b1f9e1267190b17d82ecdae36c19",
                "erc20_balance": 89578127.6224786,
                "erc20_freeze_amount": 26401.778159,
                "asim_assetid": "000000000000000300000000",
                "value": 89578127.6224786,
                "token_icon": "http://fingo-cdn.asimov.work/res/icons/CNYCm.png"
            },
            {
                "token_symbol": "MT",
                "erc20_address": "0x630c4d576096fbe5a2a8c0f1017772cf84858ac8c0",
                "erc20_balance": 90018582.2210041,
                "erc20_freeze_amount": 1257.422328,
                "asim_assetid": "000000000000000500000001",
                "value": 4772785229.357637,
                "token_icon": "http://fingo-cdn.asimov.work/res/icons/MTm.png"
            }
        ]
     }
     * @apiSampleRequest http://119.23.181.166:21000/adex/erc20_balances/0x660b26beb33778dbece8148bf32e83373dd1fee80e
     * @apiVersion 1.0.0
     */
    // TODO :  这个接口有30秒返回的问题。
    // 可能有2个地方可以优化，一个是token合约增加一个批量查询多地址的函数。
    // 第二个是让用户在交易所API那边也有一个登录操作，让服务端可以知道需要持续更新哪些用户的余额。
    // 对于已经登录的用户，服务端启动固定的进程去定时更新余额。该接口改为直接返回缓存余额
    adex.all('/erc20_balances/:address', async (req, res) => {
        const {address} = req.params;
        const token_arr = await mist_wallet.list_mist_tokens();
        const balances: IBalance[] = [];

        const logs = [];
        logs.push({start:new Date().toLocaleTimeString(),address});

        for (const tokenInfo of token_arr as any[]) {
            const token = new Token(address);
            const [err, localErc20Err] = await to(token.localBalanceOf(tokenInfo.symbol,redisClient));
            if (err || localErc20Err === undefined) {
                console.error(err);
                return res.json({
                    code: errorCode.EXTERNAL_DEPENDENCIES_ERROR,
                    errorMsg:err,
                    timeStamp:Date.now(),
                    data:null
                });
            }
            logs.push({balanceOf:new Date().toLocaleTimeString(),token:tokenInfo.address,localErc20Err});
            const available_amount = await get_available_erc20_amount(
                address,
                tokenInfo.symbol,
                client,
                mist_wallet,
                redisClient
            );

            const price = await mist_wallet.get_token_price2pi(tokenInfo.symbol);
            logs.push({get_token_price2pi:new Date().toLocaleTimeString(),price});
            const balance_info = {
                token_symbol: tokenInfo.symbol,
                erc20_address: tokenInfo.address,
                erc20_balance:localErc20Err,
                erc20_freeze_amount: +NP.minus(localErc20Err,available_amount),
                asim_assetid: tokenInfo.asim_assetid,
                value: +NP.times(localErc20Err, price),
                token_icon:
                    MistConfig.icon_url +
                    tokenInfo.symbol +
                    'm.png',
            };

            balances.push(balance_info);
        }

        logs.push({end:new Date().toLocaleTimeString()});
        res.json({
            code: errorCode.SUCCESSFUL,
            errorMsg:null,
            timeStamp:Date.now(),
            data:balances
        });
    });
    /**
     * @api {post} /adex/get_order_id_v3/:trader_address/:marketID/:side/:price/:amount get_order_id_v3
     * @apiDescription Get the order ID
     * @apiName get_order_id_v3
     * @apiGroup adex
     * @apiParam {string}   trader_address         user's address
     * @apiParam {string}   marketID         market ID of order
     * @apiParam {string}   side         side of order (sell or buy)
     * @apiParam {string}   price         price of order
     * @apiParam {string}   amount         amount of order
     * @apiSuccess {json}   result     orderID and expire_at
     * @apiSuccessExample {json} Success-Response:
     {
         "code": 0,
        "errorMsg": null,
        "timeStamp": 1589333162986,
        "data": {
            "orderID": "e386e75b169aed9257b61a63ff20c2ce87218e0c2dc0119553da1027d09c3aac",
            "expire_at": 1589336162984
        }
    }
     * @apiSampleRequest http://119.23.181.166:21000/adex/get_order_id_v3/0x66b1aded6908f6f3b77379703d16f3dbb55e88bf73/ASIM-CNYC/buy/30/100
     * @apiVersion 1.0.0
     */

    adex.all('/get_order_id_v3/:trader_address/:marketID/:side/:price/:amount', async (req, res) => {
            const {trader_address, marketID, side} = req.params;
            const time = new Date().valueOf();
            const expire_at = time + 50 * 60 * 1000;
            const amount = +NP.times(+req.params.amount, 100000000);
            const price = +NP.times(+req.params.price, 100000000);
            const orderArr =  [trader_address,amount,price, expire_at, marketID, side];
            const orderID = utils.orderHash(orderArr);
            const result = {
                orderID,
                expire_at
            };
            res.json({
                code: errorCode.SUCCESSFUL,
                errorMsg:null,
                timeStamp:Date.now(),
                data:result
            });
        }
    );
    /**
     * @api {post} /adex/build_order_v4 build_order_v4
     * @apiDescription Create an exchange order
     * @apiName build_order_v4
     * @apiGroup adex
     * @apiParam {string}   signature         signature info of order id
     * @apiParam {string} trader_address    user's address
     * @apiParam {string} publicKey         user's publicKey
     * @apiParam {string} market_id         market ID of order
     * @apiParam {number} amount            amount
     * @apiParam {number} price             price
     * @apiParam {number} expire_at          Order expiration time from get_order_id_v3
     * @apiParamExample {json} Request-Example:
     {
         "signature":"0x252dc7fdaf025e101d381e2a74f95ce0f628a6ed78eb6b913ad7439b74b3074f3f0bdde260393c785ebe7a1804ce28d26f39d5365760b0df81b08f4ad33e34231b",
         "trader_address":"0x66c16d217ce654c5ebbdcb1f978ef2dee7ec444ada",
         "publicKey": "038fd51dc067031e66c042075199033435493cc9d049ca3108f78e0cd5016a1711",
         "market_id":"BTC-USDT",
         "side":"sell",
         "price":5,
         "amount":10,
         "expire_at":1585710291042
     }
     * @apiSuccess {json} result   order's ID
     * @apiSuccessExample {json} Success-Response:
     {
        "code": 0,
        "errorMsg": null,
        "timeStamp": 1589333314798,
        "data": "e386e75b169aed9257b61a63ff20c2ce87218e0c2dc0119553da1027d09c3aac"
     }
     * @apiSampleRequest http://119.23.181.166:21000/adex/build_order_v4
     * @apiVersion 1.0.0
     */
    // TODO :  这个接口有10秒返回超时的问题，并且是最高频接口之一。
    // 1 优化可能：rpc请求加入块高度缓存，这样一个块高度只请求一次
    // 2 同余额接口，让用户在交易所API那边也有一个登录操作，让服务端可以知道需要持续更新哪些用户的余额。
    // 对于已经登录的用户，服务端启动固定的进程去定时更新余额。该接口改为直接返回缓存余额
    adex.all('/build_order_v4', async (req, res) => {
        const {trader_address, market_id, side, price, amount, expire_at, signature, publicKey} = req.body;
        if (!trader_address || !market_id || !side || !price || !amount || !expire_at || !signature || !publicKey){
            return res.json({
                code: errorCode.INVALID_PARAMS,
                errorMsg:'Parameter incomplete',
                timeStamp:Date.now(),
                data:null
            });
        }
        // @ts-ignore
        const now2 = new Date().valueOf();
        // 直接判断队列长度，如果消费阻塞，返回失败
        const waitingOrders = await order.queueWaitingCount();
        console.log('waitingOrders ',waitingOrders);
        if( waitingOrders > OrderQueueConfig.maxWaiting ) {
            return res.json({
                code: errorCode.ENGINE_BUSY,
                errorMsg:'Match Engine Busy Now:' + waitingOrders,
                timeStamp:Date.now(),
                data:null
            });
        }
        const amount2 = +NP.times(amount, 100000000);
        const price2 = +NP.times(price, 100000000);

        const orderArr = [trader_address, amount2, price2, expire_at, market_id, side];
        const orderhash = utils.orderHash(orderArr);
        const [verifyErr,verifyRes] = await to(utils.verify2(trader_address,orderhash,signature,publicKey));
        if (!verifyRes) {
            return res.json({
                code: errorCode.VERIFY_FAILED,
                errorMsg:'verify failed' + verifyErr,
                timeStamp:Date.now(),
                data:null
            });
        }
        const now = new Date().valueOf();
        if (now > expire_at) {
            return res.json({
                code: errorCode.SIGNATURE_EXPIRED,
                errorMsg:'The order signature has expired',
                timeStamp:Date.now(),
                data:null
            });
        }
        if (!(utils.judge_legal_num(+amount) && utils.judge_legal_num(+price))) {
            return res.json({
                code: errorCode.INVALID_PARAMS,
                errorMsg:'The precision of quantity and price is only supported up to the fourth decimal point',
                timeStamp:Date.now(),
                data:null
            });
        }

        const [last_trade_err, last_trade] = await to(trades.list_trades(market_id));
        if (last_trade_err || !last_trade) {
            console.error('[MIST SIGNER]:(trades.list_trades):', last_trade_err, last_trade);
            return res.json({
                code: errorCode.EXTERNAL_DEPENDENCIES_ERROR,
                errorMsg:last_trade_err,
                timeStamp:Date.now(),
                data:null
            });
        }

        // init limit 0 ～ 100000
        let min_limit = 0;
        let max_limit = 100000;
        if (last_trade.length !== 0) {
            max_limit = +NP.times(last_trade[0].price, 10);
            min_limit = +NP.divide(last_trade[0].price, 10);
        }

        if (price < min_limit || price > max_limit) {
            return res.json({
                code: errorCode.INVALID_PARAMS,
                errorMsg:`The price must be between ${min_limit} and ${max_limit}`,
                timeStamp:Date.now(),
                data:null
            });
        }

        const [base_token, quota_token] = market_id.split('-');
        if (side === 'buy') {
            const available_quota = await get_available_erc20_amount(
                trader_address,
                quota_token,
                client,
                mist_wallet,
                redisClient
            );
            const quota_amount = NP.times(+amount, +price);
            if (quota_amount > available_quota) {
                return res.json({
                    code: errorCode.BALANCE_INSUFFICIENT,
                    errorMsg:`quotation  balance is not enoungh,available amount is ${available_quota},but your order value is ${quota_amount}`,
                    timeStamp:Date.now(),
                    data:null
                });
            }
        } else if (side === 'sell') {
            const available_base = await get_available_erc20_amount(
                trader_address,
                base_token,
                client,
                mist_wallet,
                redisClient
            );
            if (amount > available_base) {
                return res.json({
                    code: errorCode.BALANCE_INSUFFICIENT,
                    errorMsg:`${market_id} base  balance is not enoungh,available amount is ${available_base},but your want to sell ${amount}`,
                    timeStamp:Date.now(),
                    data:null
                });
            }
        } else {
            return res.json({
                code: errorCode.INVALID_PARAMS,
                errorMsg:`side ${side} is not supported`,
                timeStamp:Date.now(),
                data:null
            });
        }

        // const order_id = utils.get_hash(req.body);
        const message = {
            id: orderhash,
            trader_address,
            market_id,
            side,
            price:+price,
            amount:+amount,
            status: 'pending',
            type: 'limit',
            available_amount: +amount,
            confirmed_amount: 0,
            canceled_amount: 0,
            pending_amount: 0,
            updated_at: null,
            created_at: null,
            signature,
            expire_at: +expire_at,
        };

        const [err, result2] = await to(order.build(message));
        res.json({
            code: err ? errorCode.EXTERNAL_DEPENDENCIES_ERROR: errorCode.SUCCESSFUL,
            errorMsg:err ? err:null,
            timeStamp:Date.now(),
            data:err ? null : orderhash,
        });
    });
    /**
     * @api {post} /adex/cancle_order_v3 cancle_order_v3
     * @apiDescription 取消撮合订单
     * @apiName cancle_order_v3
     * @apiGroup adex
     * @apiParam {string}   signature         signature info of order
     * @apiParam {string}   publicKey         public key of user
     * @apiParam {string} order_id          ID of order to be cancelled
     * @apiParamExample {json} Request-Example:
     {
         "signature":"0x5e3242a3989359b59350dfdb600b921aa844a66c6e17e8ee856cb22a3759ed0d1501056e4983e04ae61f1cc09084d87c2e09a97036e54a176506c61d7d7d58e51c",
         "publicKey": "038fd51dc067031e66c042075199033435493cc9d049ca3108f78e0cd5016a1711",
         "order_id":"6c659b39698dd8bce0c036ddccc923a866eea29efc5c2a99e9e758859e894f5e"
    }
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
        "code": 0,
        "errorMsg": [],
        "timeStamp": 1589333517684,
        "data": null
    }
     * @apiSampleRequest http://119.23.181.166:21000/adex/cancle_order_v3
     * @apiVersion 1.0.0
     */

    adex.all('/cancle_order_v3', async (req, res) => {
        // FIXME : cancel spell error
        const {order_id, signature,publicKey} = req.body;
        if(!order_id || !signature || !publicKey){
            return res.json({
                code: errorCode.INVALID_PARAMS,
                errorMsg:'Parameter incomplete',
                timeStamp:Date.now(),
                data:null
            });
        }
        const orderInfo: IOrder[] = await order.get_order(order_id);
        if (!orderInfo || orderInfo.length <= 0) {
            return res.json({
                code: errorCode.INVALID_PARAMS,
                errorMsg:'Order ID Not Found.',
                timeStamp:Date.now(),
                data:null
            });
        }
        if(orderInfo[0].available_amount <= 0){
            return res.json({
                code: errorCode.INVALID_PARAMS,
                errorMsg:'Orders have already been completed or cancelled',
                timeStamp:Date.now(),
                data:null
            });
        }
        // 直接判断队列长度，如果消费阻塞，返回失败
        const waitingOrders = await order.queueWaitingCount();
        console.log('cancel waitingOrders ',waitingOrders);
        if( waitingOrders > OrderQueueConfig.maxWaiting ) {
            return res.json({
                code: errorCode.ENGINE_BUSY,
                errorMsg:'Match Engine Busy Now:' + waitingOrders,
                timeStamp:Date.now(),
                data:null
            });
        }
        const [verifyErr,verifyRes] = await to(utils.verify2(orderInfo[0].trader_address,order_id, signature,publicKey));
        if (!verifyRes) {
            return res.json({
                code: errorCode.VERIFY_FAILED,
                errorMsg:'Verify failed' + verifyErr,
                timeStamp:Date.now(),
                data:null
            });
        }
        const message = {
            trader_address: orderInfo[0].trader_address,
            amount: orderInfo[0].available_amount,
            side: orderInfo[0].side,
            price: orderInfo[0].price,
            market_id: orderInfo[0].market_id,
            id: order_id,
            status: 'cancled',
        };
        // update也有耗时，
        await redisClient.sadd(ENGINE_ORDERS,order_id);
        const [err, result] = await to(order.cancle(message));
        await redisClient.srem(ENGINE_ORDERS,order_id);
        res.json({
            code: err ? errorCode.EXTERNAL_DEPENDENCIES_ERROR : errorCode.SUCCESSFUL,
            errorMsg:err ? err:null,
            timeStamp:Date.now(),
            data:err ? null:''
        });
    });
    /**
     * @api {post} /adex/cancle_orders_v3 cancle_orders_v3
     * @apiDescription Cancel multiple orders for a particular address
     * @apiName cancle_orders_v3
     * @apiGroup adex
     * @apiParam {string}   signature         signature info
     * @apiParam {String[]} orders_id          order ID
     * @apiParam {string} publicKey           publick key of user
     * @apiParamExample {json} Request-Example:
        {
            "signature": "0x22754db1423fea182a9bbbc03de295931c994d09c9ffc1efef45b4f0d2e2f65b3191a5928d6af40f0552c509648010d709d02b33ad52b4832e01eebb95495ae41b",
            "publicKey": "038fd51dc067031e66c042075199033435493cc9d049ca3108f78e0cd5016a1711",
            "orders_id":["6ddaf8a1dc7beefeb98f7b2ecb5802f65f368e7dc29a090e488bf2deb758812d","488cbf43db042ad01646146bbad4dca98fe35bd19a1b903a41e89fc580a803f8"]
        }
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
        "code": 0,
        "errorMsg": [],
        "timeStamp": 1589333517684,
        "data": null
    }
     * @apiSampleRequest http://119.23.181.166:21000/adex/cancle_orders_v3
     * @apiVersion 1.0.0
     */

    adex.all('/cancle_orders_v3', async (req, res) => {
        const {address, orders_id, signature,publicKey} = req.body;
        if(!address || !orders_id || !signature || !publicKey){
            return res.json({
                code: errorCode.INVALID_PARAMS,
                errorMsg:'Parameter incomplete',
                timeStamp:Date.now(),
                data:null
            });
        }
        console.log('cancle_orders_v3', address, orders_id, signature);
        const str = orders_id.join();
        const root_hash = crypto_sha256.createHmac('sha256', '123');
        const hash = root_hash.update(str, 'utf8').digest('hex');
        const errs = [];
        // tslint:disable-next-line:forin
        for (const index in orders_id) {
            const [orderInfoErr,orderInfoRes] = await to(order.get_order(orders_id[index]));
            if(orderInfoErr || !orderInfoRes || orderInfoRes.length === 0){
                return res.json({
                    code: errorCode.INVALID_PARAMS,
                    errorMsg:'get order failed ' + orderInfoErr,
                    timeStamp:Date.now(),
                    data:null
                });
            }
            const [verifyErr,verifyRes] = await to(utils.verify2(orderInfoRes[0].trader_address,hash, signature,publicKey));
            if (!verifyRes) {
                return res.json({
                    code: errorCode.VERIFY_FAILED,
                    errorMsg:'Verify failed' + verifyErr,
                    timeStamp:Date.now(),
                    data:null
                });
            }
        }
        for (const index in orders_id) {
            if (!orders_id[index]) continue;
            const order_info = await order.get_order(orders_id[index]);
            // 已经取消过的不报错直接跳过
            if (order_info[0].available_amount <= 0) {
                continue;
            }
            const message = {
                trader_address: order_info[0].trader_address,
                amount: order_info[0].available_amount,
                price: order_info[0].price,
                side: order_info[0].side,
                market_id: order_info[0].market_id,
                id: order_info[0].id,
                status: 'cancled',
            };

            const [err, result] = await to(order.cancle(message));
            if (err) {
                errs.push(err);
            }
        }

        return res.json({
            code: errs.length !== 0 ? errorCode.EXTERNAL_DEPENDENCIES_ERROR : errorCode.SUCCESSFUL,
            errorMsg:errs,
            timeStamp:Date.now(),
            data:null
        });
    });
    /**
     * @api {post} /adex/my_orders_v5 my_orders_v5
     * @apiDescription  Returns the user order record based on the filter criteria
     * @apiName my_orders_v5
     * @apiGroup adex
     * @apiParam {string} address                   user's addrwss
     * @apiParam {number} page                      page
     * @apiParam {number} perPage                   perpage
     * @apiParam {string} status1                   "pending","partial_filled","cancled","full_filled"
     * @apiParam {string} status2                   "pending","partial_filled","cancled","full_filled",Set to "" If you don't want to filter any state
     * @apiParam {string} market_id                 market ID,Set to "" if you want to get all token
     * @apiParam {string} side                      "buy","sell",Set to "" if you want to get all side
     * @apiParam {number} start                     unix time
     * @apiParam {number\} end                       unix time
     * @apiParam {boolean} need_total_length        To calculate paging usage, This is a time-consuming option,You should only set true once,Set false at other times
     * @apiParamExample {json} Request-Example:
     空字符串表示此条件不过滤，status1不能为空，不想过滤时间就设置为0到一个大数(9999999999000)
     当前订单
     {
        "address":"0x66b7637198aee4fffa103fc0082e7a093f81e05a64",
         "page":1,
         "perPage":1,
         "status1":"pending",
         "status2":"partial_filled",
         "market_id":"",
         "side":""，
         "start":0,
         "end":9999999999000,
         "need_total_length":false
     }
     历史订单
     {
        "address":"0x66b7637198aee4fffa103fc0082e7a093f81e05a64",
         "page":1,
         "perPage":1,
         "status1":"cancled",
         "status2":"full_filled",
         "market_id":"",
         "side":""，
          "start":0,
         "end":1576424202000,
         "need_total_length":false
     }
     历史订单-只过滤交易对
     {
        "address":"0x66b7637198aee4fffa103fc0082e7a093f81e05a64",
         "page":1,
         "perPage":1,
         "status1":"cancled",
         "status2":"full_filled",
         "market_id":"ETH-USDT",
         "side":""，
         "start":0,
         "end":1576424202000,
         "need_total_length":false
     }
     历史订单-只过滤已取消订单
     {
        "address":"0x66b7637198aee4fffa103fc0082e7a093f81e05a64",
         "page":1,
         "perPage":1,
         "status1":"cancled",
         "status2":"",
         "market_id":"",
         "side":""，
          "start":0,
         "end":1576424202000,
         "need_total_length":false
     }
     历史订单-过滤买单，已成交，ETH-USDT
     {
        "address":"0x66b7637198aee4fffa103fc0082e7a093f81e05a64",
         "page":1,
         "perPage":1,
         "status1":"full_filled",
         "status2":"",
         "market_id":"ETH-USDT",
         "side":"buy"，
          "start":0,
         "end":1576424202000,
         "need_total_length":false
     }
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
        "code": 0,
        "errorMsg": null,
        "timeStamp": 1589336131775,
        "data": {
            "records": [
                {
                    "id": "ff49af9a51ab01a516a48429bef05235510c3b793d060315178409c94e04bb35",
                    "trader_address": "0x666a3d5822a9550a2dae0402b6e1055d8fabcf5133",
                    "market_id": "ETH-USDT",
                    "side": "sell",
                    "price": "190.78000000",
                    "amount": "0.02120000",
                    "status": "pending",
                    "type": "limit",
                    "available_amount": "0.02120000",
                    "confirmed_amount": "0.00000000",
                    "canceled_amount": "0.00000000",
                    "pending_amount": "0.00000000",
                    "updated_at": "2020-05-13T02:15:07.490Z",
                    "created_at": "2020-05-13T02:15:07.490Z",
                    "signature": "0xe44868070a7c5e61d4b0cfedbc0c14da1cb07c114dffc7a0cd446a6d68d1fed433412cba7a0a9b88297f414d765b832d6904af6eaac3c2f7366a0bebeb3b9f711c",
                    "expire_at": "1589339077145",
                    "average_price": "--",
                    "confirm_value": "--"
                }
            ],
            "totalLength": null
        }
    }
     * @apiSampleRequest http://119.23.181.166:21000/adex/my_orders_v5
     * @apiVersion 1.0.0
     */

    adex.all('/my_orders_v5', async (req, res) => {
        // cancled，full_filled，历史委托
        const {address, page, perPage, status1, status2, market_id, side, start, end, need_total_length} = req.body;
        if(!address || !page || !perPage || !end ||
            side === undefined ||
            status2 === undefined ||
            status1 === undefined ||
            start === undefined ||
            need_total_length === undefined){
            return res.json({
                code: errorCode.INVALID_PARAMS,
                errorMsg:'Parameter incomplete',
                timeStamp:Date.now(),
                data:null
            });
        }
        let [totalLengthErr, totalLength] = [null, null];
        const startDate = new Date(start);
        const endDate = new Date(end);
        const [err, records] = await to(
            order.my_orders_v3(address, page, perPage, status1, status2, market_id, side, startDate, endDate)
        );
        if(need_total_length === true){
            const filter = [address, status1, status2, startDate, endDate,market_id, side];
            [totalLengthErr,totalLength] = await to(client.my_orders_length_v2(filter));
        }
        const result = {records, totalLength};

        res.json({
            code: (!records && totalLengthErr) ? errorCode.EXTERNAL_DEPENDENCIES_ERROR : errorCode.SUCCESSFUL,
            errorMsg:err,
            timeStamp:Date.now(),
            data:result
        });

    });


    adex.all('/order_book_v2/:market_id/:precision', async (req, res) => {
        const {market_id, precision} = req.params
        if(!market_id || !precision){
            return res.json({
                code: errorCode.INVALID_PARAMS,
                errorMsg:'Parameter incomplete',
                timeStamp:Date.now(),
                data:null
            });
        }
        const [err, result] = await to(order.order_book(market_id, precision));

        if (err) console.error(err);

        res.json({
            code: err ? errorCode.EXTERNAL_DEPENDENCIES_ERROR : errorCode.SUCCESSFUL,
            errorMsg:err,
            timeStamp:Date.now(),
            data:result
        });

    });

    adex.all('/list_markets_v2', async (req, res) => {
        const [err, result] = await to(market.list_markets());
        res.json({
            code: err ? errorCode.EXTERNAL_DEPENDENCIES_ERROR : errorCode.SUCCESSFUL,
            errorMsg:err,
            timeStamp:Date.now(),
            data:result
        });
    });

    /**
     * @api {post} /adex/list_online_markets  list_online_markets
     * @apiDescription  Get the market info that are already online and rank them by quote_token_symbol
     * @apiName list_online_markets
     * @apiGroup adex
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
        "code": 0,
        "errorMsg": null,
        "timeStamp": 1589333691474,
        "data": [
            {
                "quoteToken": "CNYC",
                "markets": [
                    {
                        "id": "USDT-CNYC",
                        "base_token_address": "0x63516796902288f51277805dd097419b0d8f1e34c8",
                        "base_token_symbol": "USDT",
                        "quote_token_address": "0x63fb23599aec99b1f9e1267190b17d82ecdae36c19",
                        "quote_token_symbol": "CNYC",
                        "online": true,
                        "up_at": "2020-03-02T06:14:26.731Z",
                        "down_at": "2030-03-02T06:14:26.731Z",
                        "updated_at": null,
                        "created_at": "2020-03-02T06:14:26.731Z"
                    },
                    {
                        "id": "ETH-CNYC",
                        "base_token_address": "0x6386fec100ecde81020d174b93e7be4f78626f193e",
                        "base_token_symbol": "ETH",
                        "quote_token_address": "0x63fb23599aec99b1f9e1267190b17d82ecdae36c19",
                        "quote_token_symbol": "CNYC",
                        "online": true,
                        "up_at": "2020-03-02T06:14:26.822Z",
                        "down_at": "2030-03-02T06:14:26.822Z",
                        "updated_at": null,
                        "created_at": "2020-03-02T06:14:26.822Z"
                    }
                ]
            },
            {
                "quoteToken": "USDT",
                "markets": [
                    {
                        "id": "BTC-USDT",
                        "base_token_address": "0x63f85fc978c2376115937fef0c1f0d5fbd9367529c",
                        "base_token_symbol": "BTC",
                        "quote_token_address": "0x63516796902288f51277805dd097419b0d8f1e34c8",
                        "quote_token_symbol": "USDT",
                        "online": true,
                        "up_at": "2020-03-02T06:14:26.920Z",
                        "down_at": "2030-03-02T06:14:26.920Z",
                        "updated_at": null,
                        "created_at": "2020-03-02T06:14:26.920Z"
                    }
                ]
            }
            ]
            }
        ],
        "err": null
     }
     * @apiSampleRequest http://119.23.181.166:21000/adex/list_online_markets
     * @apiVersion 1.0.0
     */
    adex.all('/list_online_markets', async (req, res) => {
        const [err, result] = await to(market.list_online_markets_v2());
        res.json({
            code: err ? errorCode.EXTERNAL_DEPENDENCIES_ERROR : errorCode.SUCCESSFUL,
            errorMsg:err,
            timeStamp:Date.now(),
            data:result
        });
    });


    adex.all('/rollback_trades', async (req, res) => {
        const [err, result] = await to(trades.rollback_trades());

        res.json({result, err});
    });

    // tmp code
    adex.all('/rollback_zero', async (req, res) => {
        const [err, result] = await to(trades.rollback_zero());

        res.json({result, err});
    });
    /**
     * @api {post} /adex/my_trades_v4 my_trades_v4
     * @apiDescription  Returns the user trades record
     * @apiName my_trades_v4
     * @apiGroup adex
     * @apiParam {string} address                   user's addrwss
     * @apiParam {number} page                      page
     * @apiParam {number} perPage                   perpage
     * @apiParam {string} status                   "matched","pending","failed","successful",Set to "" If you don't want to filter any state
     * @apiParam {string} market_id                 market ID,Set to "" if you want to get all token
     * @apiParam {string} start                     unix time
     * @apiParam {string} end                       unix time
     * @apiParam {boolean} need_total_length         To calculate paging usage, This is a time-consuming option，You should only set true once,Set false at other times
     * @apiParamExample {json} Request-Example:
     空字符串表示此条件不过滤，不想过滤时间就设置为0到一个大数(9999999999000)
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
        "code": 0,
        "errorMsg": null,
        "timeStamp": 1589334513972,
        "data": {
            "recordsRes": [],
            "totalLength": "0"
        }
    }
     * @apiSampleRequest http://119.23.181.166:21000/adex/my_orders_v5
     * @apiVersion 1.0.0
     */

    adex.all('/my_trades_v4', async (req, res) => {
        const {address,page,perPage,market_id,status,start,end,need_total_length} = req.body;
        if(!address || !page || !perPage || !end ||
            market_id === undefined ||
            status === undefined ||
            start === undefined ||
            need_total_length === undefined){
            return res.json({
                code: errorCode.INVALID_PARAMS,
                errorMsg:'Parameter incomplete',
                timeStamp:Date.now(),
                data:null
            });
        }
        let [totalLengthErr,totalLength] = [null,null];
        const startDate = new Date(start);
        const endDate = new Date(end);

        const [recordsErr, records] = await to(trades.my_trades4(address, page, perPage,startDate, endDate, market_id, status));
        if(need_total_length === true){
            const filter = [address, startDate, endDate, market_id, status];
            [totalLengthErr,totalLength] = await to(client.my_trades_length_v2(filter));
        }
        const result = {recordsRes: records, totalLength};
        res.json({
            code: (recordsErr || totalLengthErr) ? errorCode.EXTERNAL_DEPENDENCIES_ERROR : errorCode.SUCCESSFUL,
            errorMsg:recordsErr,
            timeStamp:Date.now(),
            data:result
        });

    });


    return adex;
};
export {get_available_erc20_amount};
