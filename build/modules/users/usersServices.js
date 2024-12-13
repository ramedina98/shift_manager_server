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
exports.getAllDoctors = exports.removeAssignedOffice = exports.updateAssignedOffice = exports.officeAssignment = exports.createCsvDailyReport = exports.updatePassword = exports.updateUser = exports.getUser = void 0;
const timeUtils_1 = require("../../utils/timeUtils");
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const logging_1 = __importDefault(require("../../config/logging"));
const exceljs_1 = __importDefault(require("exceljs"));
// import fs from "fs";
const path_1 = __importDefault(require("path"));
/**
 * @method GET
 *
 * This function helps me to get the informatuon of a specific user, using the session token provied,
 * using it as param, this function take it and extract the id, which it useto find the user...
 *
 * It has to exclude the ID and the password of the user...
 *
 * @param token
 * @returns message of success
 */
const getUser = (id_user) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // find the user in the database by user ID...
        const user = yield prismaClient_1.default.users.findFirst({
            where: {
                id_user
            }
        });
        // if user not found, return a 404 error...
        if (!user) {
            logging_1.default.error('User not found.');
            return 404;
        }
        // create a response object excluding ID and Password fields...
        const userResponse = {
            nombre1: user.nombre1,
            nombre2: user.nombre2,
            apellido1: user.apellido1,
            apellido2: user.apellido2,
            email: user.email,
            user_name: user.user_name,
            type: user.type
        };
        return userResponse;
    }
    catch (error) {
        logging_1.default.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
});
exports.getUser = getUser;
/**
 * @method PUT
 *
 * This function helps me to update the data of a specific user, obtaining as paramter a token which is decoded to retrieve
 * the user_id, an object which contains the data to be updated, and password to be and extra step of security and
 * validate that if user wants to maje the change of those data......
 *
 * password and profile photo will be updated in separate fields, each one separatly, for security and efficiency...
 *
 * @param { id_user, data, password }
 * @returns NextResponse
 */
const updateUser = (id_user, data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // second: search for the user and check if the password is correct...
        const user = yield prismaClient_1.default.users.findFirst({
            where: { id_user }
        });
        // if for a some strange reason it is not found, let the user know...
        if (!user) {
            logging_1.default.warning('User not found.');
            return 404;
        }
        /**
         * Then, if the password is correct the following step...
         * Third: update the data in the db..
         */
        const userResponse = yield prismaClient_1.default.users.update({
            where: { id_user },
            data: {
                nombre1: data.nombre1,
                nombre2: data.nombre2,
                apellido1: data.apellido1,
                apellido2: data.apellido2,
                email: data.email,
                user_name: data.user_name,
            }
        });
        // return a message of success...
        return `${userResponse.nombre1} ${userResponse.apellido1} sus datos han sido actualizados correctamente.`;
    }
    catch (error) {
        logging_1.default.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
});
exports.updateUser = updateUser;
/**
 * @method PUT
 *
 * This file helps with updating the user's password, it has to receive the session token, from which the id_user will be
 * extracted, it also has to receive the old password and the new one...
 *
 * @param request { token, passwords{} }
 * @returns NextResponse
 */
const updatePassword = (id_user, passwords) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // looking for the user...
        const user = yield prismaClient_1.default.users.findFirst({
            where: { id_user }
        });
        // if there is not exist the user return a message...
        if (!user) {
            logging_1.default.error('User not found.');
            return 404;
        }
        // compare the received password with the password in the db...
        const isValidPassword = yield bcrypt_1.default.compare(passwords.oldPass, user.password);
        // if the password is wrong, return a message...
        if (!isValidPassword) {
            logging_1.default.error('Contraseña incorrecta.');
            return 401;
        }
        // if the password is correct, change the password in the data base with the new one...
        const hashedPassword = yield bcrypt_1.default.hash(passwords.newPass, 10);
        yield prismaClient_1.default.users.update({
            where: { id_user },
            data: { password: hashedPassword }
        });
        // a message of success...
        return `${user.nombre1} ${user.apellido1} contraseña actualizada correctamente.`;
    }
    catch (error) {
        logging_1.default.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
});
exports.updatePassword = updatePassword;
/**
 * @method POST
 *
 * This services helps me to obtain the report of the day by an specific doctor, at the end of the day...
 *
 * @param {id_doc}
 * @returns {excel}
 */
