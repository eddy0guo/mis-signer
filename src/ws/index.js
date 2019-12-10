import to from 'await-to-js'
import hash from 'object-hash'
import consola from 'consola'
import Order from '../adex/api/order'
import Market from '../adex/api/market'
import Trades from '../adex/api/trades'
import DB from '../adex/models/db'
import cfg from '../cfg'

console.log = ()=>{}

class WSMananger {
    constructor() {
        this.init()
        this.db = new DB();
        this.order = new Order(this.db)
        this.market = new Market()
        this.trades = new Trades(this.db)

        this.depthHash = {}

        this.loopDelay = 3 * 1000

        this.start()
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

    async loop() {
        this.stop()

        let markets = await this.listMarkets()
        let data = {
            type:'markets',
            markets
        }

        // 判断数据hash后再推送

        this.broadcast(data)

        // 测试时暂时只更新2个交易对。也可以每个交易对启动一个进程
        await this.updateMarket('ASIM-CNYc')
        await this.updateMarket('MT-CNYc')
        await this.updateMarket('USDT-CNYc')
        await this.updateMarket('BTC-CNYc')
        await this.updateMarket('ETH-CNYc')

        await this.updateMarket('BTC-USDT')
        await this.updateMarket('ASIM-USDT')
        await this.updateMarket('ETH-USDT')

        await this.updateMarket('BTC-MT')
        await this.updateMarket('ETH-MT')
        
        this.timer = setTimeout(() => {
            this.loop.call(this)
        }, this.loopDelay);
    }

    async updateMarket(marketID){
        let orderbook = await this.listOrderBook(marketID)
        let data = {
            type:'orderbook',
            market:marketID,
            orderbook
        }
        
        // check data hash
        let dataHash = hash(data)
        if( this.depthHash[marketID] == dataHash ){
            return
        }
        this.depthHash[marketID] = dataHash

        this.broadcastMarket(marketID,data)

        // data = {
        //     type:"newMarketTrade",
        //     market,
        //     trade:{
        //         price:100,
        //         amount:Math.random()*100,
        //         updateAt:new Date().getTime(),
        //         taker_side:Math.random()>0.5?'buy':'sell'
        //     }
        //   }
        
        // this.broadcastMarket('ASIM-CNYc',data)
    }

    broadcast(msg) {
        this.wsServer.connections.forEach( (connection)=> {
            let json = JSON.stringify(msg)
            connection.sendUTF(json);
        });
    }

    broadcastMarket(marketID,msg) {
        consola.info("broadcastMarket",marketID)
        this.wsServer.connections.forEach( (connection)=> {
            if( connection.marketID == marketID ){
                let json = JSON.stringify(msg)
                connection.sendUTF(json);
            }
        });
    }

    async listOrderBook(marketID) {
    // TODO: FIMME : order这里挂了，检查下相关逻辑
       let [err,result] = await to(this.order.order_book(marketID));
       if(err) consola.info('listOrderBook',err)
       return result
	}

	async listMarkets () {
       let [err,result] = await to(this.market.list_markets());
       if(err) consola.info('listMarkets',err)
       return result
	}

	async listTrades(marketID) {
       let [err,result] = await to(this.trades.list_trades(marketID));
       if(err) consola.info('listTrades',err)
       return result
    }
    
    async updateClientInfo(marketID,connection) {
        consola.info('updateClientInfo',connection.remoteAddress,marketID)
        await this.listTrades(marketID)
    }

    init() {
        var WebSocketServer = require('websocket').server;
        var http = require('http');

        var server = http.createServer(function (request, response) {
            consola.info((new Date()) + ' Received request for ' + request.url);
            response.writeHead(404);
            response.end();
        });
        server.listen(cfg.websocket_port, function () {
            consola.info((new Date()) + 'WebSocket Server is listening on port:',cfg.websocket_port);
        });

        this.wsServer = new WebSocketServer({
            httpServer: server,
            // You should not use autoAcceptConnections for production
            // applications, as it defeats all standard cross-origin protection
            // facilities built into the protocol and the browser.  You should
            // *always* verify the connection's origin and decide whether or not
            // to accept it.
            autoAcceptConnections: false
        });

        function originIsAllowed(origin) {
            // put logic here to detect whether the specified origin is allowed.
            return true;
        }

        this.wsServer.on('request',  (request) => {
            if (!originIsAllowed(request.origin)) {
                // Make sure we only accept requests from an allowed origin
                request.reject();
                consola.info((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
                return;
            }

            var connection = request.accept('echo-protocol', request.origin);
            consola.info((new Date()) + ' Connection accepted.',request.origin)

            connection.on('message', async (message) => {
                if (message.type === 'utf8') {
                    let marketID = message.utf8Data
                    connection.marketID = marketID
                    consola.info('Received Message: ' + marketID);
                    
                    // this.broadcastMarket(marketID)
                    // connection.sendUTF(marketID)
                    // await this.updateClientInfo(marketID,connection)
                }
                else if (message.type === 'binary') {
                    consola.info('Received Binary Message of ' + message.binaryData.length + ' bytes');
                    connection.sendBytes(message.binaryData);
                }
            });
            connection.on('close',  (reasonCode, description)=> {
                consola.info((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
                consola.info(reasonCode, description)
            });
        });
    }
}

export default new WSMananger()