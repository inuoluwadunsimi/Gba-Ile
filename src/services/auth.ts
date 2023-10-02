import {UserAuthDb} from "../models/user/user.auth";
import {
    User,
    UserAuth,
    UserVer,
    AuthResponse,
    BadRequestError,
    JwtType,
    OtpType,
    SaveSignup,
    OtpRequest,
    VerifyOtpRequest,
    ResetPassword,
    LoginRequest, NotFoundError, resendOtp
} from "../interfaces";
import {generateOtp} from "../helpers/utils";
import {UserVerDb} from "../models/user/user.verification";
import {JwtHelper} from "../helpers/jwt/jwt.helper";
import {config} from "../constants/settings";
import {UserTokenDb} from "../models/user/user.token";
import {redisClient} from "../helpers/redis.connector";

import * as bcrypt from 'bcrypt'
import {UserDb} from "../models/user/user";

const jwtHelper = new JwtHelper({
    privateKey: config.jwtPrivateKey,
    UserTokendb:UserTokenDb,
    redisClient
})

export async function signupOtpRequest(body:OtpRequest):Promise<void>{
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
        type: OtpType.SIGN_UP,
        deviceId:device,
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

export async function saveSignupDetails(body:SaveSignup):Promise<AuthResponse>{
    const {email,password,fullName,device} = body

    const hashedPassword = await bcrypt.hash(password,16)
    const inputedUser =  new  UserDb({
        email,
        fullName,
    })

    const user =  inputedUser.save()

    await  UserAuthDb.create({
        email,
        password:hashedPassword,
        user:(await  user).id,
        recognisedDevice:device,

    })
    // generate a user Token
    const token = jwtHelper.generateToken({
        email,
        deviceId:device,
        type:JwtType.USER
    })

    //save the token to the db
    await UserTokenDb.create({
        token,
        email,
        user:(await user).id,
        deviceId:device
    })
   return {
        user: user as unknown as  User,
       token:token
   }

}


export async function forgotPasswordRequest(body:OtpRequest):Promise<void>{
    const {email,device} = body

    const existingAuth = await UserAuthDb.findOne<UserAuth>({email})
    if(!existingAuth){
        throw new  BadRequestError('user does not exist, create account')
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
        type:OtpType.FORGOT_PASSWORD,

    })
    // email provider goes here

}

export async function forgotPasswordOtpVerify(body:VerifyOtpRequest):Promise<string>{
    const {email,otp,device} = body

    const verif = await UserVerDb.findOne<UserVer>({
        email,
        otp,
        type: OtpType.FORGOT_PASSWORD,
        deviceId:device,
    })


    if (!verif) {
        throw new BadRequestError('Otp entered is incorrect');
    } else if (new Date(verif.expiresAt) < new Date()) {
        throw new BadRequestError('Otp has expired');
    }

    const token = jwtHelper.generateToken({email,deviceId:device,type:JwtType.NEW_USER})
    verif.deleteOne()
    return token

}

export async function resetPassword(body:ResetPassword):Promise<AuthResponse>{
    const {password,email,device} = body

    const hashedPassword = await bcrypt.hash(password,16)
    const exUser = await UserAuthDb.findOne<UserAuth>({
        email,
    })
    if(!exUser){
        throw new BadRequestError('user does exist')
    }

    exUser.password = hashedPassword
    await exUser.save()
    const user = await UserDb.findOne<User>({email})
    const token = jwtHelper.generateToken({
        email,
        deviceId:device,
        type:JwtType.USER
    })
    await UserTokenDb.deleteMany({})
    await UserTokenDb.create({
        token,
        email,
        user:user?.id,
        deviceId:device
    })
    return{
        user:user!,
        token
    }


}




export async function Login(body: LoginRequest): Promise<AuthResponse> {
    let {email} = body;
    const {password, deviceId} = body;
    email = email.toLowerCase();

    const userMail = await UserAuthDb.findOne<UserAuth>({email});
    if (!userMail) {
        throw new BadRequestError('invalid credentials');
    }

    const verifyPassword = await bcrypt.compare(password, userMail.password);
    if (!verifyPassword) {
        throw new BadRequestError('invalid credentials');
    }

    // check for unrecognised devices
    if (!userMail.recognisedDevices.includes(deviceId)) {
        // generate otp and send to mail

        const otp = generateOtp();


        await UserVerDb.updateOne(
            {email},
            {
                email,
                otp,
                deviceId,
                type: OtpType.LOGIN,
            },
            {upsert: true}
        );
        // await Mailer.sendVerifyDeviceOtp(email, otp)

        throw new BadRequestError(
            'This device is unrecognised, an otp has been sent to your mail to verify the account'
        );
    }

    const accessToken = jwtHelper.generateToken({
        email,
        userId: userMail.user,
        type:  JwtType.USER,
        deviceId,
    });

    await UserTokenDb.updateOne(
        {email},
        {
            token: accessToken,
            email,
            user: userMail.user,
            deviceId,
        },
        {upsert: true}
    );


    const user = await UserDb.findOne<User>({email});

    return {
        token: accessToken,
        user: user!,
    };
}


export async function resendDeviceOtp(payload: resendOtp) {

    const {email, device} = payload


    const sentOtp = await UserVerDb.findOne({
        email,
        deviceId:device,
        type: OtpType.LOGIN,
        updatedAt: {$gte: Date.now() - 60000},
    });

    if (sentOtp) {
        throw new BadRequestError('Otp has been sent within the minute');
    }


    const otp = generateOtp();


    await UserVerDb.updateOne(
        {email},
        {
            email,
            otp,
            deviceId:device,
            type: OtpType.LOGIN,
        },
        {upsert: true}
    );
    // await Mailer.sendVerifyDeviceOtp(email, otp)

}

export async function VerifyDeviceOtp(body: VerifyOtpRequest): Promise<AuthResponse> {

    let {email} = body
    const {otp, device, trustDevice} = body
    email = email.toLowerCase()

    const existingVer = await UserVerDb.findOne({email, otp, type: OtpType.LOGIN})
    if (!existingVer) {
        throw new BadRequestError('Otp is incorrect')
    }

    const existingUserAuth = await UserAuthDb.findOne<UserAuth>({email})
    if (!existingUserAuth) {
        throw new NotFoundError('User not found')
    }
    if (trustDevice) {
        existingUserAuth.recognisedDevices.push(device)
        await existingUserAuth.save()
    }

    // send login token to the user
    const accessToken = jwtHelper.generateToken({
        email,
        deviceId:device,
        type: JwtType.USER,
        userId: existingUserAuth?.user
    })

    await UserTokenDb.updateOne({email, user: existingUserAuth.user}, {
        email,
        token: accessToken,
        user: existingUserAuth?.user,
        deviceId:device
    }, {upsert: true})

    const user = await UserDb.findById<User>(existingUserAuth.user)
    await existingVer.deleteOne();
    return {
        token: accessToken,
        user: user!
    }
}

export async function logout(userId: string): Promise<void> {
    await UserTokenDb.deleteMany({user: userId})
}


