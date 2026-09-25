const crypto = require('crypto');

// Quy tắc tên đăng nhập dùng chung cho tự đăng ký và tài khoản giáo viên tạo sẵn
const USERNAME_RE = /^[a-z0-9_.]{3,32}$/;

// Bỏ các ký tự dễ nhầm (0/O, 1/I/l) để học viên chép mật khẩu tạm / mã lớp không sai
const FRIENDLY = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const FRIENDLY_LOWER = 'abcdefghjkmnpqrstuvwxyz23456789';

function randomFrom(alphabet, length) {
  let out = '';
  for (let i = 0; i < length; i++) out += alphabet[crypto.randomInt(alphabet.length)];
  return out;
}

const generateJoinCode = () => randomFrom(FRIENDLY, 6);
const generateTempPassword = () => randomFrom(FRIENDLY_LOWER, 8);

module.exports = { USERNAME_RE, generateJoinCode, generateTempPassword };
