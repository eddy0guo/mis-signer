import {AsimovWallet} from '@fingo/asimov-wallet';
import MistWallet from '../../adex/api/mist_wallet'
import mist_config from '../../cfg';
import utils2 from '../../adex/api/utils';
import {address} from 'bitcoinjs-lib';
import to from 'await-to-js';

// 直接用AsimovWallet获得余额也可以
export default class Asset {

    private readonly rpc;

    constructor(rpc: string) {
        this.rpc = rpc;
    }

    // tslint:disable-next-line:no-shadowed-variable
    public async balanceOf(address: string): Promise<any> {
        const wallet = new AsimovWallet({
            rpc: this.rpc,
            address,
        });
        return wallet.balance()
    }

    // tslint:disable-next-line:no-shadowed-variable
    public async get_asset_balances(mist_wallet: MistWallet, address: string, tokenName?: string | undefined): Promise<any[]> {

        let token_arr = await mist_wallet.list_mist_tokens();
        if (tokenName) {
            token_arr = await mist_wallet.get_token(tokenName);
        }
        const balances = [];
        const [assets_balance_err, assets_balance_result] = await to(
            this.balanceOf(address)
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

}
