export interface OtpRequest{
    email: string;
    device: string;
}

export interface VerifyOtpRequest{
    email:string;
    device:string;
    otp:number
    trustDevice?:boolean;
}


export interface resendOtp{
    email:string;
    device:string;
}

export interface SaveSignup{
    email:string;
    password:string;
    fullName:string;
    device:string;
}

export interface ResetPassword{
    password:string;
    email:string;
    device:string;
}

export interface LoginRequest {
    email: string;
    password: string;
    deviceId: string
}
