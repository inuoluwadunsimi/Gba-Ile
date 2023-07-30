export interface JwtConfig{
    privateKey:string;
    handleJsonResponse?: Function;
    UserTokendb:any;
    redisClient:any;
}