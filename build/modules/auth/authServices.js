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
exports.resetForgotenPassword = exports.recoverdPassword = exports.refreshToken = exports.deleteRefreshToken = exports.logout = exports.login = exports.insertNewUser = exports.checkIfTokenIsRevoked = exports.getUsers = void 0;
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
const IUser_1 = require("../../interfaces/IUser");
const authUtils_1 = require("../../utils/authUtils");
const emailFormatHelpers_1 = require("../../helpers/emailFormatHelpers");
const config_1 = require("../../config/config");
const shiftServices_1 = require("../shiftManagement/shiftServices");
const EmialHandler_1 = __importDefault(require("../../classes/EmialHandler"));
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const logging_1 = __importDefault(require("../../config/logging"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * @method GET
 *
 * This function helps me to get all the user names, so I can use them in the frontend to
 * compare if the person who wants to make an account can use the username he/she enter or not...
 *
 * @returns success message || error message...
 */
const getUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // make the query to the database...
        const user_result = yield prismaClient_1.default.users.findMany();
        // create an array of just user_names...
        const user_name = (user_result === null || user_result === void 0 ? void 0 : user_result.map(user => user.user_name)) || [];
        // create an array of just emails...
        const email = (user_result === null || user_result === void 0 ? void 0 : user_result.map(user => user.email)) || [];
        // if there are not any username and email, return a number of error...
        if (user_name.length === 0 && email.length === 0) {
            logging_1.default.warning('No data found.');
            return 400;
        }
        // retorn the data...
        return {
            user_name,
            email
        };
    }
    catch (error) {
        logging_1.default.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
});
exports.getUsers = getUsers;
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
const insertNewUser = (new_user) => __awaiter(void 0, void 0, void 0, function* () {
    // first lets check if the user is not already registerd...
    const userExist = yield prismaClient_1.default.users.findFirst({
        where: {
            nombre1: new_user.nombre1,
            nombre2: new_user.nombre2,
            apellido1: new_user.apellido1,
            apellido2: new_user.apellido2
        }
    });
    // if the user already exist, they can create a new user, let the client knows...
    if (userExist) {
        logging_1.default.warning('She/he has an account');
        return 406;
    }
    // passwrod encryption...
    const encryptedPassword = yield bcrypt_1.default.hash(new_user.password, 10);
    // storage the data into the database...
    try {
        // storage the data and wait to get the register done...
        const response = yield prismaClient_1.default.users.create({
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
        return `${response.nombre1} ${response.apellido1} su registro a quedado exitosamente.`;
    }
    catch (error) {
        // handle errors...
        logging_1.default.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
});
exports.insertNewUser = insertNewUser;
/**
 * @method POST
 *
 * This function is vital to make the login, here it will verify that the user_name and password
 * match, and a JWT will be generate to be able to track the session in that way..
 *
 * @param {password, user_name}
 * @returns jwt
 */
const login = (username, password) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // make the query to search the user by its username...
        const user = yield prismaClient_1.default.users.findFirst({
            where: {
                user_name: username,
            },
        });
        if (!user) {
            logging_1.default.error('User name incorrect.');
            return 404;
        }
        // compare the hashed password...
        const isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            logging_1.default.error('Password incorrect.');
            return 401;
        }
        // create the access token...
        const accessToken = (0, authUtils_1.token)(user, config_1.SERVER.JWT_TIME);
        // create the refresh token...
        const refreshToken = yield (0, authUtils_1.generateRefreshToken)(user);
        // send the response...
        return {
            accessToken,
            refreshToken
        };
    }
    catch (error) {
        logging_1.default.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
});
exports.login = login;
// This function helps me to delete a register if the user logout without finish the consultation...
const endAConsultatio = (id_user) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const asignado = yield prismaClient_1.default.asignacion.findFirst({
            where: {
                id_doc: id_user
            },
            orderBy: {
                create_at: 'desc'
            }
        });
        if (asignado) {
            const [_asignacion, consulta] = yield Promise.all([
                prismaClient_1.default.asignacion.delete({
                    where: {
                        id_asignacion: asignado.id_asignacion
                    }
                }),
                prismaClient_1.default.consulta.delete({
                    where: {
                        id_consulta: asignado.id_consulta
                    }
                })
            ]);
            // check if the patient had an apointment...
            if (consulta.citado) {
                yield prismaClient_1.default.citados.delete({
                    where: {
                        id_consulta: consulta.id_consulta
                    }
                });
            }
            const title = `Turno ${consulta.turno} terminado`;
            const message = `${consulta.nombre_paciente} gracias por tu preferencia, esperamos verte pronto.`;
            yield (0, shiftServices_1.webSocketMessage)(title, message, null, 3);
        }
    }
    catch (error) {
        logging_1.default.error("Algo salio mal: " + error.message);
    }
});
/**
 * @method POST
 *
 * This service feature helps me to logout of the session, enter the token in a list
 * of revoked tokens and more securely keep track of app sessions...
 *
 * @param token
 */
