
var http = require('http');
var express = require('express');
var app = express();
var ejs = require("ejs");
var fs = require("fs");

var path = require('path');
require('dotenv').config();
var bodyParser = require('body-parser');
require('./config/excel_fs');
require('./config/session')(app);

var indexRouter = require('./routes/index');

var server = http.createServer(app);

app.use('/static', express.static(path.join(__dirname, '/public')));
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/',indexRouter);


server.listen(3000, function () {
    var dir = './temp/upload';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir); // 2
    console.log('Server Running at http://127.0.0.1:3000');
});
