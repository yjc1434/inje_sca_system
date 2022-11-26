function checkPassword() {
    var _password = document.getElementsByName('_password')[0].value;
    document.getElementsByName('_password')[0].value = "";
    if (_password == "") {
        document.getElementsByName('label')[0].className = 'text-center text-danger mb-3';
        document.getElementsByName('_password')[0].className = 'form-control mb-3 is-invalid';
        document.getElementsByName('label')[0].innerText = '비밀번호를 입력해주세요!';
    }
    else {
        var form = document.createElement('form');
        form.setAttribute('method', 'post');
        form.setAttribute('action', '/admin/login');

        var input = document.createElement('input');
        input.setAttribute('type', 'password');
        input.setAttribute('name', '_password');
        input.setAttribute('value', _password);
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
    }
}

function checkSuperPassword() {
    var _password = document.getElementsByName('_password')[0].value;
    document.getElementsByName('_password')[0].value = "";
    if (_password == "") {
        document.getElementsByName('label')[0].className = 'text-center text-danger mb-3';
        document.getElementsByName('_password')[0].className = 'form-control mb-3 is-invalid';
        document.getElementsByName('label')[0].innerText = '비밀번호를 입력해주세요!';
    }
    else {
        var form = document.createElement('form');
        form.setAttribute('method', 'post');
        form.setAttribute('action', '/admin/settings/login');

        var input = document.createElement('input');
        input.setAttribute('type', 'password');
        input.setAttribute('name', '_password');
        input.setAttribute('value', _password);
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
    }
}

function checkVotePassword() {
    var _password = document.getElementsByName('_password')[0].value;
    var _name = document.getElementsByName('_name')[0].value;
    document.getElementsByName('_password')[0].value = "";
    
    if (_password == "") {
        document.getElementsByName('label')[0].className = 'text-center text-danger mb-3';
        document.getElementsByName('_password')[0].className = 'form-control mb-3 is-invalid';
        document.getElementsByName('label')[0].innerText = '인증코드를 입력해주세요!';
    }
    else {
        var form = document.createElement('form');
        form.setAttribute('method', 'post');
        form.setAttribute('action', '/auth');

        var input = document.createElement('input');
        input.setAttribute('type', 'text');
        input.setAttribute('name', '_password');
        input.setAttribute('value', _password);
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
    }
}

function findStudent() {
    var _snum = document.getElementsByName('_snum')[0].value;
    document.getElementsByName('_snum')[0].value = "";
    if (_snum == "") {
        document.getElementsByName('label')[0].className = 'text-center text-danger mb-3';
        document.getElementsByName('_snum')[0].className = 'form-control mb-3 is-invalid';
        document.getElementsByName('label')[0].innerText = '학번을 입력해주세요!';
    }
    else {
        var form = document.createElement('form');
        form.setAttribute('method', 'get');
        form.setAttribute('action', '/admin/result');

        var input = document.createElement('input');
        input.setAttribute('type', 'text');
        input.setAttribute('name', '_snum');
        input.setAttribute('value', _snum);
        form.appendChild(input);
        document.body.appendChild(form);
        
        form.submit();
    }
}

function selectBoxChange(target,value) {
    var val = value;
    var sel = document.getElementById(target);
    var opts = sel.options;
    
    for (var opt, j = 0; opt = opts[j]; j++) {
        if (opt.value == val) {
            sel.selectedIndex = j;
            break;
        }
    }
}