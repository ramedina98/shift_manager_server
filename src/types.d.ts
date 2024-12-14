/**
 * We define the enviroment variables here to let TS knows that they have to be define...
 */
import express from 'express';
import { IUserDataFields } from './interfaces/IUser';
declare namespace NodeJS{
    interface ProcessEnv{
        PORT_TS_SERVER: string;
        JWT_SECRET_KEY: string;
        PUBLIC_HOST: string;
        PUBLIC_USER: string;
        PUBLIC_PASS: string;
        JWT_TIME_SIGN: string;
        JWT_TIME_REFRESH: string;
        FRONTEND_SERVER1: string;
        FRONTEND_SERVER2: string;
    }
}

declare global {
    namespace Express {
        export interface Request {
            user: IUserDataFields;
        }
    }
}