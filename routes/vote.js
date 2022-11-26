var fs = require('fs');
var express = require('express');
var ejs = require("ejs");
var excel = require("../config/excel_fs");
var getConnection = require('../config/mysql');
var router = express.Router();
var encrypt = require('../config/crypto').encrypt;
var decrypt = require('../config/crypto').decrypt;
var randomKeys = require('../config/crypto').randomKeys;
var multer = require('multer');
const e = require('express');
var requestIp = require('request-ip');
const logger = require("../config/log");

// router.get('/', function (request, response) {
//     var htmlPage = fs.readFileSync('html/vote/list.html', 'utf8');
//     getConnection(function(conn){
//         //var queryString = `select users.password, users.code_status, list.* from users join vote_list as list on list.vote_id = users.vote_id where vote_status = 1 and password = ?`
//         //users 테이블과 list 테이블을 join하여, users 테이블의 vote_id를 참고하여, list 테이블에서 해당 투표의 정보를 받아온다.
//         //var params = [request.session.password];
//         var queryString = 'select vote_id, vote_name, vote_subject, vote_endtime, vote_status from vote_list where vote_status = 1';
//         var params = [];
//         conn.query(queryString, params, function (err,results) {
//             if(!err) {
//                 queryString = 'select vote_id from vote_log where name = ?';
//                 params = [request.session.name];
//                 var votedata = results;
//                 conn.query(queryString, params, function (err,results) {
//                     if(!err) {
//                         conn.release();
//                         var log = results;
//                         var flag = 0;

//                         for (var i = 0; i < votedata.length; i++) {
//                             flag = 0;
//                             for (var j = 0; j < log.length; j++) {
//                                 if (votedata[i].vote_id == log[i].vote_id) {
//                                     votedata[i].code_status = 1;
//                                     flag = 1;
//                                     break;
//                                 }
//                             }
//                             if (flag == 0) votedata[i].code_status = 0;
//                         }
                        
//                             response.send(ejs.render(htmlPage,{ votedata : votedata, authcode :  request.session.password }));
//                     }
//                     else{
//                         console.log(err);
//                     }
//                 })
//             }
//             else {
//                 console.log(err);
//             }
//         });
//     });
// });
router.get('/', function (request, response) {
    try {
        if (request.session.isLogin == 1) {
            logger.info(requestIp.getClientIp(request) + ' vote -투표 목록 불러오기')
            var htmlPage = fs.readFileSync('html/vote/list.html', 'utf8');
            var queryString = `select users.password, users.code_status, list.vote_name, list.vote_subject, list.vote_endtime, list.vote_id from users join vote_list as list on list.vote_id = users.vote_id where list.vote_status = 1 and users.name = ?`
            var params = [request.session.name];
            getConnection(function(conn){
                conn.query(queryString, params, function (err,results) {
                    if(!err) {
                        conn.release();
                        logger.info(requestIp.getClientIp(request) + ' vote -투표 목록 불러오기 성공')
                        response.send(ejs.render(htmlPage,{ votedata : results, authcode :  request.session.auth, group : request.session.group, name : request.session.name }));
                    }
                    else {
                        //console.log(err);
                        logger.error(requestIp.getClientIp(request) + ' vote -투표 목록 불러오기 실패',err)
                        htmlPage = fs.readFileSync('html/error.html', 'utf8');
                        response.send(htmlPage);
                    }
                });
            });
        }
        else {
            response.redirect('/');
        }
    }
    catch (err) {
        logger.error(requestIp.getClientIp(request) + ' vote - ' + err)
        console.log(err);
    }
});

router.post('/run',function (request, response) { //투표 중
    try {
        if (request.session.isLogin == 1) {
            logger.info(requestIp.getClientIp(request) + ' vote -투표 실행')
            var htmlPage = fs.readFileSync('html/vote/vote.html','utf8');
            getConnection(function (conn) {
                var queryString = 'select vote_name, vote_subject, vote_key, vote_endtime from vote_list where vote_id = ' + request.body.vote_id;
                conn.query(queryString, function (err,results) {
                    logger.info(requestIp.getClientIp(request) + ' vote -투표 실행 DB CONNECT')
                    conn.release();
                    if(!err) {
                        if (new Date(results[0].vote_endtime) < new Date()) {
                            logger.info(requestIp.getClientIp(request) + ' vote -투표 시간 만료')
                            response.send(res.render(htmlPage,{msg:'투표 종료시간이 지나 투표가 종료되었습니다.'}));
                            //response.send(htmlPage);
                        }
                        else {
                            logger.info(requestIp.getClientIp(request) + ' vote -투표 실행 성공:' + request.session.name)
                            response.send(ejs.render(htmlPage, { votename : results[0].vote_name, voteid : request.body.vote_id, authcode : request.body.authcode, votesubject : results[0].vote_subject, voteend : results[0].vote_endtime}));
                        }
                    }
                    else {
                        logger.error(requestIp.getClientIp(request) + ' vote - ' + err)
                        htmlPage = fs.readFileSync('html/error.html', 'utf8');
                        response.send(htmlPage);
                    }
                });
            })
        }
        else {
            response.redirect('/');
        }
    }
    catch (err) {
        logger.error(requestIp.getClientIp(request) + ' vote - ' + err)
        console.log(err);
    }
    
});

