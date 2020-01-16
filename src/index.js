import http from 'http';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import initializeDb from './db';
import middleware from './middleware';
import wallet from './wallet';
import adex  from './adex';
import config from './config.json';
import did from './did'
import express1 from './express'
import mist_config from './cfg'
const log4js = require('log4js');

var responseTime = function () {
    return function (req, res, next) {
            req._startTime = new Date() // 获取时间 t1

        var calResponseTime = function () {
        var now = new Date(); 2
        var deltaTime = now - req._startTime;
                console.log(`--deltaTime-----${deltaTime}--------`);
        }

        res.once('finish', calResponseTime);
        res.once('close', calResponseTime);
        return next();
   }

}

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


log4js.configure({
 appenders: {
 // everything: { type: 'file', filename: 'mist_ex.log' }
 	stdout: {//控制台输出
            type: 'console'
        },
		req: {  //请求转发日志
            type: 'dateFile',    //指定日志文件按时间打印
            filename: 'logs/reqlog/req',  //指定输出文件路径
            pattern: 'yyyy-MM-dd.log',
            alwaysIncludePattern: true
        },
	err: {  //错误日志
            type: 'dateFile',
            filename: 'logs/errlog/err',
            pattern: 'yyyy-MM-dd.log',
            alwaysIncludePattern: true
        },
        oth: {  //其他日志
            type: 'dateFile',
            filename: 'logs/othlog/oth',
            pattern: 'yyyy-MM-dd.log',
            alwaysIncludePattern: true
        }

 },
 categories: {
  default: { appenders:['stdout', 'req'], level: 'info' },
    err: { appenders: ['stdout', 'err'], level: 'error' }
 }
});
let info_log = function (info) {
    return log4js.getLogger().info(info);
};

let err_log = function (info) {//name取categories项
    return log4js.getLogger('err').error(info);
};

const logger = {
		error:err_log,
		info:info_log
	}
logger.error('I will be error logged in mist_ex.log');
logger.info('I will be info logged in mist_ex.log');
app.use(responseTime())


// connect to db
initializeDb( db => {

	// internal middleware
	app.use(middleware({ config, db }));

	// api router
	app.use('/wallet', wallet({ config, db }));
	app.use('/adex',adex({ config, db,logger}));
	app.use('/express',express1({config,db,}))

	app.server.listen(process.env.PORT || mist_config.mist_server_port, () => {
		console.log(`Started on port ${app.server.address().port}`);
	});
});


//console.log = ()=>{}
//consola.info('test consola')


export default app;

