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
exports.resetForgotenPasswordController = exports.recoverdPasswordController = exports.refreshTokenController = exports.logoutController = exports.loginController = exports.insertNewUserController = exports.getUsersController = void 0;
// TODO: import { createCsvDailyReport } from "../users/usersServices";
const usersServices_1 = require("../users/usersServices");
const authServices_1 = require("./authServices");
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
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
const getUsersController = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const usersAndEmails = yield (0, authServices_1.getUsers)();
        if (usersAndEmails === 400) {
            return res.status(usersAndEmails).json({
                message: 'Data not found.'
            });
        }
        return res.status(200).json({
            returnmessage: 'Data obtained successfully.',
            usersAndEmails
        });
    }
    catch (error) {
        return res.status(500).json({
            error: `Internal server error: ${error.message}`
        });
    }
});
exports.getUsersController = getUsersController;
/**
 * @method POST
 *
 * This controller handle the process of register a new user in the data base...
 *
 * @param req.boyd {IuserNoId}
 * @returns {Response.json}
 */
const insertNewUserController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // destructuring the req.boyd to retrieve the user data...
    const { new_user } = req.body;
    // check if the data was provied...
    if (!new_user) {
        return res.status(422).json({
            message: 'Data no provied.'
        });
    }
    try {
        // send the data to the services to start the process of storage them...
        const result = yield (0, authServices_1.insertNewUser)(new_user);
        // if the return is 200, that means that the user has an acount...
        if (result === 406) {
            return res.status(result).json({
                message: 'Ya tienes una cuenta activa.'
            });
        }
        // response with a message of success...
        return res.status(201).json({
            message: result
        });
    }
    catch (error) {
        return res.status(500).json({
            error: `Internal server error: ${error.message}`
        });
    }
});
exports.insertNewUserController = insertNewUserController;
/**
 * @method POST
 *
 * This controller helps me to manage the login process, validate the password and get
 * a JWT for session management if the provied credentials are correct...
 *
 * @param req.body
 * @returns { Response.json }
 */
const loginController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // deconstruting the req.body to retrieve the data...
    const { session_data, num_consultorio } = req.body;
    // check if the data was sent or not...
    if (!session_data) {
        return res.status(422).json({
            message: 'No credentials provied.'
        });
    }
    try {
        // first deconstruct the session_data object...
        const { user_name, password } = session_data;
        // send the data to the service...
        const result = yield (0, authServices_1.login)(user_name, password);
        // handling the error codes (404, 401)
        if (typeof result === 'number') {
            let message = '';
            if (result === 404) {
                message = 'Usuario incorrecto.';
            }
            else if (result === 402) {
                message = 'Contraseña incorrecta.';
            }
            return res.status(result).json({
                error: message
            });
        }
        else {
            const response = yield prismaClient_1.default.users.findFirst({ where: { user_name } });
            if (!response) {
                return res.status(404).json({ error: 'Usuario no encontrado. ' });
            }
            let id_asig_consul;
            if (response.type.toLowerCase() === 'medico') {
                id_asig_consul = yield (0, usersServices_1.officeAssignment)(response.id_user, num_consultorio);
            }
            if (typeof id_asig_consul === 'number') {
                if (id_asig_consul === 401) {
                    return res.status(401).json({ error: 'Consultorio ocupado, verifique bien el numero de consultorio en el que esta.' });
                }
                else if (id_asig_consul === 400) {
                    return res.status(400).json({ error: 'Seleccione un consultorio valido.' });
                }
            }
            res.cookie('refreshToken', result.refreshToken, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 24 * 60 * 60 * 1000 });
            res.status(200).json({
                message: 'Inicio de sesión exitoso',
                accessToken: result.accessToken,
                id_asig_consul
            });
        }
    }
    catch (error) {
        return res.status(500).json({
            error: `Internal server error: ${error.message}`
        });
    }
});
exports.loginController = loginController;
/**
 * @method POST
 *
 * This controller handle the insertion of tokens into the revokd_tokens table and the
 * logout...
 */
