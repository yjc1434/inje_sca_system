var express = require('express');
var session = require('express-session');

const sessinOption = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: null
}

module.exports = function(app) {
    app.use(session(sessinOption))
};