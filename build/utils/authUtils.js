"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractAllUserInfo = exports.extractUserInfo = exports.recoveryToken = exports.generateRefreshToken = exports.token = void 0;
const config_1 = require("../config/config");
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// this function helps me creating jwt's...
const token = (user, duration_time) => {
    return jsonwebtoken_1.default.sign({
        id_user: user.id_user,
        user_name: user.user_name,
        nombre: user.nombre1,
        apellido: user.apellido1,
        type: user.type
    }, config_1.SERVER.JWT_KEY, { expiresIn: duration_time });
};
exports.token = token;
// refresh token...
const generateRefreshToken = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const refreshToken = token(user, config_1.SERVER.JWT_RE_TIME);
    // storage the refresh token...
    yield prismaClient_1.default.refresh_tokens.create({
        data: {
            id_user: user.id_user,
            token: refreshToken
        }
    });
    return refreshToken;
});
exports.generateRefreshToken = generateRefreshToken;
const recoveryToken = (id) => {
    return jsonwebtoken_1.default.sign({
        id_user: id
    }, config_1.SERVER.JWT_KEY, { expiresIn: '2m' });
};
exports.recoveryToken = recoveryToken;
const extractUserInfo = (token, field) => {
    try {
        // verify and decodify the token...
        const decoded = jsonwebtoken_1.default.verify(token, config_1.SERVER.JWT_KEY);
        // returns the required data...
        return decoded[field] || null;
    }
    catch (error) {
        console.log(`Error al decodificar el token: ${error.message}`);
        return null;
    }
};
exports.extractUserInfo = extractUserInfo;
const extractAllUserInfo = (token) => {
    try {
        // verify and decodify the token...
        const decoded = jsonwebtoken_1.default.verify(token, config_1.SERVER.JWT_KEY);
        // returns the required data...
        return decoded;
    }
    catch (error) {
        console.log(`Error al decodificar el token: ${error.message}`);
        return null;
    }
};
exports.extractAllUserInfo = extractAllUserInfo;
