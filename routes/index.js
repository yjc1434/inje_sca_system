var fs = require('fs');
var express = require('express');
var ejs = require("ejs");
var router = express.Router();
var getConnection = require('../config/mysql');
var AdminRouter = require('./admin');
var VoteRouter = require('./vote');
var send_message = require('../config/ncp_sens');
const decrypt = require('../config/crypto').decrypt;
const encrypt = require('../config/crypto').encrypt;
const logger = require("../config/log");
var requestIp = require('request-ip');

router.use('/admin',AdminRouter);
router.use('/vote',VoteRouter);

router.get('/err', function (request, response) {
    try {
        var htmlPage = fs.readFileSync('html/error.html', 'utf8');
        response.send(htmlPage);
    }
    catch (err) {
        console.log(err);
    }
})

router.get('/', function (request, response) {
    //try {
        if (request.session.isLogin == null) {
            logger.info(requestIp.getClientIp(request) + ' index -개인정보 수집·이용 동의서 페이지')
            var htmlPage = fs.readFileSync('html/private_agree.html', 'utf8');
            response.send(htmlPage);
        }
        else if (request.session.isLogin == 1) {
            if (request.session.checkinfo == true) { //본인확인까지 완료
                logger.info(requestIp.getClientIp(request) + ' index -투표 목록 페이지')
                response.redirect('/vote');
            }
            else { //본인확인 안함
                logger.info(requestIp.getClientIp(request) + ' index -본인 정보 확인 페이지')
                response.redirect('/checkinfo');
            }
        }
        else if (request.session.isLogin == 2) {
            logger.info(requestIp.getClientIp(request) + ' index -관리자 페이지')
            response.redirect('/admin');
        }
        else if (request.session.isLogin == 4) { //본인 인증을 하다가 중간에 종료했을 경우 세션 삭제 후 처음부터 진행
            request.session.destroy(function () {
                response.redirect('/');
            });
        }
    // }
    // catch (err) {
    //     logger.error(requestIp.getClientIp(request) + err)
    //     response.redirect('/err');
    //     console.log(err);
    // }
});

router.get('/login', function (request, response) { //학번인증
    try {
        if (request.session.isLogin == null) {
            logger.info(requestIp.getClientIp(request) + ' index -학번 입력 페이지')
            var htmlPage = fs.readFileSync('html/login_studnum.html', 'utf8');
            response.send(htmlPage);
        }
        else if (request.session.isLogin == 1) {
            logger.info(requestIp.getClientIp(request) + ' index -투표 페이지 리다이렉트')
            response.redirect('/vote');
        } 
        else if (request.session.isLogin == 2) {
            logger.info(requestIp.getClientIp(request) + ' index -관리자 페이지 리다이렉트')
            response.redirect('/admin');
        }
        else if (request.session.isLogin == 4) { //본인 인증을 하다가 중간에 종료했을 경우 세션 삭제 후 처음부터 진행
            request.session.destroy(function () {
                response.redirect('/');
            });
        }
    }
    catch (err) {
        logger.error(requestIp.getClientIp(request)+err)
        response.redirect('/err');
        console.log(err);
    }
});

router.post('/selectbox', function (request, response) { //select option 갱신을 위한 ajax 통신
    try {
        logger.info(requestIp.getClientIp(request) + ' index -셀렉트박스 AJAX 통신')
        getConnection(function (conn) {
            var queryString = 'select distinct name from users where gname = ?';
            params = [request.body.group];
            conn.query(queryString, params, function (err, results) {
                conn.release();
                if (!err) {
                    response.send(JSON.stringify(results));
                }
                else {
                    logger.error(requestIp.getClientIp(request)+err)
                    response.send(err);
                }
            });
        });
    }
    catch (err) {
        logger.error(requestIp.getClientIp(request)+err)
        response.redirect('/err');
        console.log(err);
    }
});

router.post('/auth', function (request, response) { //인증코드
    try {
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
    }
    catch (err) {
        response.redirect('/err');
        console.log(err);
    }
});

router.post('/auth/studnum1', function (request, response) {
    try {
        var pw = request.body.password;
        if (pw.length == 8) {
            logger.info(requestIp.getClientIp(request) + ' index -학번 입력 AJAX')
            getConnection(function (conn) {
                logger.info(requestIp.getClientIp(request) + ' index -학번 입력 AJAX-DB CONNECT ' + request.body.password)
                var queryString = 'select gname, name, password from users where name = ?';
                params = [pw];
                conn.query(queryString, params, function (err, results) {
                    conn.release();
                    if (!err) {
                        logger.info(requestIp.getClientIp(request) + ' index -학번 입력 AJAX-DB CONNECT-성공');
                        if (results.length != 0) {
                            if (pw == results[0].name) {  //학번이 존재하는 경우
                                request.session.isLogin = 4 //휴대폰 인증
                                request.session.group = results[0].gname.trim();
                                request.session.name = results[0].name.trim();
                                request.session.password = results[0].password.trim();
                                request.session.save(function() {
                                    response.send('true');
                                })
                            }
                            else { //로그인 실패
                                response.send('false');
                            }
                        }
                        else {
                            response.send('false');
                        }
                    } else {
                        logger.error(requestIp.getClientIp(request) + err);
                        console.log(err);
                        response.send('false');
                    }
                });
            });
        }
        //if (request.session.isLogin == null) { //로그인 세션이 존재하지 않을 경우
            
            

            // if (pw == '200101') {
            //     request.session.isLogin = 1
            //     request.session.group = '관리자';
            //     request.session.name = '200101';
            //     request.session.password = '200101';
            //     request.session.checkinfo = true;
            //     request.session.save(function () {
            //         response.send('admin');
            // });
            // }
            // else {
            //     getConnection(function (conn) {
            //         logger.info(requestIp.getClientIp(request) + ' index -학번 입력 AJAX-DB CONNECT ' + request.body.password)
            //         var queryString = 'select gname, name, password from users where name = ?';
            //         params = [parseInt(pw)];
            //         conn.query(queryString, params, function (err, results) {
            //             if (!err) {
            //                 conn.release();
            //                 logger.info(requestIp.getClientIp(request) + ' index -학번 입력 AJAX-DB CONNECT-성공');
            //                 if (results.length != 0) {

            //                 }
            //                 else {
            //                     response.send('false');
            //                 }
            //             } else 
            //                 logger.error(requestIp.getClientIp(request)+err)
            //                 console.log(err);
            //                 response.send('false');
            //             }
            //         );
            //     });
            // }

        //} else if (request.session.isLogin == 1) {
        //    response.redirect('/vote/list');
        //}
        //else {
        //    response.redirect('/');
        //}
    }
    catch (err) {
       logger.error(requestIp.getClientIp(request) + ' ' + err)
       console.log(err);
       response.redirect('/err');  
    }
});

