import to from 'await-to-js';
import Utils from './utils';
import {IToken} from '../interface';
import DBClient from '../models/db';
import ExpressDBClient from '../../express/models/db';

export default class mist_wallet {
    private db:DBClient|ExpressDBClient;
    private utils:Utils;

    constructor(client:DBClient|ExpressDBClient) {
        this.db = client;
        this.utils = new Utils();
    }

    async list_mist_tokens(): Promise<IToken[]> {
        return await this.db.list_tokens();
    }

    async get_token(symbol): Promise<IToken[]> {
        return await this.db.get_tokens([symbol]);
    }

    async add_token(symbol: string, asset_address: string, asset_id: string, erc20_address: string): Promise<any> {
        const currentTime = this.utils.get_current_time();
        const token = [symbol,symbol,erc20_address,8,asset_id,asset_address,currentTime];
        return await (this.db as DBClient).insert_token(token);
    }

    // 寻找交易对的优先级依次为，PI,USDT,MT
    // 价格为0有两种可能的原因，如果24小时没有成交的交易，交易对不存在
    async get_token_price2pi(symbol:string): Promise<number> {
        if (symbol === 'CNYC') {
            return 1;
        }
        const db = (this.db as DBClient);
        let marketID = symbol + '-CNYC';
        const result = await db.get_market_current_price([marketID]);
        let price = 0;

        if (result.length <= 0) {
            marketID = symbol + '-USDT';
            const price2usdt = await db.get_market_current_price([marketID]);
            const price_usdt2pi = await db.get_market_current_price(['USDT-CNYC']);

            if (price2usdt.length === 0) {
                marketID = symbol + '-MT';
                const price2mt = await db.get_market_current_price([marketID]);
                const price_mt2pi = await db.get_market_current_price(['MT-CNYC']);
                price = price2mt[0].price * price_mt2pi[0].price;
            } else {
                price = price2usdt[0].price * price_usdt2pi[0].price;
            }

        } else {
            price = result[0].price;
        }

        return price;
    }

    async get_token_price2btc(symbol:string): Promise<number> {
        const price2pi = await this.get_token_price2pi(symbol);
        const btc2pi = await this.get_token_price2pi('BTC');
        if (price2pi === 0 || btc2pi === 0) {
            return 0;
        }
        const price2btc = price2pi / btc2pi;

        const result = price2btc.toFixed(6);
        return parseFloat(result);
    }

}
