const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendSMS } = require('../utils/smsService');

const authController = {
    async register(req, res) {
        try {
            const { phoneNumber, email, fullName, password } = req.body;

            // Check if user exists
            const existingUser = await User.findByPhoneNumber(phoneNumber);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this phone number already exists'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);

            // Generate verification code
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

            // Create user
            const user = await User.create({
                phoneNumber,
                email,
                fullName,
                password: hashedPassword,
                verificationCode
            });

            res.status(201).json({
                success: true,
                message: 'Registration successful. Please verify your account.',
                data: { 
                    userId: user.id,
                    requiresVerification: true,
                    verificationCode: verificationCode
                }
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during registration'
            });
        }
    },

    async verifyPhone(req, res) {
        try {
            const { phoneNumber, code } = req.body;

            const isVerified = await User.verifyUser(phoneNumber, code);
            if (!isVerified) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired verification code'
                });
            }

            res.json({
                success: true,
                message: 'Phone number verified successfully'
            });

        } catch (error) {
            console.error('Verification error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during verification'
            });
        }
    },

    async login(req, res) {
        try {
            const { phoneNumber, password } = req.body;

            const user = await User.findByPhoneNumber(phoneNumber);
            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid phone number or password'
                });
            }

            if (!user.is_verified) {
                return res.status(400).json({
                    success: false,
                    message: 'Please verify your phone number before logging in'
                });
            }

            const isPasswordValid = await User.comparePassword(password, user.password);
            if (!isPasswordValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid phone number or password'
                });
            }

            const token = jwt.sign(
                { 
                    userId: user.id,
                    phoneNumber: user.phone_number 
                },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    token,
                    user: {
                        id: user.id,
                        phoneNumber: user.phone_number,
                        email: user.email,
                        fullName: user.full_name
                    }
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during login'
            });
        }
    },

    async resendCode(req, res) {
        try {
            const { phoneNumber } = req.body;

            const user = await User.findByPhoneNumber(phoneNumber);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            await User.updateVerificationCode(phoneNumber, verificationCode);

            res.json({
                success: true,
                message: 'New verification code generated',
                data: {
                    verificationCode: verificationCode
                }
            });

        } catch (error) {
            console.error('Resend code error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while sending verification code'
            });
        }
    }
};

module.exports = authController;
