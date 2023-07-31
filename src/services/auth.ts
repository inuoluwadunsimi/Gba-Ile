import {SignupOtpRequest, VerifyOtpRequest} from "../interfaces/user/auth.requests";
import {UserAuthDb} from "../models/user/user.auth";
import {UserAuth, UserVer} from "../interfaces/user/models";
import {BadRequestError} from "../interfaces";
import {generateOtp} from "../helpers/utils";
import {UserVerDb} from "../models/user/user.verification";
import {JwtType, OtpType} from "../interfaces/user/user.verfication";
import {JwtHelper} from "../helpers/jwt/jwt.helper";
import {config} from "../constants/settings";
import {UserTokenDb} from "../models/user/user.token";
import {redisClient} from "../helpers/redis.connector";

const jwtHelper = new JwtHelper({
    privateKey: config.jwtPrivateKey,
    UserTokendb:UserTokenDb,
    redisClient
})

export async function signupOtpRequest(body:SignupOtpRequest):Promise<void>{
    const {device} = body
    let {email} = body
    email = email.toLowerCase()


    // if otp is in use,send error message
    const existingUser = await UserAuthDb.findOne<UserAuth>({email})
    if(existingUser){
        throw new BadRequestError('This email is already in use')
    }


    const sentOtp = await UserVerDb.findOne<UserVer>({
        email,
        deviceId:device,
        createdAt:{$gte:Date.now() - 60000}

    })

    // this restricts the user from making request for another otp until after an hour

    if(sentOtp){
        throw new  BadRequestError('Otp has been sent within the minute')
    }

    const otp = generateOtp()

    await UserVerDb.create({
        email,
        otp,
        deviceId:device,
        type:OtpType.SIGN_UP,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)

    })
  // email provider goes here

}


export async function verifySignupOtp(body:VerifyOtpRequest):Promise<string>{
    const {device,otp} = body
    let {email} = body
    email = email.toLowerCase()


    const verification = await UserVerDb.findOne<UserVer>({
        email,
        otp,
        device
    })


    if (!verification) {
        throw new BadRequestError('Otp entered is incorrect');
    } else if (new Date(verification.expiresAt) < new Date()) {
        throw new BadRequestError('Otp has expired');
    }

   const token = jwtHelper.generateToken({email,deviceId:device,type:JwtType.NEW_USER})
    verification.deleteOne()
    return token

}
