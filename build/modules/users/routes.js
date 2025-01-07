"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module users
 *
 * This file contains all the needed user module routes...
 */
const usersControllers_1 = require("./usersControllers");
const express_1 = require("express");
const checkRevokedTokensMiddleware_1 = __importDefault(require("../../middleware/checkRevokedTokensMiddleware"));
const userRouter = (0, express_1.Router)();
// GET...
userRouter.get('/', checkRevokedTokensMiddleware_1.default, usersControllers_1.getUserController);
userRouter.get('/doctors/', checkRevokedTokensMiddleware_1.default, usersControllers_1.getAllDoctorsController);
// PUT...
userRouter.put('/update/', checkRevokedTokensMiddleware_1.default, usersControllers_1.updateUserController);
userRouter.put('/update-office/', checkRevokedTokensMiddleware_1.default, usersControllers_1.updateAssignedOfficeController);
// PATCH
userRouter.patch('/update-password/', checkRevokedTokensMiddleware_1.default, usersControllers_1.updatePasswordController);
exports.default = userRouter;
