"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SERVER = exports.PRODUCTION = exports.TEST = exports.DEVELOPMENT = void 0;
/**
 * Here we load all the enviroment variables that we have,
 * and we do some required configurations...
 */
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.DEVELOPMENT = process.env.NODE_ENV === 'development';
exports.TEST = process.env.NODE_ENV === 'test';
exports.PRODUCTION = process.env.NODE_ENV === 'production';
exports.SERVER = {
    SERVER_PORT: process.env.PORT_TS_SERVER,
    JWT_KEY: process.env.JWT_SECRET_KEY,
    JWT_TIME: process.env.JWT_TIME_SIGN,
    JWT_RE_TIME: process.env.JWT_TIME_REFRESH,
    EHOST: process.env.PUBLIC_HOST,
    EUSER: process.env.PUBLIC_USER,
    EPASS: process.env.PUBLIC_PASS,
    FRONT_SERVER: process.env.FRONTEND_SERVER1,
    FRONT_SERVER2: process.env.FRONTEND_SERVER2,
    //REDIS ENVIROMENT VARIABLES...
    REDIS_LOCK_KEY: process.env.LOCK_KEY,
    REDIS_LOCK_TIMEOUT: process.env.LOCK_TIMEOUT_MS,
    REDIS_RETRY_INTERVAL: process.env.RETRY_INTERVAL_MS,
    // REDIS CONECTION VARIABLES...
    RURL: process.env.REDIS_URL,
};