const logout = (token) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // decode the token to retrieve the id_user...
        const decodedToken = (0, authUtils_1.extractAllUserInfo)(token);
        if (decodedToken === null) {
            logging_1.default.warning('Token expirado o incorrecto.');
            return 400;
        }
        const id_user = decodedToken.id_user;
        const rol = decodedToken.type;
        // insert the token into the revoked_tokens table...
        yield prismaClient_1.default.revoked_tokens.create({
            data: {
                token,
                user_id: id_user
            },
        });
        if (rol.toLowerCase() === "medico") {
            yield endAConsultatio(id_user);
        }
        logging_1.default.info(`Sesión cerrada.`);
        return 201;
    }
    catch (error) {
        logging_1.default.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
});
exports.logout = logout;
/**
 * @method GET
 *
 * This service handle the search of a token in the revoked_tokens table,
 * it recive a token and search for it in the database,
 *
 * @param token
 */
const checkIfTokenIsRevoked = (token) => __awaiter(void 0, void 0, void 0, function* () {
    const revokedToken = yield prismaClient_1.default.revoked_tokens.findFirst({
        where: { token },
    });
    // returns true if token has been revoked, false otherwise...
    return revokedToken !== null;
});
exports.checkIfTokenIsRevoked = checkIfTokenIsRevoked;
/**
 * @method DELETE
 *
 * This services handle the process of delete the refreshToken, when the user logout
 * from the app...
 *
 * @param token
 */
const deleteRefreshToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // first, looking for the token register...
        const token_record = yield prismaClient_1.default.refresh_tokens.findFirst({
            where: { token: token }
        });
        if (token_record === null)
            throw new Error("Refresh token does not exist.");
        // eliminate the token...
        yield prismaClient_1.default.refresh_tokens.delete({
            where: { id: token_record.id }
        });
    }
    catch (error) {
        logging_1.default.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
});
exports.deleteRefreshToken = deleteRefreshToken;
/**
 * @method POST
 *
 * This service handle the process to renew the sesion token...
 */
const refreshToken = (reToken) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // search the token in the table...
        const storedToken = yield prismaClient_1.default.refresh_tokens.findFirst({
            where: { token: reToken }
        });
        if (!storedToken) {
            logging_1.default.warning('El token no es valido o ha sido revocado.');
            return 404;
        }
        // extract the user data from the refresh token...
        const user_data = jsonwebtoken_1.default.verify(reToken, config_1.SERVER.JWT_KEY);
        if (!user_data) {
            logging_1.default.error('Error decoding the JWT.');
            return 403;
        }
        // Create a new token access...
        const newAccessToken = (0, authUtils_1.token)(user_data, config_1.SERVER.JWT_TIME);
        // return the token...
        return newAccessToken;
    }
    catch (error) {
        logging_1.default.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.mesage}`);
    }
});
exports.refreshToken = refreshToken;
/**
 * @method POST
 *
 * This function helps me to recover a password, sending to the registered email the additional password,
 * which will be valid for a certain period of time...
 *
 * @param user_name
 */
const recoverdPassword = (user_name) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prismaClient_1.default.users.findFirst({
            where: {
                user_name
            }
        });
        // if the user does not exist let the client knows...
        if (!user) {
            logging_1.default.warning('Usuario no encontrado');
            return 422;
        }
        // create the token...
        const token = (0, authUtils_1.recoveryToken)(user.id_user);
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
            const email = new EmialHandler_1.default(user.email, subject, message);
            // send the message...
            yield email.emailSending();
            // format the email to display it in safe mode...
            const formattedEmail = (0, emailFormatHelpers_1.secureEmailtoShow)(user.email);
            /**
             * we check what was the type of answer, if it was 1 a diferent mesage is assigned to
             * the one that could be if we get a string...
            */
            const ms = formattedEmail === 1
                ? `${user.user_name}, se le ha enviado un código de recuperación a su email registrado.`
                : `${user.user_name}, se le ha mandado a su correo ${formattedEmail} un código de verificación.`;
            // return the message...
            return ms;
        }
        catch (error) {
            logging_1.default.error(`Error: ${error.message}`);
            throw new Error(`Error: ${error.message}`);
        }
    }
    catch (error) {
        logging_1.default.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
});
exports.recoverdPassword = recoverdPassword;
/**
 * @method PUT
 *
 * Password reset service...
 *
 * @param { Token, newPassword }
 */
const resetForgotenPassword = (token, newPass) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // decode the token...
        const decoded = (0, authUtils_1.extractUserInfo)(token, IUser_1.UserDataFields.ID_USER);
        if (decoded === null) {
            logging_1.default.warning('Token expirado o usuario incorrecto');
            return 400;
        }
        // extract the id...
        const id = decoded;
        // process the new password...
        const hashedPassword = yield bcrypt_1.default.hash(newPass, 10);
        // update the password in the database...
        yield prismaClient_1.default.users.update({
            where: { id_user: id },
            data: { password: hashedPassword }
        });
        // mark token as expired when setting inmediate expiration...
        jsonwebtoken_1.default.sign({ id_user: id }, config_1.SERVER.JWT_KEY, { expiresIn: '1S' });
        return 'Su contraseña a sido actualizada correctamente.';
    }
    catch (error) {
        logging_1.default.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
});
exports.resetForgotenPassword = resetForgotenPassword;
