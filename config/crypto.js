const crypto = require('crypto');

//const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Must be 256 bits (32 characters)
const ENCRYPTION_KEY = crypto.randomBytes(32);
const IV_LENGTH = 16; // For AES, this is always 16

function randomKeys() {
    return Buffer.from(crypto.randomBytes(32)).toString('base64');
}

function encrypt(text, key) {
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key,'base64'), iv);
    let encrypted = cipher.update(text);

    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text, key) {
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key,'base64'), iv);
    let decrypted = decipher.update(encryptedText);

    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
}

function encrypt_pdkdf2(text, salt) { //단방향 암호화
    crypto.pbkdf2(text, salt, 256, 32, "sha512", function (err,key) {
        console.log(text, salt)
        if (err) {
            console.log(err)
            return;
        }
        let hash = key.toString("base64");
        console.log(hash);
    })
}

module.exports = { decrypt, encrypt, randomKeys, encrypt_pdkdf2 };

