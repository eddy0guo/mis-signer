import client from '../models/db'
import utils2 from './utils'

export default class mist_wallet {
    db;
    exchange;
    root_hash;

    constructor() {
        this.db = new client();
        this.utils = new utils2;
    }


    async list_tokens() {
        let result = await this.db.list_tokens();
        return result;
    }

    async get_token(symbol) {
        let result = await this.db.get_tokens([symbol]);
        return result;
    }

    //寻找交易对的优先级依次为，PI,USDT,MT
    async get_token_price2pi(symbol) {
        if (symbol == 'CNYC') {
            return 1;
        }
        let marketID = symbol + "-CNYC";
        let [result, err] = await this.db.get_market_current_price([marketID]);
        //如果24小时没有成交的交易对，对应的价格为0,如果交易对不存在也是这样判断,fixme
        if (result.length == 0) {
            marketID = symbol + "-USDT";
            let price2usdt = await this.db.get_market_current_price([marketID]);
            let price_usdt2pi = await this.db.get_market_current_price(["USDT-CNYC"]);


            if (price2usdt.length == 0) {
                marketID = symbol + "-MT";
                let price2mt = await this.db.get_market_current_price([marketID]);
                let price_mt2pi = await this.db.get_market_current_price(["MT-CNYC"]);
                result = price2mt[0].price * price_mt2pi[0].price;
            } else {
                result = price2usdt[0].price * price_usdt2pi[0].price;
            }

        } else {
            result = result.price;
        }

        return result;
    }


    async get_token_price2btc(symbol) {
        let price2pi = await this.get_token_price2pi(symbol);

        let btc2pi = await this.get_token_price2pi("BTC");
        if (price2pi == 0 || btc2pi == 0) {
            return 0;
        }

        let price2btc = price2pi / btc2pi;

        let result = price2btc.toFixed(6)
        return result;
    }

}
