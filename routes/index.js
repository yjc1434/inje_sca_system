var fs = require('fs');
var express = require('express');
var ejs = require("ejs");
var router = express.Router();
var getConnection = require('../config/mysql');
var AdminRouter = require('./admin');
var VoteRouter = require('./vote');

router.use('/admin',AdminRouter);
router.use('/vote',VoteRouter);

router.get('/', function (request, response) {
    if (request.session.isLogin == 1) {
        response.redirect('/vote');
    }
    else if (request.session.isLogin == 2) {
        response.redirect('/admin');
    }
    else {
        var htmlPage = fs.readFileSync('html/welcome.html', 'utf8');
        response.send(htmlPage);
    }
});

router.get('/logout', function (request, response) { //로그아웃
    if (request.session.isLogin != null) {
        delete request.session.isLogin;
        delete request.session.auth;
        request.session.save(function () {
            var htmlPage = fs.readFileSync('html/welcome.html', 'utf8');
            response.send(ejs.render(htmlPage, { status: 'logout' }));
        });
    }
});

module.exports = router;