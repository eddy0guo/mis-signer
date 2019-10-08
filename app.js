let express = require('express');
let mongoose = require('mongoose');
let passport = require('passport');
// yarn add body-parser
let bodyParser = require('body-parser');
let cookieParser = require('cookie-parser');
let morgan = require('morgan');
let compression = require('compression')
let fs = require("fs");

let config = require('./config/database');

// 保存一个全局的db对象
// 使用es6风格promise
mongoose.Promise = require('bluebird');
global.db = mongoose.createConnection(config.database);

// app 是 express的一个实例
let app = express();

//设置跨域访问
app.all('*', function(req, res, next) {
  // 注意这里一定要允许 Authorization 类型的Headers，否则会出错。
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
  res.header("X-Powered-By",' 3.2.1');
  res.header("Content-Type", "application/json;charset=utf-8");
  next();
});

// 开启gzip压缩
app.use(compression());
app.use(morgan('dev'));
// for parsing application/json
// for parsing application/x-www-form-urlencoded
// 解决413，Post请求体太大的问题。
app.use(bodyParser.json({limit: '10mb'})); // for parsing application/json
app.use(bodyParser.urlencoded({limit: '10mb', extended: true })); // for parsing application/x-www-form-urlencoded
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(passport.initialize());

// 我们开发的路由分发函数
// route api lists

app.use('/sign', require('./routes/sign'))
app.use('/did', require('./routes/did'))


// default response
app.get('/', function(req, res) {
  res.send('Mist Contract API');
})

// 实际启动express服务器
app.listen(8000, function() {
  console.log('listening on http://localhost:8000');
})