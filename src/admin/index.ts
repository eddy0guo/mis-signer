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
import {address} from 'bitcoinjs-lib';
import {stringify} from 'querystring';


// tslint:disable-next-line:no-shadowed-variable
async function get_asset_balances(asset, mist_wallet, address: string, tokenName?: string | undefined): Promise<any[]> {

    let token_arr = await mist_wallet.list_mist_tokens();
    if (tokenName) {
        token_arr = await mist_wallet.get_token(tokenName);
    }
    const balances = [];
    const [assets_balance_err, assets_balance_result] = await to(
        asset.balanceOf(address)
    );

    if (assets_balance_err || !assets_balance_result || assets_balance_result[0].assets === undefined) {
        throw new Error(`[FINGO ADMIN]::(get_asset_balances),${assets_balance_err}`);
    }
    const assets_balance = assets_balance_result[0].assets;

    for (const i in token_arr as any[]) {
        if (!token_arr[i]) continue;

        let asset_balance = 0;
        for (const j in assets_balance) {
            if (token_arr[i].asim_assetid === assets_balance[j].asset) {
                asset_balance = assets_balance[j].value;
            }
        }
        const icon =
            mist_config.icon_url +
            token_arr[i].symbol +
            'a.png';
        const balance_info = {
            token_symbol: token_arr[i].symbol,
            asim_asset_id: token_arr[i].asim_assetid,
            asim_asset_balance: asset_balance / (1 * 10 ** 8),
            icon,
        };

        balances.push(balance_info);
    }
    return balances;
}

export default () => {
    const admin = Router();
    const psql_db = new adexPGClient();
    const mist_wallet = new MistWallet(psql_db);
    const utils = new Utils();
    const order = new Order(psql_db);
    const market: MarketAPI = new MarketAPI(psql_db);

    admin.all('/market_add/:market_id/:base_token_address/:base_token_symbol/:quote_token_address/:quote_token_symbol', async (req, res) => {
        const {market_id, base_token_address, base_token_symbol, quote_token_address, quote_token_symbol} = req.params;
        const [err, result] = await to(psql_db.get_existed_market([market_id]));
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
        const [err, result] = await to(psql_db.get_engine_progress());
        res.json({
            success: !!result,
            result,
            err,
        });
    });

    admin.all('/get_relayer_account', async (req, res) => {
        const relayer_address = mist_config.relayers[0].address;
        const asset = new Asset(mist_config.asimov_child_rpc);
        const [balancesErr, balances] = await to(get_asset_balances(asset, mist_wallet, relayer_address, 'ASIM'));
        res.json({
            success: !!balances,
            result: balances,
            err: balancesErr
        });
    });

    admin.all('/get_bridge_progress', async (req, res) => {
        const [err, result] = await to(psql_db.get_bridger_progress());
        res.json({
            success: !!result,
            result,
            err,
        });
    });

    admin.all('/get_bridge_account', async (req, res) => {
        const bridge_address = mist_config.bridge_address;
        const masterAsset = new Asset(mist_config.asimov_master_rpc);
        const [masterBalancesErr, masterBalances] = await to(get_asset_balances(masterAsset, mist_wallet, bridge_address));
        const childAsset = new Asset(mist_config.asimov_child_rpc);
        const [childBalancesErr, childBalances] = await to(get_asset_balances(childAsset, mist_wallet, bridge_address, 'ASIM'));
        const result = {
            masterBalances,
            childFee: childBalances,
        }

        res.json({
            success: !!(masterBalances && childBalances),
            result,
        });
    });

    admin.all('/get_express_progress', async (req, res) => {
        const [err, result] = await to(psql_db.get_express_progress());
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
        const [balancesErr, balances] = await to(get_asset_balances(asset, mist_wallet, express_address));
        res.json({
            success: !!balances,
            result: balances,
            err: balancesErr
        });
    });

    return admin;
};
