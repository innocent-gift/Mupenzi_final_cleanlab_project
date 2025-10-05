const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/register', authController.register);
router.post('/verify-phone', authController.verifyPhone);
router.post('/login', authController.login);
router.post('/resend-code', authController.resendCode);

module.exports = router;
