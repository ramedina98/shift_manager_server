/**
 * Here we load all the enviroment variables that we have,
 * and we do some required configurations...
 */
import dotenv from 'dotenv';

dotenv.config();

export const DEVELOPMENT = process.env.NODE_ENV === 'development';
export const TEST = process.env.NODE_ENV === 'test';
export const PRODUCTION = process.env.NODE_ENV === 'production';

export const SERVER = {
    SERVER_PORT: process.env.PORT_TS_SERVER!,
    JWT_KEY: process.env.JWT_SECRET_KEY!,
    JWT_TIME: process.env.JWT_TIME_SIGN!,
    JWT_RE_TIME: process.env.JWT_TIME_REFRESH!,
    EHOST: process.env.PUBLIC_HOST!,
    EUSER: process.env.PUBLIC_USER!,
    EPASS: process.env.PUBLIC_PASS!,
    FRONT_SERVER: process.env.FRONTEND_SERVER1!,
    FRONT_SERVER2: process.env.FRONTEND_SERVER2!,
    //REDIS ENVIROMENT VARIABLES...
    REDIS_LOCK_KEY: process.env.LOCK_KEY!,
    REDIS_LOCK_TIMEOUT: process.env.LOCK_TIMEOUT_MS!,
    REDIS_RETRY_INTERVAL: process.env.RETRY_INTERVAL_MS!,
    // REDIS CONECTION VARIABLES...
    RURL: process.env.REDIS_URL!,
};