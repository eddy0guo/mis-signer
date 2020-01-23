"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
exports.default = (options) => {
    if (options)
        console.log(options);
    const api = express_1.Router();
    api.get('/', (req, res) => {
        res.json('hello bot');
    });
    return api;
};
//# sourceMappingURL=index.js.map