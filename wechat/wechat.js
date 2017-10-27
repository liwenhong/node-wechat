// 此文件用来封装开发微信公众平台的所有方法
'use strict' //设置为严格模式

const crypto = require('crypto'),
    https = require('https'),
    util = require('util'),
    fs = require('fs'),
    accessTokenJson = require('./access_token'),
    urltil = require('url'),
    menus = require('./menus'),
    xml2js = require('xml2js').parseString,
    msg = require('./msg')
// 引入 fs 模块用于操作文件、util 工具模块用于处理占位符

//构建 WeChat 对象 即 js中 函数就是对象
var WeChat = function (config) {
    //设置 WeChat 对象属性 config
    this.config = config;
    //设置 WeChat 对象属性 token
    this.token = config.token;
    //设置 WeChat 对象属性 appID
    this.appID = config.appID;
    //设置 WeChat 对象属性 appScret
    this.appSecret = config.appSecret;
    // //设置 WeChat 对象属性 apiDomain
    this.apiDomain = config.apiDomain;
    //设置 WeChat 对象属性 apiURL
    this.apiUrl = config.apiURL;

    //get请求
    this.requestGet = function (url) {
        // console.log(url);
        return new Promise(function (resolve, reject) {
            https.get(url, (res) => {
                // console.log(res);
                var buffer = [], result = "";
                //监听data事件
                res.on('data', (d) => {
                    buffer.push(d);
                });
                //监听数据传输完成事件
                res.on('end', function () {
                    result = Buffer.concat(buffer, buffer.length).toString('utf-8');
                    //将最后结果返回
                    resolve(buffer);
                });
            }).on('error', function (err) {
                console.log(err)
                reject(err);
            })
        })
    }

    // post请求
    this.requestPost = function (url, menuData) {
        return new Promise(function (resolve, reject) {
            //解析url地址
            var urlData = urltil.parse(url);
            //设置https.request options传入的参数对象
            var options = {
                //目标主机地址
                hostname: urlData.hostname,
                //目标地址
                path: urlData.path,
                //请求方法
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(menuData, 'utf-8')
                }
            };
            var req = https.request(options, (res) => {
                var buffer = [], result = '';
                //用于监听data事件，接收数据
                res.on('data', (data) => {
                    buffer.push(data);
                });
                //用于监听end事件，完成数据的接收
                res.on('end', () => {
                    result = Buffer.concat(buffer).toString('utf-8');
                    resolve(result);
                })
            })
                .on('error', (err) => {
                    console.log(err);
                    reject(err);
                });
            //传入数据
            req.write(menuData);
            req.end();
        })
    }

}
/**
 * 微信接入验证
 */
WeChat.prototype.auth = function (req, res) {
    //1.获取微信服务器Get请求的参数 signature、timestamp、nonce、echostr
    var signature = req.query.signature,
        timestamp = req.query.timestamp,
        nonce = req.query.nonce,
        echostr = req.query.echostr;
    //2.将token、timestamp、nonce三个参数进行字典序排序
    var array = [this.token, timestamp, nonce];
    array.sort();
    //3.将三个参数字符串拼接成一个字符串进行sha1加密
    var tempStr = array.join('');
    const hashCode = crypto.createHash('sha1'); //创建加密类型 
    var resultCode = hashCode.update(tempStr, 'utf8').digest('hex'); //对传入的字符串进行加密
    //4.开发者获得加密后的字符串可与signature对比，标识该请求来源于微信
    if (resultCode === signature) {
        res.send(echostr);
    } else {
        res.send('mismatch');
    }
};

/**
 * 获取微信 access_token
 */
WeChat.prototype.getAccessToken = function () {
    var that = this;
    return new Promise(function (resolve, reject) {
        //获取当前时间
        var currentTime = new Date().getTime();
        //格式化请求地址
        var url = util.format(that.apiUrl.getAccessToken, that.apiDomain, that.appID, that.appSecret);
        //判断本地存储的access_token是否有效
        if (accessTokenJson.access_token === "" || accessTokenJson.expires_time < currentTime) {
            that.requestGet(url).then(function (data) {
                var result = JSON.parse(data);
                if (data.indexOf("errcode") < 0) {
                    accessTokenJson.access_token = result.access_token;
                    accessTokenJson.expires_time = new Date().getTime() + (parseInt(result.expires_in) - 200) * 1000;
                    //更新本地存储
                    fs.writeFile('./wechat/access_token.json', JSON.stringify(accessTokenJson));
                    //将获取后的access_token 返回
                    resolve(accessTokenJson.access_token);
                } else {
                    //将错误返回
                    reject(result);
                }
            })
        } else {
            //将本地存储的access_token返回
            resolve(accessTokenJson.access_token);
        }

    })
};
/**
 * 创建菜单
 */
WeChat.prototype.creatMeanus = function (res, req) {
    let that = this;
    return new Promise(function (resolve, reject) {
        that.getAccessToken().then((data => {
            console.log(data);
            let url = util.format(that.apiUrl.createMenu, that.apiDomain, data);
            that.requestPost(url, JSON.stringify(menus)).then((da) => {
                let result = JSON.parse(da);
                console.log(result);
                if (da.errcode === 0) {
                    resolve(result);
                } else {
                    reject(result);
                }
            })
        }))
    })

}
/**
 * 监听微信消息
 */
WeChat.prototype.handleMsg = function (req, res) {
    var buffer = [];
    req.on('data', (data) => {
        buffer.push(data);
    })
    req.on('end', () => {
        var msgXml = Buffer.concat(buffer).toString('utf-8');
        console.log(msgXml);
        xml2js(msgXml, { explicitArray: false }, (err, result) => {
            if (!err) {
                result = result.xml;
                let toUser = result.ToUserName;
                let fromUser = result.FromUserName;
                if (result.MsgType.toLowerCase() === "event") {
                    //判断事件类型
                    switch (result.Event.toLowerCase()) {
                        case 'subscribe':
                            //回复消息
                            res.send(msg.txtMsg(fromUser, toUser, '感谢关注拔兔子的萝卜公众号！'));
                            break;
                        case 'click':
                            let contentArr = [
                                { Title: "Node.js 微信自定义菜单", Description: "使用Node.js实现自定义微信菜单", PicUrl: "http://img.blog.csdn.net/20170605162832842?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvaHZrQ29kZXI=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast", Url: "http://blog.csdn.net/hvkcoder/article/details/72868520" },
                                { Title: "Node.js access_token的获取、存储及更新", Description: "Node.js access_token的获取、存储及更新", PicUrl: "http://img.blog.csdn.net/20170528151333883?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvaHZrQ29kZXI=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast", Url: "http://blog.csdn.net/hvkcoder/article/details/72783631" },
                                { Title: "Node.js 接入微信公众平台开发", Description: "Node.js 接入微信公众平台开发", PicUrl: "http://img.blog.csdn.net/20170605162832842?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvaHZrQ29kZXI=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast", Url: "http://blog.csdn.net/hvkcoder/article/details/72765279" }
                            ];
                            res.send(msg.graphicMsg(fromUser, toUser, contentArr));
                            break;
                    }
                } else if (result.MsgType.toLowerCase() === 'text') {
                    switch (result.Content) {
                        case '1':
                            res.send(msg.txtMsg(fromUser, toUser, 'hello,my name is .....!;'))
                            break;
                        default:
                            res.send(msg.txtMsg(fromUser, toUser, '暂无此选项'))
                            break;
                    }
                }


            } else {
                console.log(err);
            }
        })
    })
}

module.exports = WeChat;