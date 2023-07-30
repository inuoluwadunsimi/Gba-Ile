import {IExpressRequest} from "../interfaces";
import {Request,Response as ExpressResponse} from "express";
import * as ResponsManager  from '../helpers/response.manager'
import * as authService from '../services/auth'


export async function handleSignupOtpRequest(req:IExpressRequest,res:ExpressResponse):Promise<void>{
    const {email} = req.body
    const deviceId = req.headers['x-device-id']

    try{

        await authService.signupOtpRequest({
            email,
            device:<string>deviceId,
        })

        ResponsManager.success(res,{message:'Otp successfully sent '})

    }catch (err){
        ResponsManager.handleError(res,err)
    }
}

export async function handleVerifySignupOtp(req:IExpressRequest,res:ExpressResponse):Promise<void>{
    const deviceId = req.headers['x-device-id']
    const {email,otp} = req.body


    try{
        const token = await authService.verifySignupOtp({
            device:<string>deviceId,
            email,
            otp
        })

    }catch (err){
        ResponsManager.handleError(res,err)
    }

}