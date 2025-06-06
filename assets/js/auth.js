import argon2 from 'argon2';
import Joi from 'joi';

async function verifyPassword(password, hash) {
  try {
    return await argon2.verify(hash, password);
  } catch (err) {
    console.error("Error verifying password:", err);
    return false;
  }
}

async function hashPassword(password) {
  try {
    return await argon2.hash(password);
  } catch (err) {
    console.error("Error hashing password:", err);
    return null;
  }
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

// validation for user login
const user_login_schema = Joi.object({
    username: Joi.string()
        .pattern(new RegExp('^[a-zA-Z0-9_-]{3,32}$'))
        .required(),

    password: Joi.string()
        .pattern(new RegExp('^[ -~]{8,72}$'))
        .required()
});


export default {
  verifyPassword,
  hashPassword,
  user_schema,
  user_login_schema
};