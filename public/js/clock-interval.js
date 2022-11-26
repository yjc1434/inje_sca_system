var clockTarget = document.getElementById("clock");
    
function clock() {
    var date = new Date();
    var month = date.getMonth();
    var clockDate = date.getDate();
    var day = date.getDay();
    var week = ['일', '월', '화', '수', '목', '금', '토'];
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();
    var innerText = `${month+1}월 ${clockDate}일 ${week[day]}요일 ` +
        `${hours < 10 ? `0${hours}` : hours}시 ${minutes < 10 ? `0${minutes }`  : minutes }분 ${seconds < 10 ? `0${seconds }` : seconds }초`;
    var icon = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-clock me-1" viewBox="0 0 16 16" style="width:1rem;margin-bottom:0.12rem">
    <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
  </svg>`
    clockTarget.innerHTML = icon + innerText;
}

function console_block() {
    document.onkeydown = function() {
        if (event.keyCode == 123) {
            return false;
        }
    }
}

function init() { 
    clock();
    //console_block();
    setInterval(clock, 1000);
}
init();