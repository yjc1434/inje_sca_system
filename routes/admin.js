var fs = require('fs');
var express = require('express');
var ejs = require("ejs");
var excel = require("../config/excel_fs");
var getConnection = require('../config/mysql');
var router = express.Router();
var encrypt = require('../config/crypto').encrypt;
var decrypt = require('../config/crypto').decrypt;
var randomKeys = require('../config/crypto').randomKeys;
var multer = require('multer'); // 1
const logger = require("../config/log");
var requestIp = require('request-ip');

var students = [];

const upload = multer({dest:'./temp/upload'});

router.get('/', function (request, response) {
    try {
        if (request.session.isLogin == 2) {
            var htmlPage = fs.readFileSync('html/admin/menu.html', 'utf8');
            response.send(htmlPage);
        }
        else if (request.session.isLogin == 1) {
            response.redirect('/vote');
        }
        else {
            response.redirect('/admin/login');
        }
    } catch (err) {
        logger.error(requestIp.getClientIp(request) + ' admin- ' +err)
        console.log(err);
    }
});

router.get('/login', function (request, response) {
    try {
        if (request.session.isLogin == 2) {
            response.redirect('/admin');
        }
        else {
            logger.info(requestIp.getClientIp(request) + ' admin -관리자 로그인 페이지')
            var htmlPage = fs.readFileSync('html/admin/login.html', 'utf8');
            response.send(htmlPage);
        }
    }
    catch (err) {
        logger.error(requestIp.getClientIp(request) + ' admin- ' +err)
        console.log(err);
    }
});

router.post('/login/auth', function (request, response) { //관리자 로그인
    try {
        if (request.session.isLogin == null) {
            var pw = request.body.password;
            if (pw == '200101'){
                request.session.isLogin = 2; //정보확인을 완료한 계정이라는 세션 정보
                logger.info(requestIp.getClientIp(request) + ' admin -관리자 로그인 완료')
                request.session.save(function () {
                    response.send('true');
                });
            }
            else {
                logger.info(requestIp.getClientIp(request) + ' admin -관리자 로그인 실패')
                response.send('false');
            }
        }
    }
    catch (err) {
        logger.error(requestIp.getClientIp(request) + ' admin- ' +err)
        console.log(err);
    }
});

