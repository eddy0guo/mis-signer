"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const wallet_1 = require("./wallet");
const adex_1 = require("./adex");
const config = require("./config.json");
const express_1 = require("./express");
const cfg_1 = require("./cfg");
const responseTime = function () {
    return function (req, res, next) {
        req._startTime = new Date().getTime();
        const calResponseTime = function () {
            const now = new Date().getTime();
            const deltaTime = now - req._startTime;
            console.log(`[REQ TIME]:${deltaTime}`);
        };
        res.once('finish', calResponseTime);
        res.once('close', calResponseTime);
        return next();
    };
};
const app = express();
app.server = http.createServer(app);
app.use(morgan('dev'));
app.use(cors({
    exposedHeaders: config.corsHeaders
}));
app.use(bodyParser.json({
    limit: config.bodyLimit
}));
app.all('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'content-type');
    res.header('Access-Control-Allow-Methods', 'DELETE,PUT,POST,GET,OPTIONS');
    if (req.method.toLowerCase() == 'options')
        res.send(200);
    else
        next();
});
app.use(responseTime());
app.use('/wallet', wallet_1.default());
app.use('/adex', adex_1.default());
app.use('/express', express_1.default());
app.server.listen(process.env.PORT || cfg_1.default.mist_server_port, () => {
    console.log(`Started on port ${app.server.address().port}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map