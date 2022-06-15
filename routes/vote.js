var fs = require('fs');
var express = require('express');
var ejs = require("ejs");
var getConnection = require('../config/mysql');
const { Console } = require('console');
var router = express.Router();

router.get('/', function (request, response) { //투표 로그인
    if (request.session.isLogin == 1) {
        response.redirect('/vote/list');
    }
    else {
        var htmlPage = fs.readFileSync('html/vote/login.html', 'utf8');
        response.send(htmlPage);
    }
});

router.post('/auth', function (request, response) {
    if (request.session.isLogin == null) { //로그인 세션이 존재하지 않을 경우
        var pw = request.body._password;
        if (pw == 'A1B2C3') { //어떻게 데이터를 넘겨야할까?
            request.session.isLogin = 1; //null: 비로그인 1: 일반로그인 2: 관리자 로그인
            request.session.auth = request.body._password;
            request.session.save(function () {
                response.redirect('/vote/list');
            });
        }
        else { //로그인 실패
            var htmlPage = fs.readFileSync('html/vote/login.html', 'utf8');
            response.send(ejs.render(htmlPage, { status: 'fail' }));
        }
    }
    else if (request.session.isLogin == 1) {
        response.redirect('vote/list');
    }
})

router.get('/list',function (request, response) {
    if (request.session.isLogin == 1) {
        getConnection(function(conn) {
            var queryString = `SELECT * FROM vote`;
            var emtpy = false;
            params = [];
            conn.query(queryString,params, function(err,result){
                var data = result;
                if(data.length == 0) {
                    dummy = {
                        vote_id:-1,
                        vote_name:'null',
                        vote_subject:'null',
                        vote_start:'null',
                        vote_end:'null',
                        vote_status:-1,
                        vote_agree:-1,
                        vote_disagree:-1,
                        vote_none:-1
                    };
                    data = []
                    data.push(dummy);
                    emtpy = true;
                }
                console.log(data);
                if (!err) {
                    queryString = `SELECT vote_id FROM vote_auth where vote_auth = ?`;
                    params = [request.session.auth];
                    var id;
                    conn.query(queryString,params,function(err,result) {
                        conn.release();
                        id = result;
                        var htmlPage = fs.readFileSync('html/vote/list.html', 'utf8');
                        response.send(ejs.render(htmlPage, { authcode: request.session.auth, votedata : data, already : id, emtpy : emtpy}));
                    });
                }
            });
         });
    }
    else {
        response.redirect('/');
    }
});

router.post('/run',function (request, response) {
    var votedata = {
        votename : request.body.votename,
        votesubject : request.body.votesubject,
        voteid : request.body.voteid,
        voteend : request.body.voteend
    }
    if (request.session.isLogin == 1) {
        var htmlPage = fs.readFileSync('html/vote/vote.html', 'utf8');
        response.send(ejs.render(htmlPage, { authcode: request.body.authcode , votedata: votedata }));
    }
    else {
        response.redirect('/');
    }
});

router.post('/run/commit',function (request, response) {
    if (request.session.isLogin == 1) {
        var queryString;
        var data;

        getConnection(function(conn) {
            if (request.body.votedata == 'agree') {
                queryString = `select vote_agree from vote`;
            }
            else if (request.body.votedata == 'disagree') {
                queryString = `select vote_disagree from vote`;
            }
            else if (request.body.votedata == 'none') {
                queryString = `select vote_none from vote`;
            }
            
            conn.query(queryString,params, function(err,result){
                if (!err) {
                    console.log(result);
                    if (request.body.votedata == 'agree') {
                        data = result[0].vote_agree;
                    }
                    else if (request.body.votedata == 'disagree') {
                        data = result[0].vote_disagree;
                    }
                    else if (request.body.votedata == 'none') {
                        data = result[0].vote_none;
                    }

                    console.log(data);

                    if (request.body.votedata == 'agree') {
                        queryString = `UPDATE vote SET vote_agree = ?`;
                    }
                    else if (request.body.votedata == 'disagree') {
                        queryString = `UPDATE vote SET vote_disagree = ?`;
                    }
                    else if (request.body.votedata == 'none') {
                        queryString = `UPDATE vote SET vote_none = ?`;
                    }
            
                    data++;
                    params = [data];
        
                    console.log(data);
            
                    conn.query(queryString,params, function(err,result){
                        if (!err) {
                            queryString = `insert into vote_auth values (?,?)`;
                            params = [request.body.voteid, request.body.authcode];
                            conn.query(queryString, params, function(err,result){
                                conn.release();
                                if (!err) {
                                    response.redirect('/');
                                }
                            });
                        }
                    });
                }
            });
         });

    }
    else {
        response.redirect('/');
    }
});

module.exports = router;