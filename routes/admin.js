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
const upload = multer({dest:'./temp/upload'});

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
            });
        });
    }
    else {
        response.redirect('/');
    }
});

router.get('/vote/add', function (request, response) { //투표 관리
    if (request.session.isLogin == 2) {
        var htmlPage = fs.readFileSync('html/admin/vote/vote_add.html', 'utf8');
        response.send(ejs.render(htmlPage,{keys:randomKeys()}));
    }
    else {
        response.redirect('/');
    }
});

router.post('/vote/add/commit', upload.single('_list'), function (request, response) { //투표 추가 완료
    if (request.session.isLogin == 2) {
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
        getConnection(function (conn) {
            conn.query(queryString, params, function (err,result) {
                if (!err) {
                    if (result.length == 0) id = 0;
                    else id = result[0].vote_id + 1;
                    queryString = 'insert into vote_list values (?,?,?,?,?,?,?,?,?)' //투표 추가
                    params = [id,name,subject,key,end,0,0,0,0];
                    conn.query(queryString, params, function (err, result) {
                        if (!err) {
                            queryString = 'insert into users values (?,?,?,?)' //유권자 추가
                            for (let i = 0; i < sheetdata.length; i++) {
                                let data = sheetdata[i];
                                params = [data[request.body.vote_cellname],1,id,0];
                                conn.query(queryString, params, function (err, result) {
                                    if (err) return;
                                });
                            }
                            var htmlPage = fs.readFileSync('html/admin/vote/vote_update.html','utf8');
                            response.send(ejs.render(htmlPage,{message : 'commit'}));
                        }
                        else console.log(err);
                    });
                }
                else console.log(err);
            });
        });
    }
    else {
        response.redirect('/');
    }
});

router.post('/vote/start', function (request,response) { //투표 시작
    if (request.session.isLogin == 2) {
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
            });
        });
    } else {
        response.redirect('/');
    }
});

router.post('/vote/end', function (request,response) {
    if (request.session.isLogin == 2) {
        var id = request.body.vote_id;
        getConnection(function (conn) {
            var queryString = `update vote_list set vote_status = ? where vote_id = ?`;
            params = ['2',id];
            conn.query(queryString, params, function (err, result) {
                conn.release();
                if (!err) {
                    var htmlPage = fs.readFileSync('html/admin/vote/vote_update.html','utf8');
                    response.send(ejs.render(htmlPage,{message : 'end'}));
                }
                else {
                    console.log(err);
                }
            });
        });
    } else {
        response.redirect('/');
    }
});

router.post('/vote/delete', function (request,response) {
    if (request.session.isLogin == 2) {
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
                    console.log(err);
                }
            });
        });
    } else {
        response.redirect('/');
    }
});

router.post('/vote/result', function (request,response) { //결과확인
    if (request.session.isLogin == 2) {
        id = request.body.vote_id;
        getConnection(function (conn) {
            var queryString = 'select vote_status from vote_list where vote_id = ?'; //투표의 개표 상태를 확인
            params = [id];
            conn.query(queryString, params, function (err, results) {
                if (!err) {
                    if (results[0].vote_status == 3) { //이미 개표된 투표일 경우
                        queryString = 'select vote_name, vote_agree, vote_disagree, vote_none from vote_list where vote_id = ?'; // 투표의 결과값을 가져옴
                        conn.query(queryString, params, function (err, results) {
                            conn.release();
                            if (!err) {
                                var htmlPage = fs.readFileSync('html/admin/vote/vote_result.html', 'utf8');
                                response.send(ejs.render(htmlPage,{data : results}));
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
                    console.log(err);
                }
            });
        });
    } else {
        response.redirect('/');
    }
});

router.post('/vote/result/open', function (request, response) { //개표
    if (request.session.isLogin == 2) {
        var pw = request.body._password;
        var id = request.body.vote_id;
        getConnection(function (conn) {
            var queryString = `select vote_key, vote_name from vote_list where vote_id = ?`;
            params = [id];
            conn.query(queryString, params, function (err, result) {
                if (!err) {
                    var name = result[0].vote_name;
                    if (pw == result[0].vote_key) {
                        var queryString = 'select vote_data from vote_data;';
                        var agree = 0,
                            disagree = 0,
                            none = 0;
                        getConnection(function (conn) {
                            conn.query(queryString, function (err, results) {
                                console.log('conn');
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
                                            queryString = 'delete from vote_data WHERE vote_id = ?;';
                                            params = [id];
                                            conn.query(queryString, params, function (err, results) {
                                                if (!err) {
                                                    conn.release();
                                                    var htmlPage = fs.readFileSync('html/admin/vote/vote_result.html', 'utf8');
                                                    response.send(ejs.render(htmlPage, {data : [{vote_name : name, vote_agree : agree, vote_disagree : disagree, vote_none : none}]}));
                                                } else {
                                                    console.log(err);
                                                }
                                            });
                                        } else {
                                            console.log(err);
                                        }
                                    })
                                } else {
                                    console.log(err);
                                }
                            });
                        });
                    }
                } else {
                    console.log(err);
                }
            });
        });
    } else {
        console.log(err);
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
            var queryString = 'select code from users where code = ? and type = ?';
            params = [pw, '2'];
            conn.query(queryString, params, function (err, result) {
                conn.release();
                if (result.length == 0) {
                    var htmlPage = fs.readFileSync('html/admin/login.html', 'utf8');
                    response.send(ejs.render(htmlPage, { status: 'none' }));
                }
                else {
                    if (!err) {
                        if (pw == result[0].code) {
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
                    else {
                        console.log(err);
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