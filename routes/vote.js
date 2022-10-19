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
    var htmlPage = fs.readFileSync('html/vote/list.html', 'utf8');
    var queryString = `select users.password, users.code_status, list.vote_name, list.vote_subject, list.vote_endtime, list.vote_id from users join vote_list as list on list.vote_id = users.vote_id where vote_status = 1 and password = ?`
    var params = [request.session.password];
    getConnection(function(conn){
        conn.query(queryString, params, function (err,results) {
            if(!err) {
                conn.release();
                response.send(ejs.render(htmlPage,{ votedata : results, authcode :  request.session.auth, group : request.session.group, name : request.session.name }));
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
        var queryString = 'select vote_name, vote_subject, vote_key, vote_endtime from vote_list where vote_id = ' + request.body.vote_id;
        conn.query(queryString, function (err,results) {
            conn.release();
            if(!err) {
                if (new Date(results[0].vote_endtime) < new Date()) {
                    htmlPage = fs.readFileSync('html/vote/alert_vote.html','utf8');
                    response.send(htmlPage);
                }
                else {
                    response.send(ejs.render(htmlPage, { votename : results[0].vote_name, voteid : request.body.vote_id, authcode : request.body.authcode, votesubject : results[0].vote_subject, voteend : results[0].vote_endtime}));
                }
            }
        });
    })
});

router.post('/run/commit',function (request, response) { //투표 완료
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
    getConnection(function (conn) {
        var queryString = 'select vote_endtime, vote_key from vote_list where vote_id = ' + request.body.voteid;
        conn.query(queryString, function (err,results) {
            conn.release();
            if(!err) {
                if (new Date(results[0].vote_endtime) < new Date()) {
                    htmlPage = fs.readFileSync('html/vote/alert_vote.html','utf8');
                    response.send(htmlPage);
                }
                else {
                    getConnection(function (conn) {
                        var queryString = `insert into vote_data values (?,?)`;
                        var params = [request.body.voteid, encrypt(request.body.votevalue, results[0].vote_key)]
                        conn.query(queryString,params, function (err, results) {
                            if (!err) {
                                queryString = `update users set code_status = 1 where vote_id = ? and password = ?`;
                                params = [request.body.voteid, request.session.password];
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
                }
            }
            else {
                console.log(err);
            }
        });
    })
});

module.exports = router;