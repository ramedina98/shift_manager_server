export interface IJwtsLogin {
    accessToken: string;
    refreshToken: string;
}

export interface IRefreshTokens {
    id: number;
    id_user: string;
    token: string;
}