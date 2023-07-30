import {Response} from "express";
import {JwtConfig} from "./types";
import {JwtType} from "../../interfaces/user/user.verfication";
import * as jwt from 'jsonwebtoken'
import {IExpressRequest} from "../../interfaces";
import {UserTokenDb} from "../../models/user/user.token";


interface GenerateTokenParam{
    email:string;
    userId:string;
    type:JwtType;
    deviceId:string,
    expiresIn:number

};


export class  JwtHelper{
    private configOption: JwtConfig;
    handleJsonResponse?: Function;
    UserTokenDb:any;



    constructor(configOption: JwtConfig) {
        this.configOption = configOption
        this.handleJsonResponse = configOption.handleJsonResponse
        this.UserTokenDb = configOption.UserTokendb
    }

    respondError(res:Response,code:number,message:string){
        if(this.handleJsonResponse){
            return this.handleJsonResponse(code,message)
        }
        res.status(403).json({error:true,message})
    }

    generateToken(body:GenerateTokenParam){
        const encryptionKey = Buffer.from(this.configOption.privateKey,'base64').toString()
        if(body.type === JwtType.NEW_USER){
            return jwt.sign(
                {
                    email:body.email,
                    deviceId:body.deviceId,
                    type:JwtType.NEW_USER
                },
                encryptionKey,
                {expiresIn: 60 * 60}
            )
        }
        if (body.type === JwtType.USER){
            return jwt.sign({
                email:body.email,
                deviceId:body.deviceId,
                type:JwtType.USER
            },
                encryptionKey,
                {expiresIn:'1w'}
            )
        }
        throw new Error('This type is not supported')
    }

    async verifyToken(token:string):Promise<GenerateTokenParam>{
        try{

            const result =  jwt.verify(
                token,
                Buffer.from(this.configOption.privateKey,'base64').toString()
            );
            return result as GenerateTokenParam

        }catch (error:any){
            console.error(error)
            throw{
                code:403,
                data:error
            }
        }
    }

    requirePermission(roleType:JwtType){
        return async (req:IExpressRequest,res:Response,next:Function)=>{
            const token = req.headers['x-auth-token']
            if(!token){
                return this.respondError(res,403,'No API token')
            }

            try{
                if (typeof(token) !== 'string' ){
                    return this.respondError(res,403,'Authtoken is not a valid string')
                }
                if(roleType === JwtType.USER){
                    const cacheKey = `glouse-token:${token}`
                    const cachedToken = await this.configOption.redisClient.get(cacheKey)
                    if(!cachedToken){
                        const dbToken = await UserTokenDb.findOne({token})
                        if (!dbToken) {
                            return this.respondError(res, 403, 'invalid token');
                        }

                    }else{
                        await  this.configOption.redisClient.set(
                            cacheKey,
                            60 * 60 *24 *7
                            //set to delete from cache after 30 days
                        )
                    }
                }
                const decoded = await  this.verifyToken(token)
                if(roleType != decoded.type){
                    return this.respondError(res,403,'Access denied')
                }
                req.email = decoded.email
                if(decoded.type === JwtType.USER){
                    req.userId = decoded.userId
                }else if(decoded.type === JwtType.NEW_USER){
                    req.email = decoded.email
                }else{
                    return this.respondError(res,403,'Invalid error')
                }

                return next()
            }catch (error:any){
                return this.respondError(res, 403, error);

            }
        }
    }
}

