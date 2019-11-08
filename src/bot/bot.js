import axios from 'axios'
export default class bot {
    
    constructor(market) {
        this.market = market
        this.timer = -1
    }

    start() {
        this.loop()
    }

    stop(){
        if(this.timer > 0 ){
            clearTimeout(this.timer)
            this.timer = -1
        }
    }

    async loop() {
        this.stop()
        await this.main()
        this.timer = setTimeout(() => {
            this.loop.call(this)
        }, 15000);
    }

    async main() {
        
    }

}