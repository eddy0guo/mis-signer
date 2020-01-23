"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../models/db");
const utils_1 = require("./utils");
class mist_wallet {
    constructor() {
        this.db = new db_1.default();
        this.utils = new utils_1.default;
    }
    async list_tokens() {
        const result = await this.db.list_tokens();
        return result;
    }
    async get_token(symbol) {
        const result = await this.db.get_tokens([symbol]);
        return result;
    }
    async get_token_price2pi(symbol) {
        if (symbol == 'CNYC') {
            return 1;
        }
        let marketID = symbol + '-CNYC';
        let [result, err] = await this.db.get_market_current_price([marketID]);
        if (err)
            console.error(err);
        if (result.length == 0) {
            marketID = symbol + '-USDT';
            const price2usdt = await this.db.get_market_current_price([marketID]);
            const price_usdt2pi = await this.db.get_market_current_price(['USDT-CNYC']);
            if (price2usdt.length == 0) {
                marketID = symbol + '-MT';
                const price2mt = await this.db.get_market_current_price([marketID]);
                const price_mt2pi = await this.db.get_market_current_price(['MT-CNYC']);
                result = price2mt[0].price * price_mt2pi[0].price;
            }
            else {
                result = price2usdt[0].price * price_usdt2pi[0].price;
            }
        }
        else {
            result = result.price;
        }
        return result;
    }
    async get_token_price2btc(symbol) {
        const price2pi = await this.get_token_price2pi(symbol);
        const btc2pi = await this.get_token_price2pi('BTC');
        if (price2pi == 0 || btc2pi == 0) {
            return 0;
        }
        const price2btc = price2pi / btc2pi;
        const result = price2btc.toFixed(6);
        return result;
    }
}
exports.default = mist_wallet;
//# sourceMappingURL=mist_wallet.js.map