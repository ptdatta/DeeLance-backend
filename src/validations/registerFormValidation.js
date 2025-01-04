const { check } = require('express-validator');
const User = require('../model/userModel');

const registerFormValidation = [
  check('UserName')
    .exists()
    .withMessage('Username is required.')
    .isLength({ min: 3, max: 16 })
    .withMessage('Username must be between 3 and 20 characters.')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores.')
    .custom(async value => {
      const existingUser = await User.findOne({ UserName: value });
      if (existingUser) {
        throw new Error('Username already in use');
      }
      return true;
    }),
  check('email')
    .isEmail()
    .withMessage('Email is Invalid')
    .exists()
    .withMessage('Email is required')
    .custom(async value => {
      const existingUser = await User.findOne({ email: value });
      if (existingUser) {
        throw new Error('Email already exists');
      }
      return true;
    }),

  check('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain a number')
    .matches(/[A-Z]/)
    .withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain a lowercase letter')
    .matches(/[^A-Za-z0-9]/)
    .withMessage('Password must contain a special character'),

  check('accountType')
    .exists()
    .withMessage('Account type is required.')
    .isIn(['FREELANCER', 'CLIENT'])
    .withMessage('Account type must be either FREELANCER or CLIENT.'),
];

module.exports = registerFormValidation;
