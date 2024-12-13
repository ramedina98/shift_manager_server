/**
 * @module users
 *
 * This file contains all the needed user module routes...
 */
import {
    getUserController,
    updateUserController,
    updatePasswordController,
    updateAssignedOfficeController,
    getAllDoctorsController
} from './usersControllers';
import { Router } from 'express';
import checkRevokedToken from '../../middleware/checkRevokedTokensMiddleware';

const userRouter = Router();

// GET...
userRouter.get('/', checkRevokedToken, getUserController);
userRouter.get('/doctors/', checkRevokedToken, getAllDoctorsController)
// PUT...
userRouter.put('/update/', checkRevokedToken, updateUserController);
userRouter.put('/update-office/', checkRevokedToken, updateAssignedOfficeController);
// PATCH
userRouter.patch('/update-password/', checkRevokedToken, updatePasswordController);

export default userRouter;