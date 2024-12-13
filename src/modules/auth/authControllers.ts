/**
 * @module auth
 *
 * This file contains all the required controllers to handle all the process of the
 * auth module:
 *
 * 1. Register a new user
 * 2. Login
 * 3. Logout
 * 4. Forgot Password
 */
import { Request, Response } from "express";
import { IEmailUsername, ISissionData, IUser, IUserNoId } from "../../interfaces/IUser";
import { IJwtsLogin } from "../../interfaces/IJwt";
import { createCsvDailyReport } from "../users/usersServices";
import { officeAssignment, removeAssignedOffice } from "../users/usersServices";
import {
    getUsers,
    insertNewUser,
    login,
    logout,
    deleteRefreshToken,
    refreshToken,
    recoverdPassword,
    resetForgotenPassword
} from "./authServices";
import prisma from "../../config/prismaClient";

/**
 * @method GET
 *
 * This controller helps me to handle the process of retrieve user_names and emails, in order to verify
 * in the frontend form that these fields are not duplicated in any other
 * record. The users are uniqued and you can only make an account once
 * with an email address...
 *
 * @returns {IEmailUsername}
 */
const getUsersController = async (_req: Request, res: Response): Promise<any> => {
    try {
        const usersAndEmails: IEmailUsername | number= await getUsers();

        if(usersAndEmails === 400){
            return res.status(usersAndEmails).json({
                message: 'Data not found.'
            });
        }

        return res.status(200).json({
            returnmessage: 'Data obtained successfully.',
            usersAndEmails
        });

    } catch (error: any) {
        return res.status(500).json({
            error: `Internal server error: ${error.message}`
        });
    }
}

/**
 * @method POST
 *
 * This controller handle the process of register a new user in the data base...
 *
 * @param req.boyd {IuserNoId}
 * @returns {Response.json}
 */
const insertNewUserController = async (req: Request, res: Response): Promise<any> => {
    // destructuring the req.boyd to retrieve the user data...
    const { new_user }: { new_user: IUserNoId } = req.body;

    // check if the data was provied...
    if(!new_user){
        return res.status(422).json({
            message: 'Data no provied.'
        });
    }

    try {
        // send the data to the services to start the process of storage them...
        const result: string | number = await insertNewUser(new_user);

        // if the return is 200, that means that the user has an acount...
        if(result === 406){
            return res.status(result).json({
                message: 'Ya tienes una cuenta activa.'
            });
        }

        // response with a message of success...
        return res.status(201).json({
            message: result
        });

    } catch (error: any) {
        return res.status(500).json({
            error: `Internal server error: ${error.message}`
        });
    }
}

/**
 * @method POST
 *
 * This controller helps me to manage the login process, validate the password and get
 * a JWT for session management if the provied credentials are correct...
 *
 * @param req.body
 * @returns { Response.json }
 */
const loginController = async (req: Request, res: Response): Promise<any> => {
    // deconstruting the req.body to retrieve the data...
    const { session_data, num_consultorio }: { session_data: ISissionData, num_consultorio: number} = req.body;

    // check if the data was sent or not...
    if(!session_data){
        return res.status(422).json({
            message: 'No credentials provied.'
        });
    }

    try {
        // first deconstruct the session_data object...
        const { user_name, password } = session_data;

        // send the data to the service...
        const result: IJwtsLogin | number = await login(user_name, password);

        // handling the error codes (404, 401)
        if(typeof result === 'number'){
            let message = '';

            if(result === 404){
                message = 'Usuario incorrecto.'
            } else if(result === 401){
                message = 'Contraseña incorrecta.'
            }

            return res.status(result).json({
                error: message
            });
        } else{
            const response: IUser | null = await prisma.users.findFirst({ where: { user_name } });

            if(!response){
                return res.status(404).json({ error: 'Usuario no encontrado. '});
            }

            let id_asig_consul:  any;
            if(response.type.toLowerCase() === 'medico') {
                id_asig_consul = await officeAssignment(response.id_user, num_consultorio);
            }

            if(typeof id_asig_consul === 'number'){
                return res.status(400).json({ error: 'Consultorio ocupado, verifique bien el numero de consultorio en el que esta.'})
            }


            res.cookie('refreshToken', result.refreshToken, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 });
            res.status(200).json({
                message: 'Inicio de sesión exitoso',
                accessToken: result.accessToken,
                id_asig_consul
            });
        }

    } catch (error: any) {
        return res.status(500).json({
            error: `Internal server error: ${error.message}`
        })
    }
}

