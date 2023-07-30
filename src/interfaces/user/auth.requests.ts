export interface SignupOtpRequest{
    email: string;
    device: string;
}

export interface VerifyOtpRequest{
    email:string;
    device:string;
    otp:number
}