import http from 'http';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import consola from 'consola'
import initializeDb from './db';
import middleware from './middleware';
import api from './api';
import wallet from './wallet';
import adex  from './adex';
import config from './config.json';
import did from './did'
import mist_config from './cfg'

let app = express();

app.server = http.createServer(app);

// logger
app.use(morgan('dev'));

// 3rd party middleware
app.use(cors({
	exposedHeaders: config.corsHeaders
}));

app.use(bodyParser.json({
	limit : config.bodyLimit
}));

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
// connect to db
initializeDb( db => {

	// internal middleware
	app.use(middleware({ config, db }));

	// api router
	app.use('/api', api({ config, db }));
	app.use('/wallet', wallet({ config, db }));
	app.use('/adex',adex({ config, db }));
	app.use('/did',did({config,db}))
	app.use('/light',did({config,db}))

	app.server.listen(process.env.PORT || mist_config.mist_server_port, () => {
		console.log(`Started on port ${app.server.address().port}`);
	});
});


console.log = ()=>{}
consola.info('test consola')


export default app;
