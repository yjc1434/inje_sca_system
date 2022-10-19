const mysql = require('mysql');

const option = {
    host : process.env.DB_HOST,
    port : process.env.DB_PORT,
    user : process.env.DB_USER,    
    password : process.env.DB_PASSWORD,
    database : process.env.DB_DATABASE,
    connectionLimit     : 20,  
    acquireTimeout      : 1000 * 10
};

var pool = mysql.createPool(option);

function getConnection(callback) {
    try {
        pool.getConnection(function(err,conn) {
            if (!err) callback(conn);
            else console.log(err);
        });
    }
    catch (err) {
        console.log(err);
    }
};

module.exports = getConnection;