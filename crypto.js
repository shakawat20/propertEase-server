const crypto = require('crypto');
// const crypto = require('crypto');

// Generate a random 32-byte (256-bit) key
const secretKey = crypto.randomBytes(32).toString('hex');

console.log('Generated Secret Key:', secretKey);