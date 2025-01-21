/**
 * @module auth
 *
 * In this file we can find the necessary functions for the auth services, with the following endpoints:
 *
 * 1.register
 * 2. login
 * 3. logout
 * 4. forgotpassword
 */
import { IUser, IUserNoId, IEmailUsername, UserDataFields, IUserDataFields } from "../../interfaces/IUser";
import { token, generateRefreshToken, recoveryToken, extractUserInfo, extractAllUserInfo } from "../../utils/authUtils";
import { IJwtsLogin, IRefreshTokens } from "../../interfaces/IJwt";
import { secureEmailtoShow } from "../../helpers/emailFormatHelpers";
import { SERVER } from "../../config/config";
import { webSocketMessage } from "../shiftManagement/shiftServices";
import EmailHandler from "../../classes/EmialHandler";
import prisma from "../../config/prismaClient";
import bcrypt from 'bcryptjs';
import logging from "../../config/logging";
import jwt from "jsonwebtoken";

/**
 * @method GET
 *
 * This function helps me to get all the user names, so I can use them in the frontend to
 * compare if the person who wants to make an account can use the username he/she enter or not...
 *
 * @returns success message || error message...
 */
const getUsers = async (): Promise<IEmailUsername | number> => {
    try {
        // make the query to the database...
        const user_result: IUser[] | null = await prisma.users.findMany();

        // create an array of just user_names...
        const user_name: string[] = user_result?.map(user => user.user_name) || [];
        // create an array of just emails...
        const email: string[] = user_result?.map(user => user.email) || [];

        // if there are not any username and email, return a number of error...
        if(user_name.length === 0 && email.length === 0){
            logging.warning('No data found.')
            return 400;
        }

        // retorn the data...
        return {
            user_name,
            email
        }

    } catch (error: any) {
        logging.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
}

/**
 * @method POST
 *
 * In the Form must be check the size of the string of each input, being the following:
 * @nombre1 150
 * @nombre2 150
 * @apellido1 150
 * @apellido2 150
 * @user_name 200
 * @password 255
 * @foto blob
 *
 * @param request
 * @returns NextResponse
 *
 * You have to keep this in mind: From the frontedn you have to validate that the user name and email
 * are not the same as an existing user name and email of another user..
 */
const insertNewUser = async (new_user: IUserNoId): Promise<string | number> => {

    // first lets check if the user is not already registerd...
    const userExist: IUser | null = await prisma.users.findFirst({
        where: {
            nombre1: new_user.nombre1,
            nombre2: new_user.nombre2,
            apellido1: new_user.apellido1,
            apellido2: new_user.apellido2
        }
    });

    // if the user already exist, they can create a new user, let the client knows...
    if(userExist){
        logging.warning('She/he has an account');
        return 406;
    }

    // passwrod encryption...
    const encryptedPassword: string = await bcrypt.hash(new_user.password, 10);

    // storage the data into the database...
    try {
        // storage the data and wait to get the register done...
        const response: IUser = await prisma.users.create({
            data: {
                nombre1: new_user.nombre1,
                nombre2: new_user.nombre2,
                apellido1: new_user.apellido1,
                apellido2: new_user.apellido2,
                email: new_user.email,
                user_name: new_user.user_name,
                password: encryptedPassword,
                type: new_user.type
            },
        });

        // send a json to the front...
        return `${response.nombre1} ${response.apellido1} su registro a quedado exitosamente.`
    } catch (error: any) {
        // handle errors...
        logging.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
}

/**
 * @method POST
 *
 * This function is vital to make the login, here it will verify that the user_name and password
 * match, and a JWT will be generate to be able to track the session in that way..
 *
 * @param {password, user_name}
 * @returns jwt
 */
const login = async (username: string, password: string): Promise<IJwtsLogin | number> => {
    try {
        // make the query to search the user by its username...
        const user: IUser | null = await prisma.users.findFirst({
            where: {
                user_name: username,
            },
        });

        if(!user){
            logging.error('User name incorrect.');
            return 404;
        }

        // compare the hashed password...
        const isPasswordValid: boolean = await bcrypt.compare(password, user.password);
        if(!isPasswordValid){
            logging.error('Password incorrect.');
            return 402;
        }

        // create the access token...
        const accessToken: string = token(user, SERVER.JWT_TIME);
        // create the refresh token...
        const refreshToken: string = await generateRefreshToken(user);

        // send the response...
        return {
            accessToken,
            refreshToken
        }

    } catch (error: any) {
        logging.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
}

// This function helps me to delete a register if the user logout without finish the consultation...
const endAConsultatio = async (id_user: string): Promise<void> => {
    try {
        const asignado = await prisma.asignacion.findFirst({
            where: {
                id_doc: id_user
            },
            orderBy: {
                create_at: 'desc'
            }
        });

        if(asignado){
            const [_asignacion, consulta] = await Promise.all([
                prisma.asignacion.delete({
                    where: {
                        id_asignacion: asignado.id_asignacion
                    }
                }),
                prisma.consulta.delete({
                    where: {
                        id_consulta: asignado.id_consulta
                    }
                })
            ]);

            // check if the patient had an apointment...
            if(consulta.citado){
                await prisma.citados.delete({
                    where: {
                        id_consulta: consulta.id_consulta
                    }
                });
            }

            const title: string = `Turno ${consulta.turno} terminado`;
            const message: string = `${consulta.nombre_paciente} gracias por tu preferencia, esperamos verte pronto.`
            await webSocketMessage(title, message, null, 3);
        }
    } catch (error: any) {
        logging.error("Algo salio mal: " + error.message);
    }
}
/**
 * @method POST
 *
 * This service feature helps me to logout of the session, enter the token in a list
 * of revoked tokens and more securely keep track of app sessions...
 *
 * @param token
 */
const logout = async (token: string): Promise<number>=> {
    try {
        // decode the token to retrieve the id_user...
        const decodedToken: IUserDataFields | null = extractAllUserInfo(token);

        if(decodedToken === null){
            logging.warning('Token expirado o incorrecto.');
            return 400;
        }

        const id_user: string = decodedToken.id_user;
        const rol: string = decodedToken.type;

        // insert the token into the revoked_tokens table...
        await prisma.revoked_tokens.create({
            data: {
                token,
                user_id: id_user
            },
        });

        if(rol.toLowerCase() === "medico"){
            await endAConsultatio(id_user);
        }

        logging.info(`Sesión cerrada.`);

        return 201;
    } catch (error: any) {
        logging.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
}

/**
 * @method GET
 *
 * This service handle the search of a token in the revoked_tokens table,
 * it recive a token and search for it in the database,
 *
 * @param token
 */
const checkIfTokenIsRevoked = async (token: string): Promise<boolean> => {
    const revokedToken: any = await prisma.revoked_tokens.findFirst({
        where: { token },
    });

    // returns true if token has been revoked, false otherwise...
    return revokedToken !== null;
}

/**
 * @method DELETE
 *
 * This services handle the process of delete the refreshToken, when the user logout
 * from the app...
 *
 * @param token
 */
const deleteRefreshToken = async (token: string): Promise<void> => {
    try {
        // first, looking for the token register...
        const token_record: IRefreshTokens | null = await prisma.refresh_tokens.findFirst({
            where: { token: token }
        });

        if(token_record === null) throw new Error("Refresh token does not exist.");

        // eliminate the token...
        await prisma.refresh_tokens.delete({
            where: {id: token_record.id }
        });

    } catch (error: any) {
        logging.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
}

/**
 * @method POST
 *
 * This service handle the process to renew the sesion token...
 */
const refreshToken = async (reToken: string): Promise<string| number> => {
    try {
        // search the token in the table...
        const storedToken: IRefreshTokens | null = await prisma.refresh_tokens.findFirst({
            where: { token: reToken }
        });

        if(!storedToken){
            logging.warning('El token no es valido o ha sido revocado.');
            return 404;
        }

        // extract the user data from the refresh token...
        const user_data: any = jwt.verify(reToken, SERVER.JWT_KEY);

        if(!user_data){
            logging.error('Error decoding the JWT.');
            return 403;
        }

        // Create a new token access...
        const newAccessToken: string = token(user_data, SERVER.JWT_TIME);

        // return the token...
        return newAccessToken;
    } catch (error: any) {
        logging.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.mesage}`);
    }
}

/**
 * @method POST
 *
 * This function helps me to recover a password, sending to the registered email the additional password,
 * which will be valid for a certain period of time...
 *
 * @param user_name
 */
const recoverdPassword = async (user_name: string): Promise<string | number> => {
    try {
        const user: IUser | null = await prisma.users.findFirst({
            where: {
                user_name
            }
        });

        // if the user does not exist let the client knows...
        if(!user){
            logging.warning('Usuario no encontrado');
            return 422;
        }

        // create the token...
        const token: string = recoveryToken(user.id_user);

        let subject = 'Recuperación de contraseña - Hospital San Jose, de los ojos.';
        // Mensaje padre
        let message = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Recuperación de Contraseña</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        color: #8399b0;
                        line-height: 1.6;
                    }
                    .container {
                        max-width: 600px;
                        margin: auto;
                        padding: 20px;
                        border: 1px solid #dddddd;
                        border-radius: 5px;
                        background-color: #c8d3de;
                        shadow: 1px 1px 0pxrgba(20, 20, 20, 0.2);
                    }
                    .header {
                        text-align: center;
                    }
                    .recovery-code {
                        color: #1d3245;
                        font-weight: bold;
                    }
                    .footer {
                        margin-top: 20px;
                        text-align: center;
                        font-size: 0.9em;
                        color:rgb(53, 70, 90);
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h3>Estimado/a ${user.nombre1} ${user.apellido1}</h3>
                    </div>
                    <p>Por medio de este mensaje, le informamos que ha solicitado la recuperación de su contraseña.</p>
                    <p>Este es su código de recuperación de contraseña: <span class="recovery-code">${token}</span></p>
                    <p>Copie el código de recuperación, regrese a la vista de recuperación de cuenta e ingréselo. Una vez hecho eso, será dirigido a la zona de cambio de contraseña.</p>
                    <p>Si no ha solicitado este cambio, por favor ignore este mensaje.</p>
                    <p>Agradecemos su atención y quedamos a su disposición para cualquier consulta adicional.</p>
                    <div class="footer">
                        <p>Saludos cordiales,</p>
                        <p>Gestor de turnos,<br><span class="recovery-code">Hospital San Jose, de los ojos</span></p>
                    </div>
                </div>
            </body>
            </html>
        `;

        try {
            const email = new EmailHandler(user.email, subject, message);
            // send the message...
            await email.emailSending();

            // format the email to display it in safe mode...
            const formattedEmail: string | number = secureEmailtoShow(user.email);

            /**
             * we check what was the type of answer, if it was 1 a diferent mesage is assigned to
             * the one that could be if we get a string...
            */
            const ms = formattedEmail === 1
                ? `${user.user_name}, se le ha enviado un código de recuperación a su email registrado.`
                : `${user.user_name}, se le ha mandado a su correo ${formattedEmail} un código de verificación.`;

            // return the message...
            return ms;

        } catch (error: any) {
            logging.error(`Error: ${error.message}`);
            throw new Error(`Error: ${error.message}`);
        }
    } catch (error: any) {
        logging.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
}

/**
 * @method PUT
 *
 * Password reset service...
 *
 * @param { Token, newPassword }
 */
const resetForgotenPassword = async (token: string, newPass: string): Promise<string | number> => {
    try {
        // decode the token...
        const decoded: string | null = extractUserInfo(token, UserDataFields.ID_USER);

        if(decoded === null){
            logging.warning('Token expirado o usuario incorrecto')
            return 400;
        }

        // extract the id...
        const id: string = decoded;
        // process the new password...
        const hashedPassword: string = await bcrypt.hash(newPass, 10);

        // update the password in the database...
        await prisma.users.update({
            where: { id_user: id },
            data: { password: hashedPassword }
        });

        // mark token as expired when setting inmediate expiration...
        jwt.sign(
            { id_user: id},
            SERVER.JWT_KEY,
            { expiresIn: '1S' }
        );

        return 'Su contraseña a sido actualizada correctamente.'

    } catch (error: any) {
        logging.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
}

export {
    getUsers,
    checkIfTokenIsRevoked,
    insertNewUser,
    login,
    logout,
    deleteRefreshToken,
    refreshToken,
    recoverdPassword,
    resetForgotenPassword
};