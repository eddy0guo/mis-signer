import to from 'await-to-js';
import {Router} from 'express';
import NP from '../common/NP';

import urllib = require('url');
import crypto_sha256 = require('crypto');

import OrderAPI from './api/order';
import TradesAPI from './api/trades';
import MarketAPI from './api/market';
import Utils from './api/utils';

import DBClient from './models/db';
import MistWallet from './api/mist_wallet';

import MistConfig from '../cfg';
import Token from '../wallet/contract/Token';
import Asset from '../wallet/contract/Asset';

import {IOrder as IOrder} from './interface';
import mistConfig from '../cfg';

// TODO :  这个RPC请求很高频，可能成为性能瓶颈
// 1 优化可能：rpc请求加入块高度缓存，这样一个块高度只请求一次（已在wallet sdk完成）
// 2 同余额接口，让用户在交易所API那边也有一个登录操作，让服务端可以知道需要持续更新哪些用户的余额。
// 对于已经登录的用户，服务端启动固定的进程去定时更新余额。该接口改为直接返回缓存余额
// 3 sql查询的优化
async function get_available_erc20_amount(address, symbol, client:DBClient, mist_wallet) {
    const token_info = await mist_wallet.get_token(symbol);
    const token = new Token(token_info[0].address);
    const [err, res] = await to(token.balanceOf(address, 'child_poa'));
    if (err) console.error(err);
    const balance = NP.divide(Number(res), 1 * 10 ** 8);

    let freeze_amount = 0;
    const freeze_result = await client.get_freeze_amount([address, symbol]);
    if (freeze_result && freeze_result.length > 0) {
        for (const freeze of freeze_result) {
            if (freeze.side === 'buy') {
                freeze_amount = NP.plus(freeze_amount, freeze.quote_amount);
            } else if (freeze.side === 'sell') {
                freeze_amount = NP.plus(freeze_amount, freeze.base_amount);
            } else {
                console.error(`${freeze.side} error`);
            }
        }
    }

    return NP.minus(balance, freeze_amount);
}

