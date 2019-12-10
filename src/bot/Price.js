// https://fxhapi.feixiaohao.com/public/v1/ticker?limit=5

import axios from 'axios'
import to from 'await-to-js'
import consola from 'consola'

export default class Price {
    constructor(initPrices) {
        this.prices = initPrices
        this.timer = -1
    }

    start() {
        this.loop()
    }

    stop() {
        if (this.timer > 0) {
            clearTimeout(this.timer)
            this.timer = -1
        }
    }

    getPrice(market) {
        return this.prices[market]
    }

    async loop() {
        this.stop()
        await this.updatePrice()
        this.timer = setTimeout(() => {
            this.loop.call(this)
        }, 1500);
    }

    async updatePrice() {
        consola.info("--- update price ---")
        let [err,res] = await to(axios.get('https://fxhapi.feixiaohao.com/public/v1/ticker?limit=2'))
        if( err ){
            consola.info('update price err')
            return;
        }
        for( let i in res.data ){
            let info = res.data[i]
            this.prices[info.symbol+'-USDT'] = info.price_usd
        }

        let asim = this.prices["ASIM-CNYc"]
        let usdt = this.prices["USDT-CNYc"]
        let mt = this.prices["MT-CNYc"]

        asim*=1+(Math.random()-0.5)/100*3
        usdt*=1+(Math.random()-0.5)/100
        mt*=1+(Math.random()-0.5)/100*5

        let eth_usdt = this.prices["ETH-USDT"]
        let btc_usdt = this.prices["BTC-USDT"]

        let markets = {
            "BTC-CNYc":btc_usdt*usdt,
            "ETH-CNYc":eth_usdt*usdt,
            "ASIM-CNYc":asim,
            "USDT-CNYc":usdt,
            "MT-CNYc":mt,
            
            "BTC-USDT":btc_usdt,
            "ETH-USDT":eth_usdt,
            "ASIM-USDT":asim/usdt,
        
            "BTC-MT":btc_usdt*usdt/mt,
            "ETH-MT":eth_usdt*usdt/mt,
        }

        this.prices = markets;

        consola.info(markets)

        consola.info("--- price updated  ---")
    }
}
