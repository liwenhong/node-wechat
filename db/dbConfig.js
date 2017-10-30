var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    database: 'test',
    user: 'root',
    password: ''
});

var Db = function () { }

Db.prototype.query = function (sql, params) {
    // connection.connect();
    return new Promise(function (resolve, reject) {
        connection.query(sql, function (err, rows, fields) {
            if (err) {
                reject(err);
            };
            resolve(rows);
        });
        // connection.end();
    })
}

module.exports = Db;


