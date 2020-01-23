"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../models/db");
const utils_1 = require("./utils");
const await_to_js_1 = require("await-to-js");
const mist_wallet_1 = require("./mist_wallet");
class makets {
    constructor() {
        this.db = new db_1.default();
        this.utils = new utils_1.default;
    }
    async list_markets() {
        const result = await this.db.list_markets();
        return result;
    }
    async get_market(market_id) {
        return await this.db.get_market([market_id]);
    }
    async list_market_quotations() {
        const markets = await this.list_markets();
        const quotation = new mist_wallet_1.default;
        const quotations = [];
        for (const index in markets) {
            const [err, result] = await await_to_js_1.default(this.db.get_market_quotations([markets[index].id]));
            if (!err && result && result.length > 0) {
                const base_token = result[0].market_id.split('-')[0];
                result[0].CNYC_price = await quotation.get_token_price2pi(base_token);
                quotations.push(result[0]);
            }
        }
        return quotations;
    }
}
exports.default = makets;
//# sourceMappingURL=market.js.map