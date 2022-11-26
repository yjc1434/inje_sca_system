var http = require('http'); //http 접속 시 redirect 용
var https = require('https');
var express = require('express');
var app = express();
var app_http = express(); //http 접속 시 redirect 용
var ejs = require("ejs");
var fs = require("fs");
var favicon = require('serve-favicon');

var path = require('path');
require('dotenv').config();
var bodyParser = require('body-parser');

require('./config/excel_fs');
require('./config/session')(app);

var indexRouter = require('./routes/index');

var keys_dir = `C:/Keys/`;
var domain = 'vote.inje-club.com';
var key = fs.readFileSync(keys_dir + domain + "-key.pem");
var cert = fs.readFileSync(keys_dir + domain + "-crt.pem");

var option = { cert : cert, key : key}

var server_http = http.createServer(app_http); //http 접속 시 redirect 용
var server = https.createServer(option, app);

app.use('/static', express.static(path.join(__dirname, '/public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(favicon(path.join(__dirname, '/public',  'favicon.ico')));

app.all('*', (req,res,next) => {
    if (req.url.startsWith('/admin') || req.url.startsWith('/logout')) {
        next();
    }
    else if (new Date('2022-11-24T10:00:00') <= new Date() && new Date('2022-11-24T18:30:00') >= new Date()) {
        next();
    }
    else {
        var htmlPage = fs.readFileSync('html/index.html', 'utf8');
        res.send(htmlPage);
    }
});

app.use('/',indexRouter);

 //http 접속 시 redirect 용
app_http.all('*', (req, res, next) => {
    let protocol = req.headers['x-forwarded-proto'] || req.protocol;
    if (protocol == 'https') {
        next();
    }
    else {
        let to = `https://vote.inje-club.com${req.url}`;
        res.redirect(to);
    }
});

server_http.listen(80, null);

server.listen(443,function () {
    var dir = './temp/upload';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir); // 2
    //console.log('Server Running at https://127.0.0.1:443');
    console.log('Server Running at https://vote.inje-club.com')
});