router.post('/run/commit',function (request, response) { //투표 완료
    try {
        // getConnection(function (conn) {
        //     var queryString = `insert into vote_data values (?,?)`;
        //     var params = [request.body.voteid,encrypt(request.body.votevalue, request.body.votekey)]
        //     conn.query(queryString,params, function (err, results) {
        //         if (!err) {
        //             queryString = `insert into vote_log values (0, ?, ?)`;
        //             params = [request.session.name ,request.body.voteid];
        //                 conn.query(queryString,params, function (err, results) {
        //                     conn.release();
        //                     if(!err) {
        //                         var htmlPage = fs.readFileSync('html/vote/commit.html','utf8');
        //                         response.send(ejs.render(htmlPage,{message:'vote'}));
        //                     } else console.log(err);
        //                 });
        //         }
        //         else {
        //             console.log(err);
        //         }
        //     });
        // });
        if (request.session.isLogin == 1) {
            logger.info(requestIp.getClientIp(request) + ' vote -투표 완료')
            getConnection(function (conn) {
                //var queryString = 'select vote_endtime, vote_key from vote_list where vote_id = ' + request.body.voteid;
                var queryString = `select users.password, users.code_status, list.vote_endtime, list.vote_key from users join vote_list as list on list.vote_id = users.vote_id where list.vote_status = 1 and users.name = ? and users.code_status = 0 and users.vote_id = ?`
                var params = [request.session.name, request.body.voteid];
                conn.query(queryString, params, function (err,results) {
                    logger.info(requestIp.getClientIp(request) + ' vote -투표 완료 DB CONNECT')
                    //conn.release();
                    if(!err && results.length > 0) {
                        if (new Date(results[0].vote_endtime) < new Date()) {
                            logger.info(requestIp.getClientIp(request) + ' vote -투표 시간 만료')
                            htmlPage = fs.readFileSync('html/vote/alert_vote.html','utf8');
                            conn.release();
                            response.send(htmlPage);
                        }
                        else {
                            getConnection(function (conn) {
                                logger.info(requestIp.getClientIp(request) + ' vote -투표 시간 유효')
                                var queryString = `insert into vote_data (vote_id, vote_data) values (?,?)`;
                                var params = [request.body.voteid, encrypt(request.body.votevalue, results[0].vote_key)]
                                conn.query(queryString,params, function (err, results) {
                                    logger.info(requestIp.getClientIp(request) + ' vote -투표 시간 유효 DB CONNECT')
                                    if (!err) {
                                        queryString = `update users set code_status = ? where vote_id = ? and name = ?`;
                                        votelog = (new Date().toLocaleString() + requestIp.getClientIp(request).substring(requestIp.getClientIp(request).lastIndexOf(':'))).toString();
                                        params = [votelog, request.body.voteid, request.session.name];
                                            conn.query(queryString,params, function (err, results) {
                                                conn.release();
                                                if(!err) {
                                                    logger.info(requestIp.getClientIp(request) + ' vote -투표 데이터 완료:' + request.session.name)
                                                    var htmlPage = fs.readFileSync('html/vote/commit.html','utf8');
                                                    response.send(ejs.render(htmlPage,{message:'vote'}));
                                                } else {
                                                    logger.error(requestIp.getClientIp(request) + ' vote - ' + err)
                                                    console.log(err);
                                                    htmlPage = fs.readFileSync('html/error.html', 'utf8');
                                                    response.send(htmlPage);
                                                }
                                            });
                                    }
                                    else {
                                        logger.error(requestIp.getClientIp(request) + ' vote - ' + err)
                                        console.log(err);
                                        htmlPage = fs.readFileSync('html/error.html', 'utf8');
                                        response.send(htmlPage);
                                    }
                                });
                            });
                        }
                    }
                    else if (err == null) {
                        console.log(err);
                        logger.error(requestIp.getClientIp(request) + ' vote - ' + err)
                        htmlPage = fs.readFileSync('html/alert_vote.html', 'utf8');
                        response.send(ejs.render(htmlPage,{msg:'이미 투표에 참여하셨습니다.'}));
                    }
                    else {
                        console.log(err);
                        logger.error(requestIp.getClientIp(request) + ' vote - ' + err)
                        htmlPage = fs.readFileSync('html/error.html', 'utf8');
                        response.send(htmlPage);
                    }
                });
            })
        }
        else {
            response.redirect('/');
        }
    }
    catch (err) {
        logger.error(requestIp.getClientIp(request) + ' vote - ' + err)
        console.log(err);
    }
    
});

module.exports = router;