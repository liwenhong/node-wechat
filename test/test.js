// //引入xml2js模块
// const xml2js = require('xml2js') 

// //xml->json
//  let xmlParse = new xml2js.Parser({explicitArray:false,ignoreAttrs:true})

//  //json->xml
//  let xmlBuilder = new xml2js.Builder();

//  let xml = "<root><name>liwenhong</name><age>26</age></root>";
//  let obj = {name:'liwh',age:'23'};

//  xmlParse.parseString(xml,(err,result)=>{
//      console.log(result);
//      console.log(JSON.stringify(result));
//  })
//  let xmlO = xmlBuilder.buildObject(obj);
//  console.log(xmlO);


const express = require('express') //引入express框架

//实例化express
var app = new express();

//设置跨域访问
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://192.168.1.200:8080");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Credentials", 'true');
    res.header("X-Powered-By",' 3.2.1');
    res.header("Content-Type", "application/x-www-form-urlencoded");
    next();
 });

app.get('/test', function (req, res) {
    res.send({id:req.params.id})
})

app.listen(8091);