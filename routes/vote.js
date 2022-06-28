var fs = require('fs');
var express = require('express');
var ejs = require("ejs");
var getConnection = require('../config/mysql');
const { Console } = require('console');
var router = express.Router();
var encrypt = require('../config/crypto').encrypt;
var decrypt = require('../config/crypto').decrypt;
var randomKeys = require('../config/crypto').randomKeys;


router.get('/', function (request, response) { //투표 로그인
    if (request.session.isLogin == 1) {
        response.redirect('/vote/list');
    }
    else {
        var htmlPage = fs.readFileSync('html/vote/login.html', 'utf8');
        response.send(htmlPage);
    }
});

router.post('/auth', function (request, response) { //인증코드
    if (request.session.isLogin == null) { //로그인 세션이 존재하지 않을 경우
        var pw = request.body._password;
        getConnection(function (conn) {
            var queryString = 'select code from users where code = ? and type = ?';
            params = [pw, '1'];
            conn.query(queryString, params, function (err, results) {
                conn.release();
                if (!err) {
                    if (results.length != 0) {
                        if (pw == results[0].code) { //어떻게 데이터를 넘겨야할까?
                            request.session.isLogin = 1; //null: 비로그인 1: 일반로그인 2: 관리자 로그인
                            request.session.auth = pw;
                            request.session.save(function () {
                                    response.redirect('/vote/list');
                            });
                        } else { //로그인 실패
                            var htmlPage = fs.readFileSync('html/vote/login.html', 'utf8');
                            response.send(ejs.render(htmlPage, {status: 'fail'}));
                        }
                    }
                    else {
                        var htmlPage = fs.readFileSync('html/vote/login.html', 'utf8');
                        response.send(ejs.render(htmlPage, {status: 'none'}));
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

router.get('/list',function (request, response) { //투표 목록
    var htmlPage = fs.readFileSync('html/vote/list.html','utf8');
    // getConnection(function (conn) {
    //     var queryString = 'select vote_id, vote_name, vote_subject from vote_list where vote_status = 1'; //투표 상태가 1인 투표의 ID,NAME,SUBJECT를 가져온다.
    //     conn.query(queryString, function (err,results) {
    //         if(!err) {
    //             data = results;
    //             queryString = 'select vote_id from vote_auth where vote_auth = ?;'; //해당 투표 코드로 투표한 목록을 가져온다.
    //             params = [ request.session.auth ];
    //             conn.query(queryString, params, function (err, results) {
    //                 var already = results;
    //                 queryString = 'select vote_id from users where code = ?;'; //해당 유저가 투표에 권한을 가지고 있는지 알아본다.
    //                 params = [ request.session.auth ];
    //                 conn.query(queryString, params, function (err, results) {
    //                     var confirmID = (results[0].vote_id).split(':');
    //                     conn.release();
    //                     if(!err) response.send(ejs.render(htmlPage,{ votedata : data, already : already, authcode :  request.session.auth, confirm : confirmID }));
    //                     //votedata = 투표 목록, already = 이미 투표한 목록, authcode = 인증코드, confirmID = 권한 목록
    //                 });

    //             });
    //         }
    //         else {
    //             console.log(err);
    //         }
    //     });
    // });

    getConnection(function (conn) {
        var queryString = `select users.code, users.code_status, list.* from users join vote_list as list on list.vote_id = users.vote_id where vote_status = 1 and code = ?`
        //users 테이블과 list 테이블을 join하여, users 테이블의 vote_id를 참고하여, list 테이블에서 해당 투표의 정보를 받아온다.
        var params = [request.session.auth];
        conn.query(queryString, params, function (err,results) {
            if(!err) {
                conn.release();
                response.send(ejs.render(htmlPage,{ votedata : results, authcode :  request.session.auth }));
            }
            else {
                console.log(err);
            }
        });
    });
});

router.post('/run',function (request, response) { //투표 중
    var htmlPage = fs.readFileSync('html/vote/vote.html','utf8');
    getConnection(function (conn) {
        var queryString = 'select vote_name, vote_key from vote_list where vote_id = ' + request.body.vote_id;
        conn.query(queryString, function (err,results) {
            conn.release();
            if(!err) response.send(ejs.render(htmlPage, { votekey : results[0].vote_key, votename : results[0].vote_name, voteid : request.body.vote_id, authcode : request.body.authcode }));
        });
    })
});

router.post('/run/commit',function (request, response) { //투표 완료
    // getConnection(function (conn) {
    //     var queryString = 'select * from vote_auth';
    //     conn.query(queryString, function (err, results) {
    //         if (!err) {
    //             queryString = 'insert into vote_auth values (?,?,?)';
    //             params = [results.length, request.body.voteid, request.body.authcode];
    //             conn.query(queryString, params, function (err, results) {
    //                 if (!err) {
    //                     queryString = 'select * from vote_data';
    //                     conn.query(queryString, function (err, results) {
    //                         if (!err) {
    //                             queryString = 'insert into vote_data values (?,?,?)';
    //                             params = [
    //                                 results.length,
    //                                 request.body.voteid,
    //                                 encrypt(request.body.votevalue,request.body.votekey)
    //                             ];
    //                             conn.query(queryString, params, function (err, results) {
    //                                 conn.release();
    //                                 if (!err)  {
    //                                     var htmlPage = fs.readFileSync('html/vote/commit.html','utf8');
    //                                     response.send(ejs.render(htmlPage,{message:'vote'}));
    //                                 }
    //                                 else 
    //                                     console.log(err);
    //                                 }
    //                             );
    //                         }
    //                         else {
    //                             console.log(err);
    //                         }
    //                     })
    //                 } else {
    //                     console.log(err);
    //                 }
    //             });
    //         }
    //         else 
    //             console.log(err);
    //     });
    // });
    getConnection(function (conn) {
        var queryString = `insert into vote_data values (?,?)`;
        var params = [request.body.voteid,encrypt(request.body.votevalue, request.body.votekey)]
        conn.query(queryString,params, function (err, results) {
            if (!err) {
                queryString = `update users set code_status = 1 where vote_id = ? and code = ?`;
                params = [request.body.voteid,request.session.auth];
                    conn.query(queryString,params, function (err, results) {
                        conn.release();
                        if(!err) {
                            var htmlPage = fs.readFileSync('html/vote/commit.html','utf8');
                            response.send(ejs.render(htmlPage,{message:'vote'}));
                        } else console.log(err);
                    });
            }
            else {
                console.log(err);
            }
        });
    });
});

module.exports = router;