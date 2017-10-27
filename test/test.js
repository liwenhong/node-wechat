//引入xml2js模块
const xml2js = require('xml2js') 

//xml->json
 let xmlParse = new xml2js.Parser({explicitArray:false,ignoreAttrs:true})

 //json->xml
 let xmlBuilder = new xml2js.Builder();

 let xml = "<root><name>liwenhong</name><age>26</age></root>";
 let obj = {name:'liwh',age:'23'};

 xmlParse.parseString(xml,(err,result)=>{
     console.log(result);
     console.log(JSON.stringify(result));
 })
 let xmlO = xmlBuilder.buildObject(obj);
 console.log(xmlO);


