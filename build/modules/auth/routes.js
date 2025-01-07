"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module auth
 *
 * This file contains all the required routes for handle the endpoints of the auth module
 */
const express_1 = require("express");
const authControllers_1 = require("./authControllers");
const checkRevokedTokensMiddleware_1 = __importDefault(require("../../middleware/checkRevokedTokensMiddleware"));
const authRouter = (0, express_1.Router)();
// GET...
authRouter.get('/users-emails/', authControllers_1.getUsersController);
// POST...
authRouter.post('/login/', authControllers_1.loginController);
authRouter.post('/logout/', checkRevokedTokensMiddleware_1.default, authControllers_1.logoutController);
authRouter.post('/new-user/', authControllers_1.insertNewUserController);
authRouter.post('/recover-password/', authControllers_1.recoverdPasswordController);
authRouter.post('/refresh-token/', authControllers_1.refreshTokenController);
// PUT...
authRouter.put('/reset-forgoten-password/', authControllers_1.resetForgotenPasswordController);
exports.default = authRouter;
