"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const express_1 = require("express");
const morgan_1 = require("morgan");
const Price_1 = require("./Price");
const CloudBot_1 = require("./CloudBot");
console.log = () => { };
const markets = {
    'ASIM-CNYC': 15,
    'USDT-CNYC': 7,
    'MT-CNYC': 50,
    'BTC-CNYC': 63861,
    'ETH-CNYC': 1290,
    'ASIM-USDT': 2,
    'ETH-USDT': 185,
    'BTC-USDT': 9163,
    'BTC-MT': 63861 / 50,
    'ETH-MT': 1290 / 50,
};
const amounts = {
    'ASIM-CNYC': 0,
    'USDT-CNYC': 0,
    'MT-CNYC': 0,
    'BTC-CNYC': 0,
    'ETH-CNYC': 0,
    'ASIM-USDT': 0,
    'ETH-USDT': 0,
    'BTC-USDT': 0,
    'BTC-MT': 0,
    'ETH-MT': 0,
};
const priceOracle = new Price_1.default(markets);
priceOracle.start();
for (const i in markets) {
    const amount = amounts[i];
    const bot = new CloudBot_1.default(i, priceOracle, amount);
    bot.start(5 + i * 1);
}
const app = express_1.default();
app.server = http_1.default.createServer(app);
app.use(morgan_1.default('dev'));
app.all('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'content-type');
    res.header('Access-Control-Allow-Methods', 'DELETE,PUT,POST,GET,OPTIONS');
    if (req.method.toLowerCase() == 'options')
        res.send(200);
    else
        next();
});
const cli_1 = require("./cli");
app.use('/cli', cli_1.default());
exports.default = app;
//# sourceMappingURL=index.js.map