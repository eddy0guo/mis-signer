import to from 'await-to-js';
import NP from '../common/NP';
import {Router} from 'express';

import {chain} from '../wallet/api/chain';
import MarketAPI from '../adex/api/market';


import MistWallet from '../adex/api/mist_wallet';
import Order from '../adex/api/order';
import Utils from '../adex/api/utils';
import adexPGClient from '../adex/models/db';

import mist_config from '../cfg';
import Asset from '../wallet/contract/Asset';
import Token from '../wallet/contract/Token';
import * as Queue from 'bull';
import mistConfig from '../cfg';
import {BullOption} from '../cfg';
import * as redis from 'redis';

export default () => {
    const admin = Router();
    const db = new adexPGClient();
    const mist_wallet = new MistWallet(db);
    const utils = new Utils();
    const order = new Order(db);
    const market: MarketAPI = new MarketAPI(db);
    const orderQueue:Queue.Queue = new Queue('OrderQueue' + process.env.MIST_MODE,BullOption);
    let redisClient;
    if (typeof BullOption.redis !== 'string') {
        redisClient = redis.createClient(BullOption.redis.port, BullOption.redis.host);
        redisClient.auth(BullOption.redis.password);
    }

    admin.all('/market_add/:market_id/:base_token_address/:base_token_symbol/:quote_token_address/:quote_token_symbol', async (req, res) => {
        const {market_id, base_token_address, base_token_symbol, quote_token_address, quote_token_symbol} = req.params;
        const [err, result] = await to(db.get_existed_market([market_id]));
        if (!result || result.length !== 0) {
            console.error('this markets id have been exsited', err);
            return res.json({
                success: false,
                err: err ? err : 'this markets id have been exsited',
            });
        }

        const info = utils.arr_values(req.params);
        const [add_err, add_result] = await to(market.market_add(info));
        res.json({
            success: !add_result ? false : true,
            result,
            err,
        });
    });

    admin.all('/add_token/:symbol/:asset_address/:asset_id/:erc20_address', async (req, res) => {
        const {symbol, asset_address, asset_id, erc20_address} = req.params;
        if (!symbol || !asset_address || !asset_id || !erc20_address) {
            return res.json({
                success: false,
                err: 'check params failed!,Please check it'
            });
        }
        const [err, result] = await to(mist_wallet.add_token(symbol, asset_address, asset_id, erc20_address));
        res.json({
            success: !result ? false : true,
            result,
            err,
        });
    });

    admin.all('/market_down/:market_id/:down_at', async (req, res) => {
        const {market_id, down_at} = req.params;
        if (!market_id || !down_at) {
            return res.json({
                success: false,
                err: 'check params failed!,Please check it'
            });
        }
        const downDate = new Date(down_at);
        const currentDate = new Date();
        if (downDate < currentDate) {
            return res.json({
                success: false,
                err: 'down_at must be later than now!,Please check it'
            });
        }

        const [err, result] = await to(market.market_down(market_id, down_at));
        res.json({
            success: !result ? false : true,
            result,
            err,
        });
    });


    admin.all('/market_up/:market_id/:up_at', async (req, res) => {
        const {market_id, up_at} = req.params;
        if (!market_id || !up_at) {
            return res.json({
                success: false,
                err: 'check params failed!,Please check it'
            });
        }

        const upDate = new Date(up_at);
        const currentDate = new Date();
        if (upDate < currentDate) {
            return res.json({
                success: false,
                err: 'up_at must be later than now!,Please check it'
            });
        }

        const [err, result] = await to(market.market_up(market_id, up_at));
        res.json({
            success: !result ? false : true,
            result,
            err,
        });
    });


    admin.all('/get_engine_progress', async (req, res) => {
        const [err, result] = await to(db.get_engine_progress());
        res.json({
            success: !!result,
            result,
            err,
        });
    });

    admin.all('/get_relayer_account', async (req, res) => {
        const relayer_address = mist_config.relayers[0].address;
        const asset = new Asset(mist_config.asimov_child_rpc);
        const [balancesErr, balances] = await to(asset.get_asset_balances(mist_wallet, relayer_address, 'ASIM'));
        res.json({
            success: !!balances,
            result: balances,
            err: balancesErr
        });
    });
    admin.all('/get_mist_earnings', async (req, res) => {
        const mistTokenBalances = [];
        const token_arr = await mist_wallet.list_mist_tokens();
        for (const i in token_arr as any[]) {
            if (!token_arr[i]) continue;
            const token = new Token(mistConfig.mist_earnings_address);
            const [token_balance_err, token_balance_result] = await to(token.balanceOf(token_arr[i].symbol));
            if (token_balance_err || !token_balance_result) {
                console.error(`[FINGO ADMIN]::(get_mist_token_balances),%o,${token_balance_err},`, token_arr[i]);
                return res.json({
                    success: false,
                    err: token_balance_err
                });
            }
            const balance_info = {
                token_symbol: token_arr[i].symbol,
                mist_token_balance: token_balance_result,
            };

            mistTokenBalances.push(balance_info);
        }
        res.json({
            success: true,
            result: mistTokenBalances,
        });
    });

    admin.all('/get_bridge_progress', async (req, res) => {
        const [err, result] = await to(db.get_bridger_progress());
        res.json({
            success: !!result,
            result,
            err,
        });
    });

    admin.all('/get_bridge_account', async (req, res) => {
        const bridge_address = mist_config.bridge_address;
        const masterAsset = new Asset(mist_config.asimov_master_rpc);
        const [masterBalancesErr, masterBalances] = await to(masterAsset.get_asset_balances(mist_wallet, bridge_address));
        const childAsset = new Asset(mist_config.asimov_child_rpc);
        const [childBalancesErr, childBalances] = await to(childAsset.get_asset_balances(mist_wallet, bridge_address, 'ASIM'));

        const token_arr = await mist_wallet.list_mist_tokens();
        const bridgeInfos = [];
        for (const i in token_arr as any[]) {
            if (!token_arr[i]) continue;
            const token = new Token(token_arr[i].address);
            const [totalErr, total] = await to(token.totalSupply('child_poa'));
            if (totalErr || !total) {
                console.error(`[FINGO ADMIN]::(get_mist_token_totalSupply),%o,${totalErr},`, token_arr[i]);
                return res.json({
                    success: false,
                    err: totalErr
                });
            }
          //  balance = baseAmount + feeAmount - chainTotal
          //  chainTotal = bridgeMint - bridgeBurn
            const bridgeMint = await db.getBridgeMint([token_arr[i].symbol]);
            const bridgeBurn = await db.getBridgeBurn([token_arr[i].symbol]);
            const bridgeFee = await db.getBridgeFee([token_arr[i].symbol]);
            const bridgeInfo = {
                symbol: token_arr[i].symbol,
                chainTotal: total / (1 * 10 ** 8),
                bridgeMint,
                bridgeBurn,
                bridgeFee,
            };

            bridgeInfos.push(bridgeInfo);
        }

        const result = {
            masterBalances,
            childFee: childBalances,
            bridgeInfos
        }

        res.json({
            success: !!(masterBalances && childBalances),
            result,
        });
    });

    admin.all('/get_express_progress', async (req, res) => {
        const [err, result] = await to(db.get_express_progress());
        res.json({
            success: !!result,
            result,
            err,
        });
    });

    admin.all('/get_express_account', async (req, res) => {
        // tslint:disable-next-line:no-shadowed-variable
        const express_address = mist_config.express_address;
        const asset = new Asset(mist_config.asimov_master_rpc);
        const [balancesErr, balances] = await to(asset.get_asset_balances(mist_wallet, express_address));
        res.json({
            success: !!balances,
            result: balances,
            err: balancesErr
        });
    });

    admin.all('/order_queue/:cmd', async (req, res) => {
        const {cmd} = req.params;
        if( cmd === 'pause'){
            await orderQueue.pause();
        } else if ( cmd === 'resume' ){
            await orderQueue.resume();
        }
        res.json({
            success: true,
            cmd
        });
    });

    admin.all('/cancel_all_orders', async (req, res) => {
        while(true) {
            // cancle 1000 order every time
            const orders = await db.listAvailableOrders();
            // tslint:disable-next-line:no-shadowed-variable
            for (const oneOrder of orders) {
                const message = {
                    trader_address: oneOrder.trader_address,
                    amount: oneOrder.available_amount,
                    price: oneOrder.price,
                    side: oneOrder.side,
                    market_id: oneOrder.market_id,
                    id: oneOrder.id,
                    status: 'cancled',
                };
                const [err, result] = await to(order.cancle(message));
                if (err) {
                    console.log('cancel_all_orders error',err);
                    return res.json({
                        success: false ,
                        err,
                    });
                }
            }
            if(orders.length < 1000){
                break;
            }
        }
        return res.json({
            success: true ,
            err: null,
        });
    });

    return admin;
};
