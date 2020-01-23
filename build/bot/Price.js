"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const await_to_js_1 = require("await-to-js");
const consola_1 = require("consola");
class Price {
    constructor(initPrices) {
        this.prices = initPrices;
        this.timer = -1;
    }
    start() {
        this.loop();
    }
    stop() {
        if (this.timer > 0) {
            clearTimeout(this.timer);
            this.timer = -1;
        }
    }
    getPrice(market) {
        return this.prices[market];
    }
    async loop() {
        this.stop();
        await this.updatePrice();
        this.timer = setTimeout(() => {
            this.loop.call(this);
        }, 1500);
    }
    async updatePrice() {
        consola_1.default.info('--- update price ---');
        const [err, res] = await await_to_js_1.default(axios_1.default.get('https://fxhapi.feixiaohao.com/public/v1/ticker?limit=2'));
        if (err) {
            consola_1.default.info('update price err');
            return;
        }
        for (const i in res.data) {
            const info = res.data[i];
            this.prices[info.symbol + '-USDT'] = info.price_usd;
        }
        let asim = this.prices['ASIM-CNYC'];
        let usdt = this.prices['USDT-CNYC'];
        let mt = this.prices['MT-CNYC'];
        asim *= 1 + (Math.random() - 0.5) / 100 * 3;
        usdt *= 1 + (Math.random() - 0.5) / 100;
        mt *= 1 + (Math.random() - 0.5) / 100 * 5;
        const eth_usdt = this.prices['ETH-USDT'];
        const btc_usdt = this.prices['BTC-USDT'];
        const markets = {
            'BTC-CNYC': btc_usdt * usdt,
            'ETH-CNYC': eth_usdt * usdt,
            'ASIM-CNYC': asim,
            'USDT-CNYC': usdt,
            'MT-CNYC': mt,
            'BTC-USDT': btc_usdt,
            'ETH-USDT': eth_usdt,
            'ASIM-USDT': asim / usdt,
            'BTC-MT': btc_usdt * usdt / mt,
            'ETH-MT': eth_usdt * usdt / mt,
        };
        this.prices = markets;
        consola_1.default.info(markets);
        consola_1.default.info('--- price updated  ---');
    }
}
exports.default = Price;
//# sourceMappingURL=Price.js.map