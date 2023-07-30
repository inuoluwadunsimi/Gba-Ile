import {Document} from "mongoose";

export interface UserAuth extends Document {
    id: string;
    email: string;
    password: string;
    user: string;
    type: string;
    recognisedDevices: string[];
    createdAt: string;
    updatedAt: string;

}

export interface UserToken extends  Document{
    id: string;
    token: string;
    email: string;
    user: string;
    deviceId: string;
    createdAt: string;
    updatedAt: string;
}

export interface UserVer extends Document{
    id: string;
    email: string;
    otp:number;
    deviceId: string;
    type: string;
    expiresAt:Date
    createdAt: string;
    updatedAt: string;

}

export interface  User extends Document{
    id: string
    email: string
    fullName:string;
    userName:string
    avatar: string
    updatedAt: string

}

export enum AuthType {
    EMAIL = 'email',
    GOOGLE = 'google',
}
