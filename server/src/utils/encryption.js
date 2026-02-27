const crypto = require('crypto');

const algorithm = 'aes-256-gcm';
const ivLength = 16;
const saltLength = 64;
const tagLength = 16;
const keyLength = 32;
const iterations = 100000;
const digest = 'sha256';

// Generate key from password
const getKey = (password, salt) => {
  return crypto.pbkdf2Sync(password, salt, iterations, keyLength, digest);
};

// Encrypt data
exports.encrypt = (text, password) => {
  const iv = crypto.randomBytes(ivLength);
  const salt = crypto.randomBytes(saltLength);
  
  const key = getKey(password, salt);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  
  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
};

// Decrypt data
exports.decrypt = (encryptedData, password) => {
  const data = Buffer.from(encryptedData, 'base64');
  
  const salt = data.subarray(0, saltLength);
  const iv = data.subarray(saltLength, saltLength + ivLength);
  const tag = data.subarray(saltLength + ivLength, saltLength + ivLength + tagLength);
  const encrypted = data.subarray(saltLength + ivLength + tagLength);
  
  const key = getKey(password, salt);
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(tag);
  
  return decipher.update(encrypted) + decipher.final('utf8');
};

// Hash data
exports.hash = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

// Generate random token
exports.generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate random password
exports.generatePassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }
  
  return password;
};

// Compare timing-safe
exports.safeCompare = (a, b) => {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
};

// Encrypt object
exports.encryptObject = (obj, password) => {
  const jsonStr = JSON.stringify(obj);
  return exports.encrypt(jsonStr, password);
};

// Decrypt object
exports.decryptObject = (encryptedData, password) => {
  const jsonStr = exports.decrypt(encryptedData, password);
  return JSON.parse(jsonStr);
};