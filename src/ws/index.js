import to from 'await-to-js'
import Order from '../adex/api/order'
import Market from '../adex/api/market'
import Trades from '../adex/api/trades'

class WSMananger {
    constructor() {
        this.clients = {}
        this.init()
        this.order = new Order()
        this.market = new Market()
        this.trades = new Trades()
    }

    async listOrderBook(marketID) {
       let [err,result] = await to(this.order.order_book(marketID));
       if(err) console.log('listOrderBook',err)
       return result
	}

	async listMarkets () {
       let [err,result] = await to(this.market.list_markets());
       if(err) console.log('listMarkets',err)
       return result
	}

	async listTrades(marketID) {
       let [err,result] = await to(this.trades.list_trades(marketID));
       if(err) console.log('listTrades',err)
       return result
    }
    
    async updateClientInfo(marketID,connection) {
        console.log('updateClientInfo',connection.remoteAddress,marketID)
        let trades = await this.listTrades(marketID)
        console.log(trades)
    }

    init() {
        var WebSocketServer = require('websocket').server;
        var http = require('http');

        var server = http.createServer(function (request, response) {
            console.log((new Date()) + ' Received request for ' + request.url);
            response.writeHead(404);
            response.end();
        });
        server.listen(9696, function () {
            console.log((new Date()) + 'WebSocket Server is listening on port 9696');
        });

        let wsServer = new WebSocketServer({
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

        wsServer.on('request',  (request) => {
            if (!originIsAllowed(request.origin)) {
                // Make sure we only accept requests from an allowed origin
                request.reject();
                console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
                return;
            }

            var connection = request.accept('echo-protocol', request.origin);
            console.log((new Date()) + ' Connection accepted.',request.origin)

            connection.on('message', async (message) => {
                if (message.type === 'utf8') {
                    console.log('Received Message: ' + message.utf8Data);
                    connection.sendUTF(message.utf8Data);
                    await this.updateClientInfo(message.utf8Data,connection)
                }
                else if (message.type === 'binary') {
                    console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
                    connection.sendBytes(message.binaryData);
                }
            });
            connection.on('close',  (reasonCode, description)=> {
                console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
                console.log(reasonCode, description)
            });
        });
    }
}

export default new WSMananger()