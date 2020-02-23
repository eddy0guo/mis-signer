// tslint:disable-next-line:no-var-requires
const server = require('http').createServer();
// tslint:disable-next-line:no-var-requires
const io = require('socket.io')(server);
import QueueWS from './queue';
const orderBook = 'OrderBookUpdate';
const recentTrade = 'LastTrades';
import mist_config from '../cfg'


io.on('connection', client => {
    console.log('%o ${client} connected',client);
});


io.on('disconnect', client => {
    console.log('%o ${client} disconnected',client);
});




const orderQueue = new QueueWS(io,orderBook);
const tradeQueue = new QueueWS(io,recentTrade);
orderQueue.initQueue();
tradeQueue.initQueue();

server.listen(mist_config.ws_port);
