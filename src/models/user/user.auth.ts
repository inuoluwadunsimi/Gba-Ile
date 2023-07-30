import * as mongoose from "mongoose";
import {Schema} from "mongoose";
import {config} from "../../constants/settings";
import {v4 as uuidv4} from 'uuid';
import {AuthType, UserAuth} from "../../interfaces/user/models";





const userAuth = new Schema<UserAuth>({

    _id:{
        type: String,
        default: function genUUID(){
            return uuidv4()
        }
    },
    email:{
        type: String,
        required: true,
        lowerCase: true,
    },
    password:{
        type: String,
    },
    user:{
        type:String,
        requiredPaths: true,
        ref: config.mongodb.collections.user

    },
    type:{
        type: String,
        enum: Object.values(AuthType),
        default: AuthType.EMAIL,

    },
    recognisedDevices: [
        {
            type: String,
            required: true,
        },
    ],




},{
    toObject: {
        transform(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            return ret;
        },
    },
    toJSON: {
        transform(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            return ret;
        },
    },
    timestamps: true,
    versionKey: false,
})

export const UserAuthDb = mongoose.model(config.mongodb.collections.userAuth,userAuth)