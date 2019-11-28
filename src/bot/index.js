import http from 'http';
import express from 'express';
import morgan from 'morgan';
// start price oracle
// start bot
import Price from './Price'
import CloudBot from './CloudBot'

console.log = ()=>{}

let markets = {
	"ASIM-PI":15,
	"USDT-PI":7,
	"MT-PI":50,
	"BTC-PI":63861,
	"ETH-PI":1290,

	"ASIM-USDT":2,
	"ETH-USDT":185,
	"BTC-USDT":9163,

	"BTC-MT":63861/50,
	"ETH-MT":1290/50,
}

let amounts = {
	"ASIM-PI":0,
	"USDT-PI":0,
	"MT-PI":0,
	"BTC-PI":0,
	"ETH-PI":0,

	"ASIM-USDT":0,
	"ETH-USDT":0,
	"BTC-USDT":0,

	"BTC-MT":0,
	"ETH-MT":0,
}

let priceOracle = new Price(markets)
priceOracle.start()

for(let i in markets ){
	let amount = amounts[i]
	// console.log(i,markets[i],amount)
	let bot = new CloudBot(i,priceOracle,amount)
	bot.start(5000+i*1000)
}

// start cli server

let app = express();

app.server = http.createServer(app);

// logger
app.use(morgan('dev'));

app.all("*",function(req,res,next){
    //设置允许跨域的域名，*代表允许任意域名跨域
    res.header("Access-Control-Allow-Origin","*");
    //允许的header类型
    res.header("Access-Control-Allow-Headers","content-type");
    //跨域允许的请求方式
    res.header("Access-Control-Allow-Methods","DELETE,PUT,POST,GET,OPTIONS");
    if (req.method.toLowerCase() == 'options')
        res.send(200);  //让options尝试请求快速结束
    else
        next();
});

// 
import cli from './cli'
app.use('/cli',cli())

// not start cli for now

// app.server.listen(8686, () => {
// 	console.log(`Started on port ${app.server.address().port}`);
// });

export default app;
