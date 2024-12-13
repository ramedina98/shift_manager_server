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
const authServices_1 = require("../modules/auth/authServices");
const config_1 = require("../config/config");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const checkRevokedToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ message: 'No token provided' });
        return;
    }
    try {
        // check if the token is in the revoked tokens table...
        const isRevoked = yield (0, authServices_1.checkIfTokenIsRevoked)(token);
        if (isRevoked) {
            res.status(403).json({ message: 'Sesión expirada.' });
            return;
        }
        // decode the token to retrieve the user information...
        const decoded = jsonwebtoken_1.default.verify(token, config_1.SERVER.JWT_KEY);
        req.user = decoded;
        next();
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            // El token ha expirado
            res.status(401).json({ message: 'Sesión expirada.' });
        }
        else {
            // Cualquier otro error de verificación
            res.status(403).json({ message: 'Invalid token' });
        }
    }
});
exports.default = checkRevokedToken;
