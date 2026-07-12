const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();

const {
    register,
    verifyOTP,
    resendOTP,
    login,
    forgotPassword,
    resetPassword
} = require("../controllers/authController");

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: "Too many login attempts. Please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false
});

const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: "Too many OTP attempts. Please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false
});

const otpSendLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: "Too many OTP requests. Please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: {
        success: false,
        message: "Too many registration attempts. Please try again after an hour."
    },
    standardHeaders: true,
    legacyHeaders: false
});

router.post("/register", registerLimiter, register);
router.post("/verify-otp", otpLimiter, verifyOTP);
router.post("/resend-otp", otpSendLimiter, resendOTP);
router.post("/login", loginLimiter, login);
router.post("/forgot-password", otpSendLimiter, forgotPassword);
router.post("/reset-password", otpLimiter, resetPassword);

module.exports = router;