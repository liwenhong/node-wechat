const express = require('express'), //引入express框架
    crypto = require('crypto'), //引入加密模块
    config = require('./config');//引入配置文件
    wechat = require('./wechat/wechat')

//实例化express
var app = new express();
var wechatApp = new wechat(config); //实例wechat对象

app.get('/', function (req, res) {
    wechatApp.auth(req,res);
})
app.get('/getAccessToken',function(req,res){
    wechatApp.getAccessToken().then(function(data){
        res.send(data);
    })
})
app.get('/createMenus',function(req,res){
    wechatApp.creatMeanus().then(function(data){
        res.send(data);
    }).catch(function(err) {
        console.log(err);
    });
})
//用于处理所有进入 8090 端口 post 的连接请求
app.post('/',function(req,res){
  wechatApp.handleMsg(req,res);
});
app.listen(8090);