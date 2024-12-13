/**
 * @module auth
 *
 * This file contains all the required routes for handle the endpoints of the auth module
 */
import { Router } from "express";
import {
    getUsersController,
    insertNewUserController,
    loginController,
    logoutController,
    refreshTokenController,
    recoverdPasswordController,
    resetForgotenPasswordController
} from "./authControllers";
import checkRevokedToken from '../../middleware/checkRevokedTokensMiddleware';

const authRouter = Router();

// GET...
authRouter.get('/users-emails/', getUsersController);
// POST...
authRouter.post('/login/', loginController);
authRouter.post('/logout/', checkRevokedToken, logoutController);
authRouter.post('/new-user/', insertNewUserController);
authRouter.post('/recover-password/', recoverdPasswordController);
authRouter.post('/refresh-token/', refreshTokenController);
// PUT...
authRouter.put('/reset-forgoten-password/', resetForgotenPasswordController);

export default authRouter;