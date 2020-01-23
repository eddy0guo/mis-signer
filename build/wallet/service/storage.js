"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const localStorage = {
    data: {},
};
localStorage.getItem = function (key) {
    return localStorage.data[key];
};
localStorage.setItem = function (key, data) {
    return localStorage.data[key] = data;
};
localStorage.removeItem = function (key) {
    delete localStorage.data[key];
};
localStorage.clear = function () {
    localStorage.data = {};
};
const chrome = {};
exports.default = {
    get(key) {
        return new Promise((resolve, reject) => {
            if (chrome.storage) {
                chrome.storage.local.get(key, function (result) {
                    resolve(result[key]);
                });
            }
            else {
                let data = localStorage.getItem(key);
                try {
                    data = JSON.parse(data);
                }
                catch (e) { }
                resolve(data);
            }
        });
    },
    set(key, data) {
        const tmpl_data = {};
        tmpl_data[key] = data;
        return new Promise((resolve, reject) => {
            if (chrome.storage) {
                chrome.storage.local.set(tmpl_data, function () {
                    resolve();
                });
            }
            else {
                if (typeof data == 'object') {
                    data = JSON.stringify(data);
                }
                localStorage.setItem(key, data);
                resolve();
            }
        });
    },
    remove(key) {
        return new Promise((resolve, reject) => {
            if (chrome.storage) {
                chrome.storage.local.remove(key, function () {
                    resolve();
                });
            }
            else {
                localStorage.removeItem(key);
                resolve();
            }
        });
    },
    clear() {
        return new Promise((resolve, reject) => {
            if (chrome.storage) {
                localStorage.clear();
                chrome.storage.local.clear(function () {
                    resolve();
                });
            }
            else {
                localStorage.clear();
                resolve();
            }
        });
    },
    setKeypair(data) {
        return this.set('p_a', data);
    },
    getKeypair() {
        return this.get('p_a');
    },
    removeKeypair() {
        return this.remove('p_a');
    },
    setPubKeys(data) {
        return this.set('pubKeys', data);
    },
    getPubKeys() {
        return this.get('pubKeys');
    },
    removePubKeys() {
        return this.remove('pubKeys');
    },
};
//# sourceMappingURL=storage.js.map