import {User} from "./models";

export interface AuthResponse{
    user: User;
    token:string;

}