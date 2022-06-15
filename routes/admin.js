var fs = require('fs');
var express = require('express');
var ejs = require("ejs");
var excel = require("../config/excel_fs");
var getConnection = require('../config/mysql');
var router = express.Router();
var students = [];

function getFormatDate(date){
    var year = date.getFullYear();
    var month = (1 + date.getMonth());
    month = month > 10 ? month : '0' + month; // 10이 넘지 않으면 앞에 0을 붙인다
    var day = date.getDate();
    day = day > 10 ? day : '0' + day; // 10이 넘지 않으면 앞에 0을 붙인다
    var hours = date.getHours();
    hours = hours > 10 ? hours : '0' + hours; // 10이 넘지 않으면 앞에 0을 붙인다
    var minutes = date.getMinutes();
    minutes =  minutes > 10 ? minutes : '0' + minutes; // 10이 넘지 않으면 앞에 0을 붙인다
    var seconds = date.getSeconds();
    seconds = seconds > 10 ? seconds : '0' + seconds; // 10이 넘지 않으면 앞에 0을 붙인다
 
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} `
}

router.get('/', function (request, response) { //관리자 로그인
    if (request.session.isLogin == 2) {
        response.redirect('/admin/menu');
    }
    else {
        var htmlPage = fs.readFileSync('html/admin/login.html', 'utf8');
        response.send(htmlPage);
    }
});

router.get('/menu', function (request, response) { //관리자 메뉴
    if (request.session.isLogin == 2) {
        var htmlPage = fs.readFileSync('html/admin/menu.html', 'utf8');
        response.send(htmlPage);
    }
    else {
        response.redirect('/');
    }
});

router.get('/vote', function (request, response) { //투표 관리
    if (request.session.isLogin == 2) {
        getConnection(function (conn) {
            var queryString = `SELECT * FROM vote`;
            params = [];
            conn.query(queryString, params, function (err, result) {
                conn.release();
                var data = result;
                if (!err) {
                    var d1 = [], d2 = [], d3 = [];
                    for (var i = 0; i < data.length; i++) {
                        if (data[i].vote_status == 0) { //진행 전
                            d1.push(data[i]);
                        }
                        else if (data[i].vote_status == 1) { //진행 중
                            d2.push(data[i]);
                        }
                        else if (data[i].vote_status == 2) { //완료
                            d3.push(data[i]);
                        }
                    }
                    var htmlPage = fs.readFileSync('html/admin/vote.html', 'utf8');
                    response.send(ejs.render(htmlPage, { votedata_0: d1, votedata_1: d2, votedata_2: d3 }));
                }
            });
        });
    }
    else {
        response.redirect('/');
    }
});

router.get('/vote/add', function (request, response) { //투표 관리
    if (request.session.isLogin == 2) {
        var htmlPage = fs.readFileSync('html/admin/vote_add.html', 'utf8');
        response.send(htmlPage);
    }
    else {
        response.redirect('/');
    }
});

router.post('/vote/add/commit', function (request, response) { //투표 추가 완료
    console.log('commit');
    if (request.session.isLogin == 2) {
        var queryString = `select * from vote`;
        var name = request.body.vote_name;
        var subject = request.body.vote_subject
        getConnection(function (conn) {
            conn.query(queryString, params, function (err, result) {
                var id = result.length;
                if (!err) {
                    queryString = `insert into vote values (?,?,?,?,?,?,?,?,?)`; //id,name,subject,start,end,status,agree,disagre,none
                    var start = getFormatDate(new Date());
                    var end = getFormatDate(new Date('2022','06','13','18','00','00','00'));
                    params = [id, name, subject, start, end, 0, 0, 0, 0 ];
                    conn.query(queryString, params, function (err, result) {
                        conn.release();
                        if (!err) {
                            response.redirect('/admin/vote');
                        }
                        else console.log(err);
                    });
                }
                else console.log('select err');
                
            });
        });
    }
    else {
        response.redirect('/');
    }
});

router.get('/vote/result', function (request,response) {
    if (request.session.isLogin == 2) {

    } else {
        
    }
});


router.get('/list', function (request, response) { //관리자 북마크 보기
    if (request.session.isLogin == 2) {
        if (students.length > 0) {
            var htmlPage = fs.readFileSync('html/admin/list.html', 'utf8');
            response.send(ejs.render(htmlPage, { data: students }));
        }
        else {
            var htmlPage = fs.readFileSync('html/admin/menu.html', 'utf8');
            response.send(ejs.render(htmlPage, { status: 'nolist' }));
        }
    }
    else {
        response.redirect('/');
    }
});


router.get('/find', function (request, response) { //관리자 학생 검색
    if (request.session.isLogin == 2) {
        var htmlPage = fs.readFileSync('html/admin/find.html', 'utf8');
        response.send(htmlPage);
    }
    else {
        response.redirect('/');
    }
});

router.get('/result', function (request, response) { //관리자 학생 검색 결과
    if (request.session.isLogin == 2) {
        var htmlPage = fs.readFileSync('html/admin/result.html', 'utf8');
        var _snum = request.query._snum;
        var returnData = excel.filter(function (obj) {
            if (obj['학번'] == _snum) {
                return obj
            }
        });
        if (returnData.length == 0) {
            htmlPage = fs.readFileSync('html/admin/find.html', 'utf8');
            response.send(ejs.render(htmlPage, { status: 'fail' }));
        }
        else {
            response.send(ejs.render(htmlPage, { data: returnData[0] }));
        }
    }
    else {
        response.redirect('/');
    }
});

router.get('/result/add', function (request, response) { //관리자 학생 북마크 추가
    if (request.session.isLogin == 2) {
        var isSame = false;
        var htmlPage = fs.readFileSync('html/admin/find.html', 'utf8');
        data = request.query._data;
        parsing = data.split(',');
        for (var i = 0; i < students.length; i++) {
            if (students[i][4] == parsing[4]) {
                isSame = true;
                break;
            }
        }
        if (!isSame) {
            students.push(parsing);
            response.send(ejs.render(htmlPage, { status: 'add' }))
        }
        else {
            response.send(ejs.render(htmlPage, { status: 'same' }))
        }
    }
    else {
        response.redirect('/');
    }
});

router.post('/login', function (request, response) { //관리자 로그인
    if (request.session.isLogin == null) { //로그인 세션이 존재하지 않을 경우
        var pw = request.body._password;

        getConnection(function (conn) {
            var queryString = `SELECT * FROM users WHERE id = ?`;
            params = ['admin'];
            conn.query(queryString, params, function (err, result) {
                conn.release();
                if (!err) {
                    if (pw == result[0].password) {
                        request.session.isLogin = 2; //null: 비로그인 1: 일반로그인 2: 관리자 로그인
                        request.session.save(function () {
                            response.redirect('/admin/menu');
                        });
                    }
                    else {
                        var htmlPage = fs.readFileSync('html/admin/login.html', 'utf8');
                        response.send(ejs.render(htmlPage, { status: 'fail' }));
                    }
                }
            });
        });
    }
    else {
        response.redirect('/');
    }
});

module.exports = router;