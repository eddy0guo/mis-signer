"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const await_to_js_1 = require("await-to-js");
const cfg_1 = require("../cfg");
const consola_1 = require("consola");
const config_1 = require("./config");
const localStorage = {};
axios_1.default.headers = 'Access-Control-Allow-Methods:POST, GET, OPTIONS';
axios_1.default.defaults.headers.post['Content-Type'] = 'application/json';
axios_1.default.defaults.baseURL = 'http://119.23.181.166:' + cfg_1.default.mist_server_port;
axios_1.default.interceptors.request.use(config => {
    if (localStorage.token) {
        config.headers.Authorization = 'Bearer ' + localStorage.token;
    }
    return config;
}, error => {
    return Promise.reject(error);
});
axios_1.default.interceptors.response.use(res => {
    if (res.data && res.data.token) {
        localStorage.token = res.data.token;
        consola_1.default.info('Save JWT:', localStorage.token);
    }
    return res;
}, error => {
    consola_1.default.info(error);
    if (error.response.status === 401) {
    }
    else if (error.response.status === 500) {
        return Promise.reject(error.response.data);
    }
    return Promise.reject(error.response.data);
});
class CloudBot {
    constructor(market, priceOracle, amount) {
        this.market = market;
        this.priceOracle = priceOracle;
        this.timer = -1;
        this.amount = amount;
        this.maxOrderPrice = 5000;
        this.loopDepay = 60 * 1000;
        this.$axios = axios_1.default;
        this.accounts = config_1.default.accounts;
        this.password = config_1.default.password;
        this.addresses = config_1.default.addresses;
        this.sides = ['buy', 'sell'];
    }
    price() {
        return this.priceOracle.getPrice(this.market);
    }
    static async login() {
        const res = await this.$axios({
            method: 'post',
            url: `/did/signin`,
            header: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            data: {
                username: 'this.email',
                password: 'this.password'
            }
        });
        consola_1.default.info(res);
    }
    start(delay) {
        setTimeout(() => {
            this.loop.call(this);
        }, delay);
    }
    stop() {
        if (this.timer > 0) {
            clearTimeout(this.timer);
            this.timer = -1;
        }
    }
    async loop() {
        this.stop();
        await this.main();
        this.timer = setTimeout(() => {
            this.loop.call(this);
        }, this.loopDepay);
    }
    async main() {
        await this.trade(true);
        await this.trade(false);
    }
    async trade(buy) {
        let addPrice = (this.price() / 1000) * Math.random() * 50;
        addPrice = buy ? -addPrice : addPrice;
        const price = this.price() + addPrice;
        let amount = this.maxOrderPrice / this.price() * Math.random();
        if (this.amount > 0) {
            amount = this.amount * Math.random();
            amount = Number(amount.toFixed(4));
        }
        const side = buy ? 'buy' : 'sell';
        const index = Math.random() > 0.5 ? 0 : 1;
        const address = this.addresses[index];
        const account = this.accounts[index];
        const order_id = await this.buildOrder(side, price, amount, address);
        const signature = await this.signOrder(account, order_id);
        const res = await this.confirmOrder(side, price, amount, address, signature, order_id);
        consola_1.default.info('BOT:', this.market, this.price(), side, price.toFixed(2), amount.toFixed(4), res ? 'success' : 'failed');
    }
    async confirmOrder(side, price, amount, address, signature, order_id) {
        const [err, res] = await await_to_js_1.default(this.$axios({
            method: 'get',
            url: '/adex/build_order',
            params: {
                marketID: this.market,
                side,
                price: price.toFixed(2),
                amount: amount.toFixed(4),
                trader_address: address,
                signature,
                order_id
            }
        }));
        if (err) {
            consola_1.default.info('confirmOrder err');
            return;
        }
        return res;
    }
    async signOrder(username, order_id) {
        const [err, res] = await await_to_js_1.default(this.$axios({
            method: 'post',
            url: '/did/order_sign',
            data: {
                username,
                order_id
            }
        }));
        if (err) {
            consola_1.default.info('signOrder err');
            return;
        }
        const signature = res.data.signature;
        return signature;
    }
    async buildOrder(side, price, amount, address) {
        const [err, res] = await await_to_js_1.default(this.$axios({
            method: 'get',
            url: '/adex/get_order_id',
            params: {
                marketID: this.market,
                side,
                price: price.toFixed(2),
                amount: amount.toFixed(4),
                trader_address: address
            }
        }));
        if (err) {
            consola_1.default.info('buildOrder err');
            return;
        }
        const order_id = res.data;
        return order_id;
    }
}
exports.default = CloudBot;
//# sourceMappingURL=CloudBot.js.map