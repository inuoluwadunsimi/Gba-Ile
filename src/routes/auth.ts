import express from "express";
import {
    handleForgotPasswordOtpRequest,
    handleForgotPasswordOtpVerify,
    handleLogin, handleLogout, handleResendVerifyDeviceOtp,
    handleResetPassword,
    handleSaveSignupDetails,
    handleSignupOtpRequest, handleVerifyDeviceOtp,
    handleVerifySignupOtp,
} from "../controllers/auth";
import {JwtHelper} from "../helpers/jwt/jwt.helper";
import {config} from "../constants/settings";
import {UserTokenDb} from "../models/user/user.token";
import {redisClient} from "../helpers/redis.connector";
import {JwtType} from "../interfaces";

const router = express.Router()

const jwtHelper = new JwtHelper({
    privateKey: config.jwtPrivateKey,
    UserTokendb: UserTokenDb,
    redisClient: redisClient

})


router.post('/signup/otp-request',handleSignupOtpRequest)

router.post('/signup/otp-verify',handleVerifySignupOtp)

router.post('/signup',jwtHelper.requirePermission(JwtType.NEW_USER),handleSaveSignupDetails)

router.post('/forgotpassword/otp-request',handleForgotPasswordOtpRequest)

router.post('/forgotpassword/otp-verify',handleForgotPasswordOtpVerify)

router.post('/forgotpassword/password-reset',jwtHelper.requirePermission(JwtType.NEW_USER),handleResetPassword)

router.post('/login',handleLogin)

router.post('/verify-otp-deviceId', handleVerifyDeviceOtp)

router.post('/resend-device-otp', handleResendVerifyDeviceOtp)


router.post('/logout', jwtHelper.requirePermission(JwtType.USER), handleLogout)




export default router