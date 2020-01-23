"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const cfg_1 = require("../../cfg");
const service = axios_1.default.create({
    baseURL: cfg_1.default.asimov_chain_rpc,
    timeout: 30000,
});
service.interceptors.request.use(config => {
    config.params = Object.assign({
        m: config && config.data && config.data.method,
    }, config.params);
    config.baseURL = cfg_1.default.asimov_chain_rpc;
    config.headers['Content-Type'] = 'application/json';
    return config;
}, error => {
    console.error(error);
    Promise.reject(error);
});
service.interceptors.response.use(response => {
    const data = response.data;
    if (data.error) {
        console.error('err' + data.error);
        if (data.error.code == -32000) {
            return Promise.reject(data.error);
        }
        console.error(data);
        return Promise.reject(data.error);
    }
    else {
        return data.result !== undefined ? data.result : response;
    }
}, error => {
    if (error.code == -5) {
        return Promise.reject(error);
    }
    console.error(error);
    return Promise.reject(error);
});
function rpc(url, params) {
    return service.request({
        url: '/',
        method: 'post',
        data: {
            jsonrpc: '2.0',
            method: url,
            params,
            id: new Date().getTime(),
        },
    });
}
exports.rpc = rpc;
exports.default = service;
//# sourceMappingURL=request.js.map