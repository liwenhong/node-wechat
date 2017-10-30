const express = require('express'), //引入express框架
    crypto = require('crypto'), //引入加密模块
    config = require('./config'),//引入配置文件
    wechat = require('./wechat/wechat'),
    bodyParser = require('body-parser'),
    dbSql = require('./db/dbConfig');

//实例化express
var app = new express();
var wechatApp = new wechat(config); //实例wechat对象
var db = new dbSql();//实例数据库对象
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
//设置跨域访问
app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://192.168.1.200:8080");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Credentials", 'true');
    res.header("X-Powered-By", ' 3.2.1');
    res.header("Content-Type", "application/json");
    next();
});
app.get('/', function (req, res) {
    wechatApp.auth(req, res);
})
app.get('/test', function (req, res) {
    console.log(req.query.sqlString)
    let sqlStr = req.query.sqlString;
    db.query(sqlStr).then((data)=>{
        console.log(data);
        res.send(data);
    }).catch((err)=>{
        res.send(err);
    })
    
})
app.get('/getAccessToken', function (req, res) {
    wechatApp.getAccessToken().then(function (data) {
        res.send(data);
    })
})
app.get('/createMenus', function (req, res) {
    wechatApp.creatMeanus().then(function (data) {
        res.send(data);
    }).catch(function (err) {
        console.log(err);
    });
})
//用于处理所有进入 8090 端口 post 的连接请求
app.post('/', function (req, res) {
    wechatApp.handleMsg(req, res);
});

app.post('/testP', function (req, res) {
    console.log(req.body);
    res.send('hello this is post methods!;')
})
app.listen(8090);