import utils2 from '../api/utils';
import to from 'await-to-js';
import mist_wallet1 from '../api/mist_wallet';
import Token from '../../wallet/contract/Token';
import Asset from '../../wallet/asset/Asset';
import NP from 'number-precision';

export default class users {
    private db;
    private utils;
    private mist_wallet;
    private logger;
    private exchange;

    constructor(client?, logger?) {
        this.db = client;
        this.utils = new utils2;
        this.mist_wallet = new mist_wallet1();
        this.logger = logger;
        this.exchange;
    }

    async start() {
        NP.enableBoundaryChecking(false);
        this.loop_token();
        this.loop_total();
    }

    async get_total_balance(token_info, user_address) {

        const token = new Token(token_info.address);
        const [err, balance] = await to(token.balanceOf(user_address));
        if (err)console.error(err);

        const asset = new Asset(token_info.asim_assetid);
        const [err4, assets_balance] = await to(asset.balanceOf(user_address));
        if (err4)console.error(err4);
        let asset_balance = 0;
        for (const j in assets_balance) {
            if (token_info.asim_assetid == assets_balance[j].asset) {
                asset_balance = assets_balance[j].value;
            }
        }
        const total_balance = NP.divide(+balance, 100000000) + (+asset_balance);
        return total_balance;

    }

    async loop_token() {
        const users = await this.db.list_users();
        const create_time = this.utils.get_current_time();
        const token_arr = await this.mist_wallet.list_tokens();

        for (const i in users) {
            const address = users[i].address;
            const balances = [];
            const valuations = [];
            for (const j in token_arr) {
                const total_balance = await this.get_total_balance(token_arr[j], address);
                balances.push(total_balance);
                const price = await this.mist_wallet.get_token_price2pi(token_arr[j].symbol);
                const valuation = NP.times(price, total_balance);
                valuations.push(valuation);
            }

            const update_info = balances.concat(valuations);
            update_info.push(create_time);
            update_info.push(address);
            console.log('obj123=', update_info);
            await this.db.update_user_token(update_info);
        }
        setTimeout(() => {
            this.loop_token.call(this);
            // 间隔时间随着用户量的增长而降低
        }, 1000 * 10);

    }

    async loop_total() {
        const users = await this.db.list_users();
        const create_time = this.utils.get_current_time();
        const token_arr = await this.mist_wallet.list_tokens();

        for (const i in users) {
            const address = users[i].address;
            let totals = 0;
            for (const j in token_arr) {
                const token_symbol = token_arr[j].symbol;

                const price = await this.mist_wallet.get_token_price2pi(token_symbol);
                const total_balance = await this.get_total_balance(token_arr[j], address);
                totals = NP.plus(totals, NP.times(price, total_balance));
            }

            const update_info = [totals, create_time, address];
            await this.db.update_user_total(update_info);
        }
        setTimeout(() => {
            this.loop_total.call(this);
            // 	}, 1000 * 60 * 60 * 24);
        }, 1000 * 60 * 60 * 12);

    }

}
