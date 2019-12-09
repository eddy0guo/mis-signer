import Cfg from '../cfg.js';
export const getCurrencyRate2USD = function (currency) {
    return fetch(Cfg.RateDomain + '/forex/quotelist?column=code,price&code=FOREXUSD' + currency, {
        mode: 'no-cors'
    }).then(res => {
        return res.text();
    }).then((res) => {
        if (res) {
            let data = res.replace(/\(|\)|;/g, '');
            return JSON.parse(data)["Data"][0][0][1] / 10000;
        }
        return 1;
    })
}
