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
    if (request.session.isLogin == null) {
        var htmlPage = fs.readFileSync('html/login.html', 'utf8');
        response.send(htmlPage);
    }
    else if (request.session.isLogin == 1) {
        if (request.session.checkinfo == true) { //본인확인까지 완료
            console.log('vote');
            response.redirect('/vote');
        }
        else { //본인확인 안함
            console.log('checkinfo');
            response.redirect('/checkinfo');
        }
    }
    else if (request.session.isLogin == 2) {
        console.log('admin');
        response.redirect('/admin');
    }
});

router.post('/selectbox', function (request, response) { //select option 갱신을 위한 ajax 통신
    getConnection(function (conn) {
        var queryString = 'select distinct name from users where gname = ?';
        params = [request.body.group];
        conn.query(queryString, params, function (err, results) {
            conn.release();
            if (!err) {
                response.send(JSON.stringify(results));
            }
            else {
                console.log(err);
            }
        });
    });
});

router.post('/auth', function (request, response) { //인증코드
    if (request.session.isLogin == null) { //로그인 세션이 존재하지 않을 경우
        var name = request.body.name;
        var pw = request.body.password;
        getConnection(function (conn) {
            var queryString = 'select gname, name, password from users where name = ?';
            params = [name, '1'];
            conn.query(queryString, params, function (err, results) {
                conn.release();
                if (!err) {
                    if (results.length != 0) {
                        if (pw == results[0].password) { //어떻게 데이터를 넘겨야할까?
                            request.session.isLogin = 1; //null: 비로그인 1: 일반로그인 2: 관리자 로그인
                            request.session.group = results[0].gname;
                            request.session.name = results[0].name;
                            request.session.password = results[0].password;
                            request.session.save(function () {
                                    response.send('true');
                            });
                        } else { //로그인 실패
                            // var htmlPage = fs.readFileSync('html/login.html', 'utf8');
                            // response.send(ejs.render(htmlPage, {status: 'fail'}));
                            response.send('false');
                        }
                    }
                    else {
                        // var htmlPage = fs.readFileSync('html/login.html', 'utf8');
                        // response.send(ejs.render(htmlPage, {status: 'fail'}));
                        response.send('false');
                    }
                } else 
                    console.log(err);
                }
            );
        });
    } else if (request.session.isLogin == 1) {
        response.redirect('vote/list');
    }
});

router.get('/checkinfo', function (request, response) { //정보확인
    if (request.session.isLogin != null) {
        var htmlPage = fs.readFileSync('html/checkinfo.html','utf8');
        response.send(ejs.render(htmlPage,{ group : request.session.group, name : request.session.name }));
    }
    else {
        response.redirect('/');
    }
});

router.get('/checkinfo/:answer', function (request, response) { //정보확인
    if (request.session.isLogin != null) {
        if (request.params.answer == 'TRUE') {
            request.session.checkinfo = true; //정보확인을 완료한 계정이라는 세션 정보
            request.session.save(function () {
                    response.redirect('/vote'); //투표 목록으로 이동
            });
        }
        else { //아니오를 눌렀을 경우 다 지움
            request.session.destroy(function () {
                response.redirect('/');
            });
        }
    }
    else {
        response.redirect('/');
    }
});

router.get('/logout', function (request, response) { //로그아웃
    if (request.session.isLogin != null) {
        request.session.destroy(function () {
            response.redirect('/');
        });
    }
});

module.exports = router;