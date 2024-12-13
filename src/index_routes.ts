/**
 * @routes
 *
 * This file contains all the necessary routes for the management of all
 * the api endpoints. This way I have a correct order of all of them...
 */
import authRouter from "./modules/auth/routes";
import userRouter from "./modules/users/routes";
import shiftRouter from "./modules/shiftManagement/routes";

export default function allRoutes(app: any){
    // auth routes...
    app.use('/auth', authRouter);
    // user routes...
    app.use('/user', userRouter);
    // shift routes...
    app.use('/shifts', shiftRouter);
}