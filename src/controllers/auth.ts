import {IExpressRequest} from "../interfaces";
import {Request,Response as ExpressResponse} from "express";
import * as ResponseManager  from '../helpers/response.manager'
import * as authService from '../services/auth'


export async function handleSignupOtpRequest(req:IExpressRequest,res:ExpressResponse):Promise<void>{
    const {email} = req.body
    const device = req.headers['x-device-id']

    try{

        await authService.signupOtpRequest({
            email,
            device:<string>device,
        })

        ResponseManager.success(res,{message:'Otp successfully sent '})

    }catch (err){
        ResponseManager.handleError(res,err)
    }
}

export async function handleVerifySignupOtp(req:IExpressRequest,res:ExpressResponse):Promise<void>{
    const device = req.headers['x-device-id']
    const {email,otp} = req.body


    try{
        const token = await authService.verifySignupOtp({
            device:<string>device,
            email,
            otp
        })

        ResponseManager.success(res,{token})

    }catch (err){
        ResponseManager.handleError(res,err)
    }

}

export async function handleSaveSignupDetails(req:IExpressRequest,res:ExpressResponse):Promise<void>{

    const {fullName,password} = req.body
    const device = req.headers['x-device-id']
    let email = req.email!
    email = email.toLowerCase()

    try{
        const token = await authService.saveSignupDetails({
            fullName,
            email,
            password,
            device: <string> device
        })
        ResponseManager.success(res,{token})
    }catch(err){
        ResponseManager.handleError(res,err)

    }

}


export async function handleForgotPasswordOtpRequest(req:IExpressRequest,res:ExpressResponse):Promise<void>{
    const {email} = req.body
    const device = req.headers['x-device-id']

    try{
        await authService.forgotPasswordRequest({
            email,
            device:<string>device
        })
      ResponseManager.success(res,{message:'Otp successfully sent'})

    }catch(err){
        ResponseManager.handleError(res,err)
    }

}

export async function handleForgotPasswordOtpVerify(req:IExpressRequest,res:ExpressResponse):Promise<void>{
    const device = req.headers['x-device-id']
    const {email,otp} = req.body

    try{
        const token = await authService.forgotPasswordOtpVerify({
            email,
            otp,
            device:<string>device
        })
        ResponseManager.success(res,{token})

    }catch (err){
        ResponseManager.handleError(res,err)
    }

}

export async function handleResetPassword(req:IExpressRequest,res:ExpressResponse){
    const {password} = req.body
    const device = req.headers['x-device-id']
    const email = req.email!

    try{
        const token = await authService.resetPassword({
            email,
            password,
            device:<string>device
        })

        ResponseManager.success(res,{token})


    }catch(err){
        ResponseManager.handleError(res,err)
    }
}

export async function handleLogin(
    req: IExpressRequest,
    res: ExpressResponse
): Promise<void> {
    const {email, password} = req.body;
    const deviceId = req.headers['x-device-id'];

    try {
        const result = await authService.Login({
            email,
            password,
            deviceId: <string>deviceId
        });
        ResponseManager.success(res, {result})
    } catch (err: any) {
        ResponseManager.handleError(res, err);
    }
}

export async function handleVerifyDeviceOtp(req: IExpressRequest, res: ExpressResponse): Promise<void> {

    const deviceId = req.headers['x-device-id']
    const {otp, email, trustDevice} = req.body

    try {

        const result = await authService.VerifyDeviceOtp({
            otp,
            email,
            device: <string>deviceId,
            trustDevice
        })

        ResponseManager.success(res, {result})
    } catch (err: any) {
        ResponseManager.handleError(res, err)
    }


}


export async function handleResendVerifyDeviceOtp(req: IExpressRequest, res: ExpressResponse) {
    const {email} = req.body
    const deviceId = req.headers['x-device-id']

    try {

        await authService.resendDeviceOtp({email, device: <string>deviceId})

        ResponseManager.success(res, {message: "otp successfully sent"})

    } catch (err) {
        ResponseManager.handleError(res, err)
    }
}


export async function handleLogout(req: IExpressRequest, res: ExpressResponse): Promise<void> {
    const userId = req.userId!
    try {
        await authService.logout(userId)

        ResponseManager.success(res, {message: 'Successfully logged out'})

    } catch (err) {
        ResponseManager.handleError(res, err)
    }
}