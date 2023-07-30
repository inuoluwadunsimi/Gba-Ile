import express from "express";
import {handleSignupOtpRequest, handleVerifySignupOtp} from "../controllers/auth";

const router = express.Router()



router.post('/signup/otp-request',handleSignupOtpRequest  )
router.post('/otp-verify/',handleVerifySignupOtp)



export default router