const logoutController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    const reToken = req.cookies.refreshToken;
    //TODO:  const user_data = req.user;
    const { id_asig_consul } = req.body;
    if (token === undefined) {
        return res.status(401).json({
            message: 'Token no provied.'
        });
    }
    if (!reToken) {
        return res.status(404).json({ message: 'Refresh token not provided.' });
    }
    try {
        // logout service...
        const result = yield (0, authServices_1.logout)(token);
        // delete the refresh token from the refresh_tokens table...
        yield (0, authServices_1.deleteRefreshToken)(reToken);
        if (result === 400) {
            return res.status(result).json({
                error: 'Token expirado o incorrecto.'
            });
        }
        // create the csv reporte...
        // TODO: des comentar...
        //await createCsvDailyReport(user_data.id_user, `${user_data.nombre} ${user_data.apellido}`);
        if (id_asig_consul && id_asig_consul !== 'undefined') {
            // delete de assigned_office register...
            yield (0, usersServices_1.removeAssignedOffice)(id_asig_consul);
        }
        // clean the cooki of refresh token...
        res.clearCookie('refreshToken');
        res.status(result).json({
            message: 'Cerrando sesión.'
        });
    }
    catch (error) {
        return res.status(500).json({
            error: `Internal server error: ${error.message}`
        });
    }
});
exports.logoutController = logoutController;
/**
 * @method POST
 *
 * This controller hendle the process of create a new access token using the
 * refresh token to validate the user...
 */
const refreshTokenController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const reToken = req.cookies.refreshToken;
    // check if the token has been providing...
    if (!reToken)
        return res.status(401).json({ message: 'Token no provided.' });
    try {
        // start the process of the new access token...
        const result = yield (0, authServices_1.refreshToken)(reToken);
        if (typeof result === 'number') {
            let message = '';
            if (result === 404) {
                message = 'El token no es valido o ha sido revocado.';
            }
            else if (result === 403) {
                message = 'Error decoding the JWT.';
            }
            return res.status(result).json({ message });
        }
        return res.status(201).json({
            message: 'Token creado con exito.',
            token: result
        });
    }
    catch (error) {
        return res.status(500).json({
            error: `Internal server error: ${error.message}`
        });
    }
});
exports.refreshTokenController = refreshTokenController;
/**
 * @method POST
 *
 * This controller handles the process of send an email with a token to recover the password forgoten...
 */
const recoverdPasswordController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // decunstructing the req.body to retrieve the user_name...
    const { user_name } = req.body;
    if (!user_name) {
        return res.status(404).json({
            message: 'Data no provied.'
        });
    }
    try {
        const result = yield (0, authServices_1.recoverdPassword)(user_name);
        if (result === 422) {
            return res.status(result).json({
                message: `El usuario "${user_name}" no fu encontrado.`
            });
        }
        return res.status(200).json({
            message: result
        });
    }
    catch (error) {
        return res.status(500).json({
            error: `Internal server error: ${error.message}`
        });
    }
});
exports.recoverdPasswordController = recoverdPasswordController;
/**
 * @method PUT
 *
 * This controller handle the process of reset a forgoten password...
 *
 * @param req.body
 * @returns res.json()
 */
const resetForgotenPasswordController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // deconstruting the req.body to retrieve the token and the new Password...
    const { token, newPass } = req.body;
    if (!token || !newPass) {
        return res.status(404).json({
            message: 'Token or password not provied.',
            token,
            newPass
        });
    }
    try {
        const result = yield (0, authServices_1.resetForgotenPassword)(token, newPass);
        if (result === 400) {
            return res.status(400).json({
                message: 'Token expirado o usuario incorrecto'
            });
        }
        return res.status(200).json({
            message: result
        });
    }
    catch (error) {
        return res.status(500).json({
            error: `Internal server error: ${error.message}`
        });
    }
});
exports.resetForgotenPasswordController = resetForgotenPasswordController;
