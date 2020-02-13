import * as http from 'http';
import express from 'express';
import morgan from 'morgan';
// start price oracle
// start bot
import Price from './Price'
import CloudBot from './CloudBot'

const markets = {
	'ASIM-CNYC':15,
	'USDT-CNYC':7,
	'MT-CNYC':50,
	'BTC-CNYC':63861,
	'ETH-CNYC':1290,

	'ASIM-USDT':2,
	'ETH-USDT':185,
	'BTC-USDT':9163,

	'BTC-MT':63861/50,
	'ETH-MT':1290/50,
}

const amounts = {
	'ASIM-CNYC':0,
	'USDT-CNYC':0,
	'MT-CNYC':0,
	'BTC-CNYC':0,
	'ETH-CNYC':0,

	'ASIM-USDT':0,
	'ETH-USDT':0,
	'BTC-USDT':0,

	'BTC-MT':0,
	'ETH-MT':0,
}

const priceOracle = new Price(markets)
priceOracle.start()

for(const i in markets ){
	if( amounts[i] ){
		const amount = amounts[i]
		const bot = new CloudBot(i,priceOracle,amount)
		bot.start(5+Number(i)*1)
	}
}

// start cli server

const app = express();

app.server = http.createServer(app);

// logger
app.use(morgan('dev'));

app.all('*',(req,res,next)=>{
    // 设置允许跨域的域名，*代表允许任意域名跨域
    res.header('Access-Control-Allow-Origin','*');
    // 允许的header类型
    res.header('Access-Control-Allow-Headers','content-type');
    // 跨域允许的请求方式
    res.header('Access-Control-Allow-Methods','DELETE,PUT,POST,GET,OPTIONS');
    if (req.method.toLowerCase() === 'options')
        res.send(200);  // 让options尝试请求快速结束
    else
        next();
});

export default app;
