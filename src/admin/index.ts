import to from 'await-to-js';
import NP from '../common/NP';
import {Router} from 'express';

import {chain} from '../wallet/api/chain';

import MistWallet from '../adex/api/mist_wallet';
import Order from '../adex/api/order';
import Utils from '../adex/api/utils';
import adexPGClient from '../adex/models/db';

import mist_config from '../cfg';
import Asset from '../wallet/contract/Asset';


export default () => {
    const admin = Router();
    const psql_db = new adexPGClient();
    const mist_wallet = new MistWallet(psql_db);
    const utils = new Utils();
    const order = new Order(psql_db);

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

    admin.all('/get_engine_info', async (req, res) => {
        const [err, result] = await to(psql_db.get_engine_info());
        res.json({
            success: !result ? false : true,
            result,
            err,
        });
    });

    admin.all('/get_express_pool', async (req, res) => {
        const token_arr = await mist_wallet.list_mist_tokens();

        const balances = [];
        const asset = new Asset();
        const [assets_balance_err, assets_balance_result] = await to(
            asset.balanceOf(mist_config.express_address)
        );

        if (assets_balance_err || !assets_balance_result || assets_balance_result[0].assets === undefined) {
            console.error('[ADEX EXPRESS]::(balanceOf):', assets_balance_err, assets_balance_result);
            return res.json({
                success: false,
                err: assets_balance_err,
            });
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
            console.log(balance_info);
        }
        res.json({
            success: true,
            result: balances,
        });
    });

    return admin;
};
