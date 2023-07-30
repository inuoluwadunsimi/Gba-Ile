import * as randomString from 'randomstring'


export function generateOtp():string{
    return randomString.generate({
        length:6,
        charset:"numeric"
    })
}