const createCsvDailyReport = (id_doc, nombre_doc) => __awaiter(void 0, void 0, void 0, function* () {
    //obtaint the time range of the present day...
    const { startOfDay, endOfDay } = (0, timeUtils_1.todaysDate)();
    try {
        const reportes = yield prismaClient_1.default.reporte.findMany({
            where: {
                doctor: id_doc,
                fecha_hora: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });
        if (reportes.length === 0) {
            logging_1.default.warning('No hay elementos para generar un reporte del día en curso.');
            return [];
        }
        // create a new excel book...
        const workbook = new exceljs_1.default.Workbook();
        const workSheet = workbook.addWorksheet('Reporte Diario');
        // headers...
        workSheet.columns = [
            { header: 'Doctor', key: 'nombre_doc', width: 20 },
            { header: 'Consultorio', key: 'consultorio', width: 15 },
            { header: 'Paciente', key: 'nombre_patient', width: 25 },
            { header: 'Turno', key: 'turno', width: 15 },
            { header: 'Visita', key: 'visita', width: 15 },
            { header: 'Fecha', key: 'fecha', width: 15 },
            { header: 'Hora', key: 'hora', width: 15 }
        ];
        // add rows...
        reportes.forEach((reporte) => {
            const fecha = new Date(reporte.fecha_hora);
            const fechaFormatted = fecha.toLocaleDateString();
            const horaFormatted = fecha.toLocaleTimeString();
            workSheet.addRow({
                nombre_doc: nombre_doc,
                consultorio: reporte.consultorio,
                nombre_patient: reporte.nombre_paciente,
                turno: reporte.turno,
                visita: reporte.visita,
                fecha: fechaFormatted,
                hora: horaFormatted
            });
        });
        // TODO: definir aqui donde podría ser guardada esta información, para ser accedida facilmente por los administradores...
        // define the path...
        const filePath = path_1.default.join(__dirname, `Reporte_Diario_${nombre_doc}_${startOfDay.toISOString().slice(0, 10)}.xlsx`);
        // save the file...
        yield workbook.xlsx.writeFile(filePath);
        logging_1.default.info(`Reporte generado con éxito ${filePath}`);
    }
    catch (error) {
        logging_1.default.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
});
exports.createCsvDailyReport = createCsvDailyReport;
/**
 * @method POST
 *
 * This service helps me assign an office to a doctor...
 *
 * This service have to work with the login process...
 *
 * @param {id_doc}
 * @returns {string}
 */
const officeAssignment = (id_doc, num_consultorio) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // check that the offices is already available...
        const emptyOffice = yield prismaClient_1.default.asignacion_consultorio.findFirst({
            where: {
                num_consultorio
            }
        });
        if (emptyOffice !== null) {
            return 201;
        }
        // CREATE REGISTER...
        const response = yield prismaClient_1.default.asignacion_consultorio.create({
            data: {
                id_doc,
                num_consultorio,
            }
        });
        return response.id_asignacion;
    }
    catch (error) {
        logging_1.default.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
});
exports.officeAssignment = officeAssignment;
/**
 * @method PUT
 * this service helps me to update the  assigned office, if it is required...
 *
 * @param {id_asign_consu, num_consultorio}
 * @returns {string}
 */
const updateAssignedOffice = (id_asign_consu, num_consultorio) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // check if the num_consultorio is difernt...
        const consultorio = yield prismaClient_1.default.asignacion_consultorio.findFirst({
            where: {
                id_asignacion: id_asign_consu,
                num_consultorio: num_consultorio
            }
        });
        if (consultorio) {
            logging_1.default.warning('El numero de consultorio no fue cambiado.');
            return 200;
        }
        const response = yield prismaClient_1.default.asignacion_consultorio.update({
            where: {
                id_asignacion: id_asign_consu
            },
            data: {
                num_consultorio: num_consultorio
            }
        });
        return `Consultorio actualizado. (${response.num_consultorio})`;
    }
    catch (error) {
        logging_1.default.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
});
exports.updateAssignedOffice = updateAssignedOffice;
/**
 * @method DELETE
 *
 * This services works with the logout controller to remove and specific record in the asignacion consultorio table...
 * @param {id_doc}
 */
const removeAssignedOffice = (id_asig_consul) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prismaClient_1.default.asignacion_consultorio.delete({
            where: {
                id_asignacion: id_asig_consul
            }
        });
        logging_1.default.info('Registro borrado.');
    }
    catch (error) {
        logging_1.default.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
});
exports.removeAssignedOffice = removeAssignedOffice;
/**
 * @method GET
 *
 * this service helps me to retrieve a list of doctors that works in the clinic...
 *
 * @returns {doctors[]}
 */
const getAllDoctors = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield prismaClient_1.default.users.findMany({
            where: {
                type: 'Medico'
            }
        });
        if (response === null || response.length === 0) {
            logging_1.default.warning('No se encontro registro.');
            return 404;
        }
        const data = response.map((doc) => {
            return {
                id_doc: doc.id_user,
                nombre_doc: doc.nombre1,
                apellido_doc: doc.apellido1
            };
        });
        return data;
    }
    catch (error) {
        logging_1.default.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
});
exports.getAllDoctors = getAllDoctors;
