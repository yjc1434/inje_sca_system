var CryptoJS = require('crypto-js')
var request = require('request');

function send_message(phone,message) {
  var user_phone_number = phone;//수신 전화번호 기입
  var resultCode = 404;
  const date = Date.now().toString();
  const uri = process.env.SERVICE_ID; //서비스 ID
  const secretKey = process.env.NCP_SECRET_KEY;// Secret Key
  const accessKey = process.env.NCP_KEY;//Access Key
  const method = "POST";
  const space = " ";
  const newLine = "\n";
  const url = `https://sens.apigw.ntruss.com/sms/v2/services/${uri}/messages`;
  const url2 = `/sms/v2/services/${uri}/messages`;
  const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, secretKey);
  hmac.update(method);
  hmac.update(space);
  hmac.update(url2);
  hmac.update(newLine);
  hmac.update(date);
  hmac.update(newLine);
  hmac.update(accessKey);
  const hash = hmac.finalize();
  const signature = hash.toString(CryptoJS.enc.Base64);

  return new Promise( function (resolve, reject) {
    request({
      method: method,
      json: true,
      uri: url,
      headers: {
        "Contenc-type": "application/json; charset=utf-8",
        "x-ncp-iam-access-key": accessKey,
        "x-ncp-apigw-timestamp": date,
        "x-ncp-apigw-signature-v2": signature,
      },
      body: {
        type: "SMS",
        countryCode: "82",
        from: '01066361434',
        content: message,
        messages: [
          { to: `${user_phone_number}`, },],
      },
    },
      function (err, res, html) {
        if (err) {
          console.log(err+'err');
          reject(err)
        }
        else {
          //console.log(html);
          resultCode = html.statusCode;
          if (resultCode == undefined || resultCode == null)
            resultCode = html.status;
          if(resultCode == 400) {
            console.log(html);
          }
          resolve(resultCode);
        }
      }
    );
  });
  //return resultCode;
}

module.exports = send_message;