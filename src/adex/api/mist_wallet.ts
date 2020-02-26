import utils2 from './utils';
import {IToken} from '../interface';

export default class mist_wallet {
    private db;
    private utils;

    constructor(client) {
        this.db = client;
        this.utils = new utils2();
    }

    async list_mist_tokens() :Promise<IToken[]>{
        const result = await this.db.list_tokens();
        return result;
    }

    async get_token(symbol): Promise<IToken[]> {
        const result = await this.db.get_tokens([symbol]);
        return result;
    }

    // 寻找交易对的优先级依次为，PI,USDT,MT
	// 价格为0有两种可能的原因，如果24小时没有成交的交易，交易对不存在
    async get_token_price2pi(symbol) : Promise<number>{
        if (symbol === 'CNYC') {
            return 1;
        }
        let marketID = symbol + '-CNYC';
        let [result, err] = await this.db.get_market_current_price([marketID]);
        if (err)console.error(err);
        err = null;
        if (result.length === 0) {
            marketID = symbol + '-USDT';
            const price2usdt = await this.db.get_market_current_price([marketID]);
            const price_usdt2pi = await this.db.get_market_current_price(['USDT-CNYC']);

            if (price2usdt.length === 0) {
                marketID = symbol + '-MT';
                const price2mt = await this.db.get_market_current_price([marketID]);
                const price_mt2pi = await this.db.get_market_current_price(['MT-CNYC']);
                result = price2mt[0].price * price_mt2pi[0].price;
            } else {
                result = price2usdt[0].price * price_usdt2pi[0].price;
            }

        } else {
            result = result.price;
        }

        return result;
    }

    async get_token_price2btc(symbol) : Promise<number>{
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
