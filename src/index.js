import http from 'http';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import wallet from './wallet';
import adex  from './adex';
import config from './config.json';
import express1 from './express'
import mist_config from './cfg'

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

app.use(responseTime())


// internal middleware

// api router
app.use('/wallet', wallet({ config}));
app.use('/adex',adex({ config}));
app.use('/express',express1({config}))

app.server.listen(process.env.PORT || mist_config.mist_server_port, () => {
	console.log(`Started on port ${app.server.address().port}`);
});


//console.log = ()=>{}
//consola.info('test consola')


export default app;