export default () => {
    const adex: Router = Router();
    const client: DBClient = new DBClient();
    const order: OrderAPI = new OrderAPI(client);
    const trades: TradesAPI = new TradesAPI(client);
    const market: MarketAPI = new MarketAPI(client);

    const mist_wallet: MistWallet = new MistWallet(client);

    const utils = new Utils();


    adex.all('/compat_query/:sql', async (req, res) => {
        let {sql} = req.params;
        sql = sql.toLowerCase();
        const select = sql.includes('select');
        const write = sql.includes('drop') || sql.includes('create') || sql.includes('update') || sql.includes('insert') || sql.includes('delete');
        if (select && !write ) {
            const [err, result] = await to(client.compat_query(sql));
            res.json({
                success: true,
                result,
            });
        } else {
            res.json({
                success: true,
                err: 'support readonly',
            });
        }
    });
    adex.all('/mist_user_overview/:address', async (req, res) => {
        const address = req.params.address;
        const [current_order_err, current_orders_length] = await to(
            order.my_orders_length(address, 'pending', 'partial_filled')
        );
        const [history_order_err, history_orders_length] = await to(
            order.my_orders_length(address, 'cancled', 'full_filled')
        );
        const [trades_err, trades_length] = await to(
            trades.my_trades_length(address)
        );
        const [birdge_err, bridge_length] = await to(
            client.my_bridge_length([address])
        );

        if (current_order_err || history_order_err || trades_err || birdge_err) {
            console.error(
                'get fingo_user_overview error',
                current_order_err,
                history_order_err,
                trades_err,
                birdge_err
            );
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

    // TODO 该方法生产环境无法访问
    adex.all('/list_market_quotations_v2', async (req, res) => {
        const result = await market.list_market_quotations();
        res.json({
            success: true,
            result,
        });
    });


    adex.all('/list_tokens_v2', async (req, res) => {
        const result = await mist_wallet.list_mist_tokens();
        res.json({
            success: true,
            result,
        });
    });

    /**
     * @api {post} /adex/get_token_price_v2/:symbol 币种价格
     * @apiDescription 获取币种当前对CNYC价格
     * @apiName get_token_price_v2
     * @apiGroup adex
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
        "success": true,
        "result": 831.43
     }
     * @apiSampleRequest https://poa.mist.exchange/api/adex/get_token_price_v2/ETH
     * @apiVersion 1.0.0
     */

    adex.all('/get_token_price_v2/:symbol', async (req, res) => {
        const {symbol} = req.params;
        const result = await mist_wallet.get_token_price2pi(symbol);
        res.json({
            success: true,
            result,
        });
    });

    adex.all('/get_token_price2btc/:symbol', async (req, res) => {
        const result = await mist_wallet.get_token_price2btc(req.params.symbol);
        res.json({result});
    });

    /**
     * @api {post} /adex/balances_v2 全资产余额详情
     * @apiDescription 返回托管资产，币币资产，币币冻结资产的详情(建议用asset_balances或者erc20_balances替换)
     * @apiName balances_v
     * @apiGroup adex
     * @apiParam {string} address 用户地址
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
        "success": true,
        "result": [
            {
                "token_symbol": "CNYC",
                "erc20_address": "0x638374231575328e380610fbb12020c29e11afcd01",
                "erc20_balance": 89.578222,
                "erc20_freeze_amount": 0.17441799999999996,
                "asim_assetid": "000000000000000c00000000",
                "asim_asset_balance": "2904",
                "asset_icon": "https://www.mist.exchange/res/icons/CNYCa.png",
                "coin_icon": "https://www.mist.exchange/res/icons/CNYCm.png"
            },
            {
                "token_symbol": "ASIM",
                "erc20_address": "0x637cffb37ebe8a19eb1d227e7678b27c60ad6be643",
                "erc20_balance": 68.998,
                "erc20_freeze_amount": 0,
                "asim_assetid": "000000000000000000000000",
                "asim_asset_balance": "751.1204214800001",
                "asset_icon": "https://www.mist.exchange/res/icons/ASIMa.png",
                "coin_icon": "https://www.mist.exchange/res/icons/ASIMm.png"
            },
            {
                "token_symbol": "BTC",
                "erc20_address": "0x63d202a9f65a4de95f7b2ea1ea632bfc27f10dff8c",
                "erc20_balance": 0.002,
                "erc20_freeze_amount": 0,
                "asim_assetid": "000000000000000b00000001",
                "asim_asset_balance": "0.03512235",
                "asset_icon": "https://www.mist.exchange/res/icons/BTCa.png",
                "coin_icon": "https://www.mist.exchange/res/icons/BTCm.png"
            },
            {
                "token_symbol": "USDT",
                "erc20_address": "0x634277ed606d5c01fa24e9e057fcfa7fedea36bc76",
                "erc20_balance": 0,
                "erc20_freeze_amount": 0,
                "asim_assetid": "000000000000000b00000003",
                "asim_asset_balance": 0,
                "asset_icon": "https://www.mist.exchange/res/icons/USDTa.png",
                "coin_icon": "https://www.mist.exchange/res/icons/USDTm.png"
            },
            {
                "token_symbol": "ETH",
                "erc20_address": "0x63720b32964170980b216cabbb4ecdd0979f8c9c17",
                "erc20_balance": 0.0010989,
                "erc20_freeze_amount": 0,
                "asim_assetid": "000000000000000b00000002",
                "asim_asset_balance": 0,
                "asset_icon": "https://www.mist.exchange/res/icons/ETHa.png",
                "coin_icon": "https://www.mist.exchange/res/icons/ETHm.png"
            },
            {
                "token_symbol": "MT",
                "erc20_address": "0x6382b81526d098e3ed8d013df2963c7410fea593d1",
                "erc20_balance": 0.5005979,
                "erc20_freeze_amount": 0,
                "asim_assetid": "000000000000000300000003",
                "asim_asset_balance": "0.93370587",
                "asset_icon": "https://www.mist.exchange/res/icons/MTa.png",
                "coin_icon": "https://www.mist.exchange/res/icons/MTm.png"
            }
        ]
    }

     * @apiSampleRequest https://poa.mist.exchange/api/adex/balances_v2?address=0x66ea4b7f7ad33b0cc7ef94bef71bc302789b815c46
     * @apiVersion 1.0.0
     */
    adex.all('/balances_v2', async (req, res) => {
        const obj = urllib.parse(req.url, true).query;
        const token_arr = await mist_wallet.list_mist_tokens();
        const balances = [];

        const address: string = obj.address as string;

        const asset = new Asset(mistConfig.asimov_master_rpc);
        const [err4, result4] = await to(asset.balanceOf(address));
        if (err4 || !result4 || result4[0].assets === undefined) {
            console.error('[MIST SIGNER]::(asset.balanceOf):', err4, result4);
            return res.json({
                success: false,
                err: err4,
            });
        }
        const assets_balance = result4[0].assets;

        for (const i in token_arr as any[]) {
            if (!token_arr[i]) continue;
            const token = new Token(token_arr[i].address);
            const [err, result] = await to(token.balanceOf(address, 'child_poa'));
            if (err || result === undefined) {
                console.error('[MIST SIGNER]::(2222token.balanceOf):', err, result);
                return res.json({
                    success: false,
                    err,
                });
            }
            let asset_balance = 0;
            for (const j in assets_balance) {
                if (!assets_balance[j]) continue;
                if (token_arr[i].asim_assetid === assets_balance[j].asset) {
                    asset_balance = assets_balance[j].value;
                }
            }

            let freeze_amount = 0;
            const freeze_result = await client.get_freeze_amount([
                obj.address,
                token_arr[i].symbol,
            ]);
            if (freeze_result && freeze_result.length > 0) {
                for (const freeze of freeze_result) {
                    if (freeze.side === 'buy') {
                        freeze_amount = NP.plus(freeze_amount, freeze.quote_amount);
                    } else if (freeze.side === 'sell') {
                        freeze_amount = NP.plus(freeze_amount, freeze.base_amount);
                    } else {
                        console.error(`${freeze.side} error`);
                    }
                }
            }

            const balance_info = {
                token_symbol: token_arr[i].symbol,
                erc20_address: token_arr[i].address,
                erc20_balance: Number(result) / (1 * 10 ** 8),
                erc20_freeze_amount: freeze_amount,
                asim_assetid: token_arr[i].asim_assetid,
                asim_asset_balance: asset_balance / (1 * 10 ** 8),
                asset_icon:
                    MistConfig.icon_url +
                    token_arr[i].symbol +
                    'a.png',
                coin_icon:
                    MistConfig.icon_url +
                    token_arr[i].symbol +
                    'm.png',
            };

            balances.push(balance_info);
        }

        res.json({
            success: true,
            result: balances,
        });
    });

    /**
     * @api {post} /adex/asset_balances/:address 托管资产余额
     * @apiDescription 用户的托管资产余额
     * @apiName asset_balances
     * @apiGroup express
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
    "success": true,
    "result": [
        {
            "token_symbol": "CNYC",
            "asim_assetid": "000000000000000c00000000",
            "asim_asset_balance": "2904",
            "value": 2904,
            "token_icon": "https://www.mist.exchange/res/icons/CNYCa.png"
        },
        {
            "token_symbol": "ASIM",
            "asim_assetid": "000000000000000000000000",
            "asim_asset_balance": "751.1212253599999",
            "value": 11559.7556582904,
            "token_icon": "https://www.mist.exchange/res/icons/ASIMa.png"
        },
        {
            "token_symbol": "BTC",
            "asim_assetid": "000000000000000b00000001",
            "asim_asset_balance": "0.03512235",
            "value": 1668.7271224005,
            "token_icon": "https://www.mist.exchange/res/icons/BTCa.png"
        },
        {
            "token_symbol": "USDT",
            "asim_assetid": "000000000000000b00000003",
            "asim_asset_balance": 0,
            "value": 0,
            "token_icon": "https://www.mist.exchange/res/icons/USDTa.png"
        },
        {
            "token_symbol": "ETH",
            "asim_assetid": "000000000000000b00000002",
            "asim_asset_balance": 0,
            "value": 0,
            "token_icon": "https://www.mist.exchange/res/icons/ETHa.png"
        },
        {
            "token_symbol": "MT",
            "asim_assetid": "000000000000000300000003",
            "asim_asset_balance": "0.93370587",
            "value": 68.6740667385,
            "token_icon": "https://www.mist.exchange/res/icons/MTa.png"
        }
    ]
}

     * @apiSampleRequest https://poa.mist.exchange/api/adex/asset_balances/0x66ea4b7f7ad33b0cc7ef94bef71bc302789b815c46
     * @apiVersion 1.0.0
     */

    adex.all('/asset_balances/:address', async (req, res) => {
        const {address} = req.params;
        const token_arr = await mist_wallet.list_mist_tokens();
        const balances = [];

        const asset = new Asset(mistConfig.asimov_master_rpc);
        const [err4, result4] = await to(asset.balanceOf(address));
        if (err4 || !result4 || result4[0].assets === undefined) {
            console.error(err4, result4);
            return res.json({
                success: false,
                err: err4,
            });
        }
        const assets_balance = result4[0].assets;

        for (const i in token_arr as any[]) {
            if (!token_arr[i]) continue;
            let asset_balance = 0;
            for (const j in assets_balance) {
                if (token_arr[i].asim_assetid === assets_balance[j].asset) {
                    asset_balance = assets_balance[j].value;
                }
            }
            const price = await mist_wallet.get_token_price2pi(token_arr[i].symbol);

            const balance_info = {
                token_symbol: token_arr[i].symbol,
                asim_assetid: token_arr[i].asim_assetid,
                asim_asset_balance: asset_balance / (1 * 10 ** 8),
                value: NP.times(asset_balance / (1 * 10 ** 8), price),
                token_icon:
                    MistConfig.icon_url +
                    token_arr[i].symbol +
                    'a.png',
            };

            balances.push(balance_info);
        }

        res.json({
            success: true,
            result: balances,
        });
    });

    /**
     * @api {post} /adex/erc20_balances/:address 币币资产余额
     * @apiDescription 用户的币币资产余额
     * @apiName erc20_balances
     * @apiGroup express
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
   "success": true,
   "result": [
       {
           "token_symbol": "CNYC",
           "erc20_address": "0x638374231575328e380610fbb12020c29e11afcd01",
           "erc20_balance": 89.578222,
           "erc20_freeze_amount": 0,
           "asim_assetid": "000000000000000c00000000",
           "value": 89.578222,
           "token_icon": "https://www.mist.exchange/res/icons/CNYCm.png"
       },
       {
           "token_symbol": "ASIM",
           "erc20_address": "0x637cffb37ebe8a19eb1d227e7678b27c60ad6be643",
           "erc20_balance": 68.998,
           "erc20_freeze_amount": 0,
           "asim_assetid": "000000000000000000000000",
           "value": 977.01168,
           "token_icon": "https://www.mist.exchange/res/icons/ASIMm.png"
       },
       {
           "token_symbol": "BTC",
           "erc20_address": "0x63d202a9f65a4de95f7b2ea1ea632bfc27f10dff8c",
           "erc20_balance": 0.002,
           "erc20_freeze_amount": 0,
           "asim_assetid": "000000000000000b00000001",
           "value": 95.0247,
           "token_icon": "https://www.mist.exchange/res/icons/BTCm.png"
       },
       {
           "token_symbol": "USDT",
           "erc20_address": "0x634277ed606d5c01fa24e9e057fcfa7fedea36bc76",
           "erc20_balance": 0,
           "erc20_freeze_amount": 0,
           "asim_assetid": "000000000000000b00000003",
           "value": 0,
           "token_icon": "https://www.mist.exchange/res/icons/USDTm.png"
       },
       {
           "token_symbol": "ETH",
           "erc20_address": "0x63720b32964170980b216cabbb4ecdd0979f8c9c17",
           "erc20_balance": 0.0010989,
           "erc20_freeze_amount": 0,
           "asim_assetid": "000000000000000b00000002",
           "value": 0.91406502,
           "token_icon": "https://www.mist.exchange/res/icons/ETHm.png"
       },
       {
           "token_symbol": "MT",
           "erc20_address": "0x6382b81526d098e3ed8d013df2963c7410fea593d1",
           "erc20_balance": 0.5005979,
           "erc20_freeze_amount": 0,
           "asim_assetid": "000000000000000300000003",
           "value": 36.813969566,
           "token_icon": "https://www.mist.exchange/res/icons/MTm.png"
       }
   ]
}
     * @apiSampleRequest https://poa.mist.exchange/api/adex/erc20_balances/0x66ea4b7f7ad33b0cc7ef94bef71bc302789b815c46
     * @apiVersion 1.0.0
     */
    // TODO :  这个接口有30秒返回的问题。
    // 可能有2个地方可以优化，一个是token合约增加一个批量查询多地址的函数。
    // 第二个是让用户在交易所API那边也有一个登录操作，让服务端可以知道需要持续更新哪些用户的余额。
    // 对于已经登录的用户，服务端启动固定的进程去定时更新余额。该接口改为直接返回缓存余额
    adex.all('/erc20_balances/:address', async (req, res) => {
        const {address} = req.params;
        const token_arr = await mist_wallet.list_mist_tokens();
        const balances = [];

        const logs = [];
        logs.push({start:new Date().toLocaleTimeString(),address});

        for (const tokenInfo of token_arr as any[]) {
            const token = new Token(tokenInfo.address);
            const [err, result] = await to(token.balanceOf(address, 'child_poa'));
            if (err || result === undefined) {
                console.error(err);
                return res.json({
                    success: false,
                    err,
                });
            }
            logs.push({balanceOf:new Date().toLocaleTimeString(),token:tokenInfo.address,result});

            let freeze_amount = 0;
            const freeze_result = await client.get_freeze_amount([
                address,
                tokenInfo.symbol,
            ]);
            if (freeze_result && freeze_result.length > 0) {
                for (const freeze of freeze_result) {
                    if (freeze.side === 'buy') {
                        freeze_amount = NP.plus(freeze_amount, freeze.quote_amount);
                    } else if (freeze.side === 'sell') {
                        freeze_amount = NP.plus(freeze_amount, freeze.base_amount);
                    } else {
                        console.error(`${freeze.side} error`);
                    }
                }
            }
            const price = await mist_wallet.get_token_price2pi(tokenInfo.symbol);
            const erc20_balance = Number(result) / (1 * 10 ** 8);

            logs.push({get_token_price2pi:new Date().toLocaleTimeString(),price});

            const balance_info = {
                token_symbol: tokenInfo.symbol,
                erc20_address: tokenInfo.address,
                erc20_balance,
                erc20_freeze_amount: freeze_amount,
                asim_assetid: tokenInfo.asim_assetid,
                value: NP.times(erc20_balance, price),
                token_icon:
                    MistConfig.icon_url +
                    tokenInfo.symbol +
                    'm.png',
            };

            balances.push(balance_info);
        }

        logs.push({end:new Date().toLocaleTimeString()});
        console.log('erc20_balances_logs',logs);

        res.json({
            success: true,
            result: balances,
        });
    });

    /**
     * @api {post} /adex/get_order_id_v2/:trader_address/:marketID/:side/:price/:amount 获取撮合订单ID
     * @apiDescription 获取撮合订单ID
     * @apiName get_order_id_v2
     * @apiGroup adex
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
    "success": true,
    "result": "976528bf51cff225e267e54256191afb80c3845aa39656481dc0c6e792d8bbfa"
 }
     * @apiSampleRequest https://poa.mist.exchange/api/adex/get_order_id_v2/0x66a9ae316e1914dc8d835d5cd2ed57ab24b52a02c7/ASIM-CNYC/sell/100/6000
     * @apiVersion 1.0.0
     */

    adex.all('/get_order_id_v2/:trader_address/:marketID/:side/:price/:amount', async (req, res) => {
            const {trader_address, marketID, side, price, amount} = req.params;
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
        }
    );


    /**
     * @api {post} /adex/build_order_v3 创建撮合订单
     * @apiDescription 广播币币资产的划入，并且进行托管资产的划出
     * @apiName build_order_v3
     * @apiGroup adex
     * @apiParam {json}   signature         签名信息
     * @apiParam {string} trader_address    交易地址
     * @apiParam {string} market_id         交易对
     * @apiParam {string} amount            买卖数量
     * @apiParam {string} price             价格
     * @apiParam {string} order_id          订单ID
     * @apiParamExample {json} Request-Example:
     {"signature":
          {
            "r": "19e54db2a1871c6ea22f4b195598a3f368c5d7b6dd65e89deeb764ccc5782d73",
            "s": "13f2bb87c30fb3967ee0607a4acb1c42df988c4601bd0b920736da85fdea04e4",
            "pubkey": "037cfb1769aa470e139c30f8cfd17d47f44e5317ad7f5b6e31e358d1e6e3df2832"
        },
     "trader_address":"0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9",
     "market_id":"ASIM-CNYC",
     "side":"sell",
     "price":10000,
     "amount":6,
     "order_id":"1bc97051c8e0693d03fb5fe27430bead5a11ea4047e07abba162b4a83807118e"
     }
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
        "success": true,
        "result": "[]",
        "err": null
    }
     * @apiSampleRequest https://poa.mist.exchange/api/adex/build_order_v3
     * @apiVersion 1.0.0
     */
    // TODO :  这个接口有10秒返回超时的问题，并且是最高频接口之一。
    // 1 优化可能：rpc请求加入块高度缓存，这样一个块高度只请求一次
    // 2 同余额接口，让用户在交易所API那边也有一个登录操作，让服务端可以知道需要持续更新哪些用户的余额。
    // 对于已经登录的用户，服务端启动固定的进程去定时更新余额。该接口改为直接返回缓存余额
    adex.all('/build_order_v3', async (req, res) => {
        const {
            trader_address,
            market_id,
            side,
            price,
            amount,
            order_id,
            signature,
        } = req.body;

        if (
            !(
                trader_address &&
                market_id &&
                side &&
                price &&
                amount &&
                order_id &&
                signature
            )
        ) {
            return res.json({
                success: false,
                err: `Params Error`,
            });
        }

        // 直接判断队列长度，如果消费阻塞，返回失败
        const waitingOrders = await order.queueWaitingCount();
        if( waitingOrders > 100 ) {
            return res.json({
                success: false,
                err: 'Match Engine Busy Now:' + waitingOrders,
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
                err: 'The precision of quantity and price is only supported up to the fourth decimal point',
            });
        }

        // 参考binance下单价格限制在盘口的上下五倍
        const [last_trade_err, last_trade] = await to(trades.list_trades(market_id));
        if (last_trade_err || !last_trade) {
            console.error('[MIST SIGNER]:(trades.list_trades):', last_trade_err, last_trade);
            return res.json({
                success: false,
                err: last_trade_err,
            });
        }
        // init limit 0 ～ 100000
        let min_limit = 0;
        let max_limit = 100000;
        if (last_trade.length !== 0) {
            max_limit = NP.times(last_trade[0].price, 5);
            min_limit = NP.divide(last_trade[0].price, 5);
        }

        if (price < min_limit || price > max_limit) {
            return res.json({
                success: false,
                err: `The price must be between ${min_limit} and ${max_limit}`,
            });
        }

        const [base_token, quota_token] = market_id.split('-');
        if (side === 'buy') {
            const available_quota = await get_available_erc20_amount(
                trader_address,
                quota_token,
                client,
                mist_wallet
            );
            const quota_amount = NP.times(+amount, +price);
            if (quota_amount > available_quota) {
                console.log(`${market_id} base  balance is not enoungh,available amount is ${available_quota},but your want to sell ${amount}`)
                return res.json({
                    success: false,
                    err: `quotation  balance is not enoungh,available amount is ${available_quota},but your order value is ${quota_amount}`,
                });
            }
        } else if (side === 'sell') {
            const available_base = await get_available_erc20_amount(
                trader_address,
                base_token,
                client,
                mist_wallet
            );
            if (amount > available_base) {
                console.log(`${market_id} base  balance is not enoungh,available amount is ${available_base},but your want to sell ${amount}`)
                return res.json({
                    success: false,
                    err: `${market_id} base  balance is not enoungh,available amount is ${available_base},but your want to sell ${amount}`,
                });
            }
        } else {
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
            price: +price,
            amount: +amount,
            status: 'pending',
            type: 'limit',
            available_amount: +amount,
            confirmed_amount: 0,
            canceled_amount: 0,
            pending_amount: 0,
            updated_at: null,
            created_at: null,
        };

        const [err, result2] = await to(order.build(message));
        res.json({
            success: result2 ? true : false,
            err,
        });
    });


    /**
     * @api {post} /adex/cancle_order_v2 取消撮合订单
     * @apiDescription 取消撮合订单
     * @apiName cancle_order_v2
     * @apiGroup adex
     * @apiParam {json}   signature         签名信息
     * @apiParam {string} order_id          订单ID
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
        "success": true,
        "result": "[]",
        "err": null
    }
     * @apiSampleRequest https://poa.mist.exchange/api/adex/cancle_order_v2
     * @apiVersion 1.0.0
     */

    adex.all('/cancle_order_v2', async (req, res) => {
        // FIXME : cancel spell error
        const {order_id, signature} = req.body;
        const success = utils.verify(order_id, signature);
        if (!success) {
            return res.json({
                success: false,
                err: 'Verify failed',
            });
        }

        const order_info: IOrder[] = await order.get_order(order_id);
        if (!order_info || order_info.length <= 0) {
            return res.json({
                success: false,
                err: 'Order ID Not Found.',
            });
        }
        const message = {
            amount: order_info[0].available_amount,
            side: order_info[0].side,
            price: order_info[0].price,
            market_id: order_info[0].market_id,
            id: order_id,
        };

        const [err, result] = await to(order.cancle_order(message));
        res.json({
            success: !result ? false : true,
            result,
            err,
        });
    });


    /**
     * @api {post} /adex/cancle_orders 取消用户所有撮合订单
     * @apiDescription 取消用户所有撮合订单
     * @apiName cancle_orders_v2
     * @apiGroup adex
     * @apiParam {json}   signature         签名信息
     * @apiParam {String[]} orders_id          订单ID
     * @apiParam {string} address           用户地址
     * @apiParamExample {json} Request-Example:
     *       {"address":"0x66e03763123f479fdb1ead7ad8a5b8a7d2f7cda64d",
     * "orders_id":["afe61f5c6197947f13d836bc89753d38e922e3e816ec5bb5bd8c74ccd5a9e0a1","6ceb8a97ac53567c6d79db09685b815a2708f845d427a7e0a3d9a4f0e89cb83c1"],
     * "signature":{"r":"8761246c1539182ddbcaf5c2b36f17a188dbd26b3879267882375debe458e84a",
     * "s":"358f8cc504f83f426136b7999c931103ac81bfeb3e2d2fb0fd7eee8b4c43a2ac",
     * "pubkey":"036b5f0cac8c822c17f3eb6cba466dd8b4720e7450cd607cb69967fbeb9ec6b32d"}
            }
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
        "success": true,
        "result": "[]",
        "err": null
    }
     * @apiSampleRequest https://poa.mist.exchange/api/adex/cancle_order_v2
     * @apiVersion 1.0.0
     */

    adex.all('/cancle_orders_v2', async (req, res) => {
        const {address, orders_id, signature} = req.body;
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
            if (!orders_id[index]) continue;
            const order_info = await order.get_order(orders_id[index]);
            // 已经取消过的不报错直接跳过
            if (order_info[0].available_amount <= 0) {
                continue;
            }
            // 不能取消别人的订单
            if (order_info[0].trader_address !== address) {
                return res.json({
                    success: false,
                    err: 'You can‘t cancel others order',
                });
            }

            const message = {
                amount: order_info[0].available_amount,
                price: order_info[0].price,
                side: order_info[0].side,
                market_id: order_info[0].market_id,
                id: order_info[0].id,
            };

            const [err, result] = await to(order.cancle_order(message));
            if (err) {
                errs.push(err);
            } else {
                results.push(result);
            }
        }

        return res.json({
            success: errs.length === 0 ? true : false,
            result: results,
            err: errs,
        });
    });


    /**
     * @api {post} /adex/my_trades_length/:address 用户历史成交数
     * @apiDescription 获取用户历史成交总数
     * @apiName my_trades_length
     * @apiGroup adex
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
        "success": true,
        "result": "748549",
        "err": null
    }
     * @apiSampleRequest https://poa.mist.exchange/api/adex/my_trades_length/0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9
     * @apiVersion 1.0.0
     */
    adex.all('/my_trades_length/:address', async (req, res) => {
        const {address} = req.params;
        const [err, result] = await to(trades.my_trades_length(address));

        res.json({
            success: !result ? false : true,
            result,
            err,
        });
    });


    /**
     * @api {post} /adex/my_orders_v2/:address/:page/:perpage/:status1/:status2 获取订单列表
     * @apiDescription 获取用户历史成交列表,status包含4种:pending,partial_filled,cancled，full_filled
     * @apiName my_orders_v2
     * @apiGroup adex
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
        "success": true,
        "result": [
            {
                "id": "eca409738aca8385fbf77f5dcd6c629be220fbefe8b423ed1db412f118e9b774",
                "trader_address": "0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9",
                "market_id": "ETH-USDT",
                "side": "sell",
                "price": "136.47000000",
                "amount": "36.42330000",
                "status": "pending",
                "type": "limit",
                "available_amount": "36.42330000",
                "confirmed_amount": "0.00000000",
                "canceled_amount": "0.00000000",
                "pending_amount": "0.00000000",
                "updated_at": "2019-12-31T05:28:10.644Z",
                "created_at": "2019-12-31T05:28:10.644Z"
            }
        ],
        "err": null
    }
     * @apiSampleRequest https://poa.mist.exchange/api/adex/my_orders_v2/0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9/1/1/pending/fullfuilled
     * @apiVersion 1.0.0
     */

    adex.all(
        '/my_orders_v2/:address/:page/:perPage/:status1/:status2',
        async (req, res) => {
            // pending,partial_filled,当前委托
            // cancled，full_filled，历史委托
            const {address, page, perPage, status1, status2} = req.params;
            const [err, result] = await to(
                order.my_orders(address, +page, +perPage, status1, status2)
            );

            res.json({
                success: !result ? false : true,
                result,
                err,
            });
        }
    );

    adex.all(
        '/my_orders_v3/:address/:market_id/:page/:perPage/:status1/:status2',
        async (req, res) => {
            // pending,partial_filled,当前委托
            // cancled，full_filled，历史委托
            const {address, page, perPage, status1, status2, market_id} = req.params;
            const [err, result] = await to(
                order.my_orders(address, +page, +perPage, status1, status2, market_id)
            );

            res.json({
                success: !result ? false : true,
                result,
                err,
            });
        }
    );


    adex.all('/order_book_v2/:market_id/:precision', async (req, res) => {
        const {market_id, precision} = req.params
        const [err, result] = await to(order.order_book(market_id, precision));

        if (err) console.error(err);

        res.json({
            success: result ? true : false,
            result,
            err,
        });

    });

    adex.all('/list_markets_v2', async (req, res) => {
        const [err, result] = await to(market.list_markets());
        res.json({
            success: !result ? false : true,
            result,
            err,
        });
    });

    adex.all('/list_online_markets', async (req, res) => {
        const [err, result] = await to(market.list_online_markets());
        res.json({
            success: !result ? false : true,
            result,
            err,
        });
    });


    adex.all('/rollback_trades', async (req, res) => {
        const [err, result] = await to(trades.rollback_trades());

        res.json({result, err});
    });


    adex.all('/list_trades_v2/:market_id', async (req, res) => {
        const {market_id} = req.params;

        const [err, result] = await to(market.get_market(market_id));
        if (err || !result) {
            res.json({
                success: false,
                err,
            });
        }

        const [err2, result2] = await to(trades.list_trades(market_id));

        if (err2) {
            res.json({
                success: false,
                err: err2,
            });
        } else {
            res.json({
                success: true,
                result: result2,
            });
        }
    });


    /**
     * @api {post} /adex/my_trades_v2/:address/:page/:perpage/ 获取历史成交列表
     * @apiDescription 获取用户历史成交列表
     * @apiName my_trades_v2
     * @apiGroup adex
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
   "success": true,
   "result": [
       {
           "id": "a55b5c0b6e269a5851ecb40def6191a77c5c6e4d57106f402339edbe60a51fa9",
           "trade_hash": "0x53f3fe73e5a90292070f168fc22786208532b80d5207e195cacb9c98ddc4ffde",
           "transaction_id": 40717,
           "transaction_hash": null,
           "status": "matched",
           "market_id": "ETH-USDT",
           "maker": "0x66b7637198aee4fffa103fc0082e7a093f81e05a64",
           "taker": "0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9",
           "price": "126.66000000",
           "amount": "3.39450000",
           "taker_side": "buy",
           "maker_order_id": "32eb0fb52699a456f51f605b8190b823c56b780da6fa4a60e8b58006f059e702",
           "taker_order_id": "1fc99c3ef934b4f5055bf70d8d21ba0b2bac93cfdedfd7a0b9003c021aa721e4",
           "updated_at": "2019-12-31T05:32:41.699Z",
           "created_at": "2019-12-31T05:32:41.699Z"
       }
   ],
   "err": null
}

     * @apiSampleRequest https://poa.mist.exchange/api/adex/my_trades_v2/0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9/1/1
     * @apiVersion 1.0.0
     */

    adex.all('/my_trades_v2/:address/:page/:per_page', async (req, res) => {
        const [err, result] = await to(
            trades.my_trades2(
                req.params.address,
                req.params.page,
                req.params.per_page
            )
        );
        res.json({
            success: !result ? false : true,
            result,
            err,
        });
    });


    return adex;
};
export {get_available_erc20_amount};
