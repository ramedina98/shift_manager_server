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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllDoctorsController = exports.updateAssignedOfficeController = exports.updatePasswordController = exports.updateUserController = exports.getUserController = void 0;
const usersServices_1 = require("./usersServices");
/**
 * @method GET
 *
 * This controller helps me to handle the process of obtain info of a specific user, using the
 * token session...
 */
const getUserController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user_data = req.user;
    try {
        // start the process...
        const result = yield (0, usersServices_1.getUser)(user_data.id_user);
        if (result === 404) {
            return res.status(result).json({
                message: 'Usuario no encontrado.'
            });
        }
        // return a 200 code, success...
        return res.status(200).json({
            message: 'Usuario encontrado con exito.',
            result
        });
    }
    catch (error) {
        return res.status(500).json({
            error: `Internal server error: ${error.message}`
        });
    }
});
exports.getUserController = getUserController;
/**
 * @method PUT
 *
 * This controller handle the process of update an specific user, except their password and photo, that's
 * separate...
 */
const updateUserController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // deconstruting the req.body to botain the token, user_data and password...
    const { data } = req.body;
    const user_data = req.user;
    // check if the datas was sent...
    if (!data)
        return res.status(400).json({ error: 'Data no provided.' });
    try {
        const result = yield (0, usersServices_1.updateUser)(user_data.id_user, data);
        // check the type of result, if result = number,
        if (typeof result === 'number') {
            let message = '';
            if (result === 404) {
                message = 'Usuario no encontrado.';
            }
            return res.status(result).json({
                message
            });
        }
        // if is not type of = number, and is a string, return the message of success...
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
exports.updateUserController = updateUserController;
/**
 * @method PUT
 *
 * This controller helps me to handle upate the password of a user, it recieve the
 * session token, the new and the old password to do the process...
 */
const updatePasswordController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // deconstruting the req.body to obtain the token, old and new password...
    const { passwords } = req.body;
    const user_data = req.user;
    // check if the data was recieved correctly...
    if (!passwords.oldPass || !passwords.newPass)
        return res.status(400).json({ error: 'Data not provied.' });
    try {
        const result = yield (0, usersServices_1.updatePassword)(user_data.id_user, passwords);
        // check the type of result, if result = number,
        if (typeof result === 'number') {
            let message = '';
            if (result === 404) {
                message = 'Usuario no encontrado.';
            }
            else if (result === 401) {
                message = 'Contraseña incorrecta.';
            }
            return res.status(result).json({
                message
            });
        }
        // if is not type of = number, and is a string, return the message of success...
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
exports.updatePasswordController = updatePasswordController;
/**
 * @method PUT
 *
 * This controller handle the process of update the register of a specific
 * asigned office...
 */
const updateAssignedOfficeController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id_asign_consu, num_consultorio } = req.body;
    if (!id_asign_consu || num_consultorio === 0) {
        return res.status(404).json({ error: 'Datos no proporcionados.' });
    }
    try {
        const response = yield (0, usersServices_1.updateAssignedOffice)(id_asign_consu, num_consultorio);
        if (typeof response === 'number') {
            return res.status(400).json({
                error: 'Numero de consultorio no actualizado.'
            });
        }
        return res.status(201).json({
            message: `Actualización exitosa, consultorio Num. ${num_consultorio}`
        });
    }
    catch (error) {
        return res.status(500).json({
            error: `Internal server error: ${error.message}`
        });
    }
});
exports.updateAssignedOfficeController = updateAssignedOfficeController;
/**
 * @method GET
 *
 * Controller to handle the process of obtain a list of doctors in the clinic...
 */
const getAllDoctorsController = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield (0, usersServices_1.getAllDoctors)();
        if (typeof response === 'number') {
            return res.status(response).json({ error: 'No se encontro registro.' });
        }
        return res.status(200).json({
            message: 'Datos obtenidos con exito',
            data: response
        });
    }
    catch (error) {
        return res.status(500).json({
            error: `Internal server error: ${error.message}`
        });
    }
});
exports.getAllDoctorsController = getAllDoctorsController;
