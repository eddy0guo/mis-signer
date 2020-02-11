import * as http from 'http';
import * as express from 'express';
import * as cors from 'cors';
import * as morgan from 'morgan';
import * as bodyParser from 'body-parser';

import wallet from './wallet';
import adex from './adex';
//import * as config from './config.json';
import express_exchange from './express';
import mist_config from './cfg';

const config = {
	"bodyLimit": "100kb",
	"corsHeaders": ["Link"]
};

const responseTime = () => {
  return (req, res, next) => {
    req._startTime = new Date().getTime(); // 获取时间 t1

    const calResponseTime = () => {
      const now = new Date().getTime();
      const deltaTime = now - req._startTime;
      console.log(`[REQ TIME]:${deltaTime}`);
    };

    res.once('finish', calResponseTime);
    res.once('close', calResponseTime);
    return next();
  };
};

const app = express();

app.server = http.createServer(app);

// logger
app.use(morgan('dev'));

// 3rd party middleware
app.use(
  cors({
    exposedHeaders: config.corsHeaders,
  })
);

app.use(
  bodyParser.json({
    limit: config.bodyLimit,
  })
);

app.all('*', (req, res, next) => {
  // 设置允许跨域的域名，*代表允许任意域名跨域
  res.header('Access-Control-Allow-Origin', '*');
  // 允许的header类型
  res.header('Access-Control-Allow-Headers', 'content-type');
  // 跨域允许的请求方式
  res.header('Access-Control-Allow-Methods', 'DELETE,PUT,POST,GET,OPTIONS');
  if (req.method.toLowerCase() === 'options') res.send(200);
  // 让options尝试请求快速结束
  else next();
});

// internal middleware
app.use(responseTime());

// api router
app.use('/wallet', wallet());
app.use('/adex', adex());
app.use('/express', express_exchange());

app.server.listen(process.env.PORT || mist_config.mist_server_port, () => {
  console.log(`Started on port ${app.server.address().port}`);
});

export default app;