const argon2 = require('argon2');
const Joi = require('joi');

function verifyPassword(password, hash) {
  return argon2.verify(hash, password)
    .then(valid => valid)
    .catch(err => {
      console.error("Error verifying password:", err);
      return false;
    });
}

function hashPassword(password) {
  return argon2.hash(password)
    .then(hash => hash)
    .catch(err => {
      console.error("Error hashing password:", err);
      return null;
    });
}

// validation for new user signup
const user_schema = Joi.object({
    username: Joi.string()
        .pattern(new RegExp('^[a-zA-Z0-9_-]{3,32}$'))
        .required(),

    password: Joi.string()
        .pattern(new RegExp('^[ -~]{8,72}$'))
        .required(),

    email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
        .required()
})
    
module.exports = {
  verifyPassword,
  hashPassword,
  user_schema,
};