/**
 * @method POST
 *
 * This controller handle the insertion of tokens into the revokd_tokens table and the
 * logout...
 */
const logoutController = async (req: Request, res: Response): Promise<any> => {
    const authHeader: string | undefined = req.headers.authorization;
    const token: string | undefined = authHeader && authHeader.split(' ')[1];
    const reToken: string = req.cookies.refreshToken;
    const user_data = req.user;
    const {id_asig_consul}: {id_asig_consul: string | undefined} = req.body;

    if(token === undefined){
        return res.status(401).json({
            message: 'Token no provied.'
        });
    }

    if(!reToken){
        return res.status(404).json({ message: 'Refresh token not provided.'});
    }

    try {
        // logout service...
        const result: number = await logout(token);
        // delete the refresh token from the refresh_tokens table...
        await deleteRefreshToken(reToken);

        if(result === 400){
            return res.status(result).json({
                error: 'Token expirado o incorrecto.'
            });
        }

        // create the csv reporte...
        await createCsvDailyReport(user_data.id_user, `${user_data.nombre} ${user_data.apellido}`);
        if(id_asig_consul && id_asig_consul !== 'undefined'){
            // delete de assigned_office register...
            await removeAssignedOffice(id_asig_consul);
        }

        // clean the cooki of refresh token...
        res.clearCookie('refreshToken');
        res.status(result).json({
            message: 'Cerrando sesión.'
        });

    } catch (error: any) {
        return res.status(500).json({
            error: `Internal server error: ${error.message}`
        })
    }
}

/**
 * @method POST
 *
 * This controller hendle the process of create a new access token using the
 * refresh token to validate the user...
 */
const refreshTokenController = async (req: Request, res: Response): Promise<any> => {
    const reToken: string = req.cookies.refreshToken;

    // check if the token has been providing...
    if(!reToken) return res.status(401).json({ message: 'Token no provided.' });

    try {
        // start the process of the new access token...
        const result: string | number = await refreshToken(reToken);

        if(typeof result === 'number'){
            let message: string = '';

            if(result === 404){
                message = 'El token no es valido o ha sido revocado.';
            } else if(result === 403){
                message = 'Error decoding the JWT.';
            }

            return res.status(result).json({ message });
        }

        return res.status(201).json({
            message: 'Token creado con exito.',
            token: result
        });
    } catch (error: any) {
        return res.status(500).json({
            error: `Internal server error: ${error.message}`
        });
    }
}

/**
 * @method POST
 *
 * This controller handles the process of send an email with a token to recover the password forgoten...
 */
const recoverdPasswordController = async (req: Request, res: Response): Promise<any> => {
    // decunstructing the req.body to retrieve the user_name...
    const { user_name }: { user_name: string } = req.body;

    if(!user_name){
        return res.status(404).json({
            message: 'Data no provied.'
        });
    }

    try {
        const result: string | number = await recoverdPassword(user_name);

        if(result === 422){
            return res.status(result).json({
                message: `El usuario "${user_name}" no fu encontrado.`
            });
        }

        return res.status(200).json({
            message: result
        });

    } catch (error: any) {
        return res.status(500).json({
            error: `Internal server error: ${error.message}`
        });
    }
}

/**
 * @method PUT
 *
 * This controller handle the process of reset a forgoten password...
 *
 * @param req.body
 * @returns res.json()
 */
const resetForgotenPasswordController = async (req: Request, res: Response): Promise<any> => {
    // deconstruting the req.body to retrieve the token and the new Password...
    const { token, newPass }: { token: string, newPass: string } = req.body;

    if(!token || !newPass){
        return res.status(404).json({
            message: 'Token or password not provied.',
            token,
            newPass
        });
    }

    try {
        const result: string | number = await resetForgotenPassword(token, newPass);

        if(result === 400){
            return res.status(400).json({
                message: 'Token expirado o usuario incorrecto'
            });
        }

        return res.status(200).json({
            message: result
        });

    } catch (error: any) {
        return res.status(500).json({
            error: `Internal server error: ${error.message}`
        })
    }
}

export { getUsersController, insertNewUserController, loginController, logoutController, refreshTokenController, recoverdPasswordController, resetForgotenPasswordController };