router.get('/vote', function (request, response) {
    try {
        if (request.session.isLogin == 2) {
            logger.info(requestIp.getClientIp(request) + ' admin -투표 목록 불러오기')
            getConnection(function (conn) {
                var queryString = `SELECT * FROM vote_list`;
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
                            else if (data[i].vote_status == 2 || data[i].vote_status == 3) { //완료
                                d3.push(data[i]);
                            }
                        }
                        var htmlPage = fs.readFileSync('html/admin/vote/vote.html', 'utf8');
                        response.send(ejs.render(htmlPage, { votedata_0: d1, votedata_1: d2, votedata_2: d3 }));
                    }
                    else {
                        var htmlPage = fs.readFileSync('html/error.html', 'utf8');
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
        logger.error(requestIp.getClientIp(request) + ' admin- ' +err)
        console.log(err);
    }
    
});

router.get('/vote/add', function (request, response) { //투표 관리
    try {
        if (request.session.isLogin == 2) {
            logger.info(requestIp.getClientIp(request) + ' admin -투표 추가 페이지')
            var htmlPage = fs.readFileSync('html/admin/vote/vote_add.html', 'utf8');
            response.send(ejs.render(htmlPage,{keys:randomKeys()}));
        }
        else {
            response.redirect('/');
        }
    }
    catch (err) {
        logger.error(requestIp.getClientIp(request) + ' admin- ' +err)
        console.log(err);
    }
    
});

router.post('/vote/add/commit', upload.single('_list'), function (request, response) { //투표 추가 완료
    try {
        if (request.session.isLogin == 2) {
            logger.info(requestIp.getClientIp(request) + ' admin -투표 추가 완료')
            var sheetdata = excel('./temp/upload/' + request.file.filename);
            fs.unlinkSync('./temp/upload/' + request.file.filename, function(err) {
                console.log(err);
            });
            var queryString = `select vote_id from vote_list order by vote_id desc limit 1`;  //마지막 투표 ID 불러오기
            var name = request.body.vote_name;
            var subject = request.body.vote_subject;
            var key = request.body.vote_key;
            var end = request.body.vote_endtime;
            var id;
            var params = [];
            getConnection(function (conn) {
                conn.query(queryString, params, function (err,result) {
                    if (!err) {
                        if (result.length == 0) id = 0;
                        else id = result[0].vote_id + 1;
                        queryString = 'insert into vote_list values (?,?,?,?,?,?,?,?,?)' //투표 추가
                        params = [id,name,subject,key,end,0,0,0,0];
                        conn.query(queryString, params, function (err, result) {
                            if (!err) {
                                var insertQuery = "insert into users (gname, name, password, vote_id, code_status) values ";
                                for (let i = 0; i < sheetdata.length; i++) {
                                    insertQuery += "('"
                                    let data = sheetdata[i];
                                    //insertQuery += data[request.body.vote_cellname]+'",'+1+','+id+','+'0),';
                                    //insertQuery += data['소속']+'","'+data['동아리명']+'","'+data['비밀번호']+'","'+ id +'", "0"),';
                                    let d1 = encrypt(data['소속'].toString().trim(),process.env.DB_KEY).trim();
                                    let d2 = data['동아리명'].toString().trim();
                                    let d3 = encrypt(data['비밀번호'].toString().trim(),process.env.DB_KEY).trim();
                                    insertQuery += d1+"','"+d2+"','"+d3+"','"+ id +"','0'),";
                                }
                                insertQuery = insertQuery.substring(0,insertQuery.length - 1);
                                conn.query(insertQuery,null,function(err,result) {
                                    if (err){
                                        logger.error(requestIp.getClientIp(request) + ' admin- ' +err)
                                        console.log(err);
                                        var htmlPage = fs.readFileSync('html/error.html', 'utf8');
                                        response.send(htmlPage);
                                    }
                                    else {
                                        conn.release();
                                        var htmlPage = fs.readFileSync('html/admin/vote/vote_update.html','utf8');
                                        response.send(ejs.render(htmlPage,{message : 'commit'}));
                                    }
                                })
                                // queryString = 'insert into users values (?,?,?,?)' //유권자 추가
                                // for (let i = 0; i < sheetdata.length; i++) {
                                //     let data = sheetdata[i];
                                //     params = [data[request.body.vote_cellname],1,id,0];
                                //     conn.query(queryString, params, function (err, result) {
                                //         if (err) return;
                                //     });
                                // }
                                // var htmlPage = fs.readFileSync('html/admin/vote/vote_update.html','utf8');
                                // response.send(ejs.render(htmlPage,{message : 'commit'}));
                            }
                            else {
                                console.log(err);
                                logger.error(requestIp.getClientIp(request) + ' admin- ' +err)
                                var htmlPage = fs.readFileSync('html/error.html', 'utf8');
                                response.send(htmlPage);
                                
                            }
                        });
                    }
                    else {
                        var htmlPage = fs.readFileSync('html/error.html', 'utf8');
                        response.send(htmlPage);
                        console.log(err);
                        logger.error(requestIp.getClientIp(request) + ' admin- ' +err)
                    }
                });
            });
        }
        else {
            response.redirect('/');
        }
    }
    catch (err) {
        console.log(err);
        logger.error(requestIp.getClientIp(request) + ' admin- ' +err)
    }
    
});

router.post('/vote/start', function (request,response) { //투표 시작
    try {
        if (request.session.isLogin == 2) {
            logger.info(requestIp.getClientIp(request) + ' admin -투표 변경(시작)')
            var id = request.body.vote_id;
            getConnection(function (conn) {
                var queryString = `update vote_list set vote_status = ? where vote_id = ?`;
                params = ['1',id];
                conn.query(queryString, params, function (err, result) {
                    conn.release();
                    if (!err) {
                        var htmlPage = fs.readFileSync('html/admin/vote/vote_update.html','utf8');
                        response.send(ejs.render(htmlPage,{message : 'start'}));
                    }
                    else {
                        logger.error(requestIp.getClientIp(request) + ' admin- ' +err)
                        var htmlPage = fs.readFileSync('html/error.html', 'utf8');
                        response.send(htmlPage);
                    }
                });
            });
        } else {
            response.redirect('/');
        }
    }
    catch (err) {
        logger.error(requestIp.getClientIp(request) + ' admin- ' +err)
        console.log(err);
    }
    
});

router.post('/vote/end', function (request,response) {
    try {
        if (request.session.isLogin == 2) {
            logger.info(requestIp.getClientIp(request) + ' admin -투표 변경(종료)')
            var id = request.body.vote_id;
            getConnection(function (conn) {
                var queryString = `update vote_list set vote_status = ? where vote_id = ?`;
                params = ['2',id];
                conn.query(queryString, params, function (err, result) {
                    if (!err) {
                    //     getConnection(function (conn) {
                    //         var queryString = `delete from users where vote_id = ?`;
                    //         params = [id];
                    //         conn.query(queryString, params, function (err, result) {
                    //             conn.release();
                    //             if (!err) {
                    //                 var htmlPage = fs.readFileSync('html/admin/vote/vote_update.html','utf8');
                    //                 response.send(ejs.render(htmlPage,{message : 'end'}));
                    //             }
                    //             else {
                    //                 console.log(err);
                    //             }
                    //         });
                    //     });
                    // }  (1) 데이터베이스 다 날리기
                        conn.release();
                        var htmlPage = fs.readFileSync('html/admin/vote/vote_update.html','utf8');
                        response.send(ejs.render(htmlPage,{message : 'end'})); //(2) 보존하기
                    }
                    else {
                        logger.error(requestIp.getClientIp(request) + ' admin- ' +err)
                        var htmlPage = fs.readFileSync('html/error.html', 'utf8');
                        response.send(htmlPage);
                    }
                });
            });
        } else {
            response.redirect('/');
        }
    }
    catch (err) {
        logger.error(requestIp.getClientIp(request) + ' admin- ' +err)
        console.log(err);
    }
    
});

router.post('/vote/edit', function (request, response) { //투표 수정
    try {
        if (request.session.isLogin == 2) {
            logger.info(requestIp.getClientIp(request) + ' admin -투표 변경(수정)')
            getConnection(function(conn) {
                var queryString = `select vote_name, vote_subject, vote_endtime from vote_list where vote_id = ?`
                var params = [request.body.vote_id]
                conn.query(queryString,params, function(err, results) {
                    if (!err) {
                        conn.release();
                        var htmlPage = fs.readFileSync('html/admin/vote/vote_edit.html', 'utf8');
                        response.send(ejs.render(htmlPage,{vote_name : results[0].vote_name, vote_subject : results[0].vote_subject, vote_endtime : results[0].vote_endtime, vote_id : request.body.vote_id}));
                    }
                    else {
                        logger.error(requestIp.getClientIp(request) + ' admin- ' +err)
                        var htmlPage = fs.readFileSync('html/error.html', 'utf8');
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
        logger.error(requestIp.getClientIp(request) + ' admin- ' +err)
        console.log(err);
    }
    
});

router.post('/vote/edit/commit', function (request, response) {
    try {
        if (request.session.isLogin == 2) {
            logger.info(requestIp.getClientIp(request) + ' admin -투표 변경(수정 완료)')
            var name = request.body.vote_name;
            var subject = request.body.vote_subject;
            var end = request.body.vote_endtime;
            var id = request.body.vote_id;
            
            getConnection(function (conn) {
                var queryString = `update vote_list set vote_name = ?, vote_subject = ?, vote_endtime = ? where vote_id = ?`
                var params = [name,subject,end,id];
                conn.query(queryString, params, function (err, result) {
                    conn.release();
                    if (!err) {
                        var htmlPage = fs.readFileSync('html/admin/vote/vote_update.html','utf8');
                        response.send(ejs.render(htmlPage,{message : 'edit'}));
                    }
                    else {
                        logger.error(requestIp.getClientIp(request) + ' admin- ' +err)
                        var htmlPage = fs.readFileSync('html/error.html', 'utf8');
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
        logger.error(requestIp.getClientIp(request) + ' admin- ' +err)
        console.log(err);
    }
    
});

router.post('/vote/delete', function (request,response) {
    try {
        if (request.session.isLogin == 2) {
            logger.info(requestIp.getClientIp(request) + ' admin -투표 변경(삭제)')
            var id = request.body.vote_id;
            getConnection(function (conn) {
                var queryString = `update vote_list set vote_status = ? where vote_id = ?`;
                params = ['4',id];
                conn.query(queryString, params, function (err, result) {
                    conn.release();
                    if (!err) {
                        var htmlPage = fs.readFileSync('html/admin/vote/vote_update.html','utf8');
                        response.send(ejs.render(htmlPage,{message : 'delete'}));
                    }
                    else {
                        logger.error(requestIp.getClientIp(request) + ' admin- ' +err)
                        var htmlPage = fs.readFileSync('html/error.html', 'utf8');
                        response.send(htmlPage);
                    }
                });
            });
        } else {
            response.redirect('/');
        }
    }
    catch (err) {
        logger.error(requestIp.getClientIp(request) + ' admin- ' +err)
        console.log(err);
    }
    
});

router.post('/vote/result', function (request,response) { //결과확인
    try {
        logger.info(requestIp.getClientIp(request) + ' admin -투표 결과')
        if (request.session.isLogin == 2) {
            id = request.body.vote_id;
            getConnection(function (conn) {
                var queryString = 'select vote_status from vote_list where vote_id = ?'; //투표의 개표 상태를 확인
                params = [id];
                conn.query(queryString, params, function (err, results) {
                    if (!err) {
                        if (results[0].vote_status == 3) { //이미 개표된 투표일 경우
                            queryString = 'select vote_name, vote_agree, vote_disagree, vote_none, vote_id, vote_subject from vote_list where vote_id = ?'; // 투표의 결과값을 가져옴
                            conn.query(queryString, params, function (err, results) {
                                conn.release();
                                if (!err) {
                                    var htmlPage = fs.readFileSync('html/admin/vote/vote_result.html', 'utf8');
                                    response.send(ejs.render(htmlPage,{data : results}));
                                }
                                else {
                                    logger.error(requestIp.getClientIp(request) + ' admin- ' +err)
                                }
                            });
                        }
                        else {
                            conn.release();
                            var htmlPage = fs.readFileSync('html/admin/vote/vote_result_auth.html', 'utf8');
                            response.send(ejs.render(htmlPage,{vote_id:request.body.vote_id,status:'go'}));
                        }
                    }
                    else {
                        logger.error(requestIp.getClientIp(request) + ' admin- ' +err)
                        var htmlPage = fs.readFileSync('html/error.html', 'utf8');
                        response.send(htmlPage);
                    }
                });
            });
        } else {
            response.redirect('/');
        }
    }
    catch (err) {
        logger.error(requestIp.getClientIp(request) + ' admin- ' +err)
        console.log(err);
    }
    
});

router.post('/vote/result/open', function (request, response) { //개표
    try {
        if (request.session.isLogin == 2) {
            logger.info(requestIp.getClientIp(request) + ' admin -투표 개표')
            var pw = request.body._password;
            var id = request.body.vote_id;
            getConnection(function (conn) {
                var queryString = `select vote_key, vote_name, vote_subject, vote_agree, vote_disagree, vote_none from vote_list where vote_id = ?`;
                params = [id];
                conn.query(queryString, params, function (err, result) {
                    if (!err) {
                        var name = result[0].vote_name;
                        var subject = result[0].vote_subject;
                        if (pw == result[0].vote_key) {
                            var queryString = 'select vote_data from vote_data where vote_id = ? and data_status = 0;';
                            var params = [id];
                            var agree = result[0].vote_agree,
                                disagree = result[0].vote_disagree,
                                none = result[0].vote_none;
                            getConnection(function (conn) {
                                conn.query(queryString, params, function (err, results) {
                                    if (!err) {
                                        for (let i = 0; i < results.length; i++) {
                                            var data = decrypt(
                                                results[i].vote_data,
                                                pw
                                            );
                                            if (data == 'agree') 
                                                agree++;
                                            else if (data == 'disagree') 
                                                disagree++;
                                            else if (data == 'none') 
                                                none++;
                                            }
                                        queryString = 'update vote_list set vote_agree = ? , vote_disagree = ? , vote_none = ?, vote_status = 3 where ' +
                                                'vote_id = ?;';
                                        params = [agree, disagree, none, id]
                                        conn.query(queryString, params, function (err, results) {
                                            if (!err) {
                                                //queryString = 'delete from vote_data where vote_id = ?;';
                                                queryString = 'update vote_data set data_status = 1 where vote_id = ? and data_status = 0'
                                                params = [id];
                                                conn.query(queryString, params, function (err, results) {
                                                    if (!err) {
                                                        conn.release();
                                                        var htmlPage = fs.readFileSync('html/admin/vote/vote_result.html', 'utf8');
                                                        response.send(ejs.render(htmlPage, {data : [{vote_name : name, vote_subject : subject, vote_id : id, vote_agree : agree, vote_disagree : disagree, vote_none : none }]}));
                                                    } else {
                                                        console.log(err);
                                                        var htmlPage = fs.readFileSync('html/error.html', 'utf8');
                                                        response.send(htmlPage);
                                                    }
                                                });
                                            }  else {
                                                conn.release();
                                                console.log(err);
                                                var htmlPage = fs.readFileSync('html/error.html', 'utf8');
                                                response.send(htmlPage);
                                            }
                                        })
                                    } else {
                                        logger.error(requestIp.getClientIp(request) + ' admin- ' +err)
                                        conn.release();
                                        console.log(err);
                                        var htmlPage = fs.readFileSync('html/error.html', 'utf8');
                                        response.send(htmlPage);
                                    }
                                });
                            });
                        }
                        else {
                            logger.error(requestIp.getClientIp(request) + ' admin- ' +err)
                            conn.release();
                            console.log(err);
                            var htmlPage = fs.readFileSync('html/error.html', 'utf8');
                            response.send(htmlPage);
                        }
                    } else {
                        logger.error(requestIp.getClientIp(request) + ' admin- ' +err)
                        conn.release();
                        console.log(err);
                        var htmlPage = fs.readFileSync('html/error.html', 'utf8');
                        response.send(htmlPage);
                    }
                });
            });
        } else {
            var htmlPage = fs.readFileSync('html/error.html', 'utf8');
            response.send(htmlPage);
        }
    }
    catch (err) {
        logger.error(requestIp.getClientIp(request) + ' admin- ' +err)
        console.log(err);
    }
});

router.post('/vote/per', function (request, response) {
    try {
        if (request.session.isLogin == 2) {
            var pw = request.body.voterun;
            getConnection(function (conn) {
                if (pw == "-1") {
                    queryString = 'select count(uid) as total, count(case when code_status=0 then 1 end) as done, vote_id from users group by vote_id';
                }
                else {
                    queryString = 'select count(uid) as total, count(case when code_status=0 then 1 end) as done, vote_id from users where vote_id=' + pw;
                }
                conn.query(queryString, function (err, results) {
                    conn.release();
                    if (!err) {
                        response.send(JSON.stringify(results));
                    }
                    else {
                        logger.error(requestIp.getClientIp(request) + ' admin- ' +err)
                        console.log(err);
                    }
                });
            });
        }
    }
    catch (err){
        logger.error(requestIp.getClientIp(request) + ' admin- ' +err)
    }
});

module.exports = router;