router.get('/auth/studnum/phone', function (request, response) { //휴대폰 인증 페이지
    try {
        if (request.session.isLogin == 4) {
            logger.info(requestIp.getClientIp(request) + ' index -휴대폰 문자 페이지')
            var htmlPage = fs.readFileSync('html/login_sms.html','utf8');
            //response.send(ejs.render(htmlPage,{ group : request.session.group, name : request.session.name, password : request.session.password }));
            response.send(htmlPage);
        }
        else {
            response.redirect('/');
        }
    }
    catch (err) {
        //logger.error(requestIp.getClientIp(request)+err)
        //response.redirect('/err');
        //console.log(err);
    }
});

router.post('/auth/studnum/sms/send', async function (request, response) {
    try {
        if (request.session.isLogin == 4) { //sms ajax
            logger.info(requestIp.getClientIp(request) + ' index -인증문자 요청')
            if (request.session.codeTime == undefined || new Date().getTime() - request.session.codeTime > 60000) {
                var phone = decrypt(request.session.password.trim(), process.env.DB_KEY);
                var verifyCode = Math.floor(Math.random() * (999999 - 100000)) + 100000;
                var message = `[인제대학교 동아리연합회]\n인증번호 [${verifyCode}]를 입력해주세요.`
                var status = await send_message(phone,message);
                //console.log(status);
                if(status == 202) {
                    logger.info(requestIp.getClientIp(request) + ' index -인증문자 성공')
                    request.session.code = verifyCode;
                    request.session.codeTime = new Date().getTime();
                    request.session.save(function () {
                        response.send('true');  
                    });
                }
                else {
                    console.log('?')
                    logger.error(requestIp.getClientIp(request) + ' index -인증문자 실패')
                    response.send('false');
                }
            }
            else {
                logger.error(requestIp.getClientIp(request) + ' index -인증문자 잦은 시도')
                response.send('fast');
            }
        }
        else {
            response.redirect('/');
        }
    }
    catch (err) {
        logger.error(requestIp.getClientIp(request) + ' index -인증문자 잦은 시도')
        response.redirect('/err');
        console.log(err);
   }
});

router.post('/auth/studnum/sms/check', function (request, response) {
    try {
        logger.info(requestIp.getClientIp(request) + ' index -인증문자 대조')
        var pw = request.body.password;
        if (request.session.isLogin == 4) { //code ajax
            var code = request.session.code;
            var time = request.session.codeTime;
            var now = new Date().getTime();
            if (now - time < 60000 && pw == code) {
                delete request.session.code;
                delete request.session.codeTime;
                request.session.isLogin = 1;
                request.session.checkinfo = true;
                logger.info(requestIp.getClientIp(request) + ' index -인증번호 성공:' + request.session.name)
                request.session.save(function () {
                    response.send('true');
                });
            }
            else if (now - time > 60000) {
                logger.error(requestIp.getClientIp(request) + ' index -인증번호 시간 만료')
                response.send('timeout');
            }
            else {
                logger.error(requestIp.getClientIp(request) + ' index -인증번호 틀림')
                response.send('false');
            }
        }
        else {
            response.redirect('/');
        }
    }
    catch (err) {
        logger.error(requestIp.getClientIp(request)+err)
        response.redirect('/err');
        console.log(err);
    }
    
});

router.get('/checkinfo', function (request, response) { //정보확인
    try {
        if (request.session.isLogin != null) {
            var htmlPage = fs.readFileSync('html/checkinfo.html','utf8');
            response.send(ejs.render(htmlPage,{ group : request.session.group, name : request.session.name }));
        }
        else {
            response.redirect('/');
        }
    }
    catch (err) {
        response.redirect('/err');
        console.log(err);
    }
    
});

router.get('/checkinfo/:answer', function (request, response) { //정보확인
    try {
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
    }
    catch (err) {
        response.redirect('/err');
        console.log(err);
    }
});

router.all('/logout', function (request, response) { //로그아웃
    logger.info(requestIp.getClientIp(request) + ' index -로그아웃')
    try {
        logger.info(requestIp.getClientIp(request) + ' index -로그아웃 성공:' + request.session.name)
        if (request.session.isLogin != null) {
            request.session.destroy(function () {
                response.redirect('/');
            });
        }
   }
    catch (err) {
        logger.error(requestIp.getClientIp(request)+err)
        response.redirect('/err');
        console.log(err);
    }
});

module.exports = router;