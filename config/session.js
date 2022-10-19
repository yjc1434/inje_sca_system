var express = require('express');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);

var options = {
    host : process.env.DB_HOST,
    port : process.env.DB_PORT,
    user : process.env.DB_USER,    
    password : process.env.DB_PASSWORD,
    database : process.env.DB_DATABASE,
    connectionLimit     : 20,  
    acquireTimeout      : 1000 * 10
};

var sessionStore = new MySQLStore(options);

const sessinOption = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: sessionStore
}

module.exports = function(app) {
    app.use(session(sessinOption))
};