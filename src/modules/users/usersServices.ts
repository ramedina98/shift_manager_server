/**
 * @module users
 *
 * This file contains all the require services to handle all endpoints of the users module,
 * to obtain data of a specific user or to be able to update information...
 */
import { IUser, INoUserIdandPasswordRequired, INoUserIdPasswordandFotoRequired, IUserPasswords, Iasignacion_consultorio, IDoctosList } from "../../interfaces/IUser";
import { IConsultorio, IReport } from "../../interfaces/IShift";
import { todaysDate } from "../../utils/timeUtils";
import prisma from "../../config/prismaClient";
import bcrypt from 'bcrypt';
import logging from "../../config/logging";
import ExcelJS from 'exceljs';
// import fs from "fs";
import path from "path";

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
const getUser = async (id_user: string): Promise<INoUserIdandPasswordRequired | number> => {
    try {
        // find the user in the database by user ID...
        const user: IUser | null = await prisma.users.findFirst({
            where: {
                id_user
            }
        });

        // if user not found, return a 404 error...
        if(!user){
            logging.error('User not found.');
            return 404;
        }

        // create a response object excluding ID and Password fields...
        const userResponse: INoUserIdandPasswordRequired = {
            nombre1: user.nombre1,
            nombre2: user.nombre2,
            apellido1: user.apellido1,
            apellido2: user.apellido2,
            email: user.email,
            user_name: user.user_name,
            type: user.type
        }

        return userResponse;
    } catch (error: any) {
        logging.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
}

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
const updateUser = async (id_user: string, data: INoUserIdPasswordandFotoRequired): Promise<string | number> => {
    try {
        // second: search for the user and check if the password is correct...
        const user: IUser | null = await prisma.users.findFirst({
            where: { id_user }
        });
        // if for a some strange reason it is not found, let the user know...
        if(!user){
            logging.warning('User not found.');
            return 404;
        }

        /**
         * Then, if the password is correct the following step...
         * Third: update the data in the db..
         */
        const userResponse: IUser = await prisma.users.update({
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

    } catch (error: any) {
        logging.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
}

/**
 * @method PUT
 *
 * This file helps with updating the user's password, it has to receive the session token, from which the id_user will be
 * extracted, it also has to receive the old password and the new one...
 *
 * @param request { token, passwords{} }
 * @returns NextResponse
 */
const updatePassword = async (id_user: string, passwords: IUserPasswords): Promise<string | number> => {
    try {
        // looking for the user...
        const user: IUser | null = await prisma.users.findFirst({
            where: { id_user }
        });

        // if there is not exist the user return a message...
        if(!user){
            logging.error('User not found.');
            return 404;
        }

        // compare the received password with the password in the db...
        const isValidPassword: boolean = await bcrypt.compare(passwords.oldPass, user.password);
        // if the password is wrong, return a message...
        if(!isValidPassword){
            logging.error('Contraseña incorrecta.');
            return 401;
        }

        // if the password is correct, change the password in the data base with the new one...
        const hashedPassword: string = await bcrypt.hash(passwords.newPass, 10);
        await prisma.users.update({
            where: { id_user },
            data: { password: hashedPassword }
        });

        // a message of success...
        return `${user.nombre1} ${user.apellido1} contraseña actualizada correctamente.`

    } catch (error: any) {
        logging.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
}

/**
 * @method POST
 *
 * This services helps me to obtain the report of the day by an specific doctor, at the end of the day...
 *
 * @param {id_doc}
 * @returns {excel}
 */
const createCsvDailyReport = async (id_doc: string, nombre_doc: string): Promise<any> => {
    //obtaint the time range of the present day...
    const { startOfDay, endOfDay } = todaysDate();

    try {
        const reportes: IReport [] | null = await prisma.reporte.findMany({
            where: {
                doctor: id_doc,
                fecha_hora: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });

        if(reportes.length === 0){
            logging.warning('No hay elementos para generar un reporte del día en curso.');
            return [];
        }

        // create a new excel book...
        const workbook = new ExcelJS.Workbook();
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
        const filePath = path.join(__dirname, `Reporte_Diario_${nombre_doc}_${startOfDay.toISOString().slice(0, 10)}.xlsx`);
        // save the file...
        await workbook.xlsx.writeFile(filePath);

        logging.info(`Reporte generado con éxito ${filePath}`);
    } catch (error: any) {
        logging.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
}

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
const officeAssignment = async (id_doc: string, num_consultorio: number): Promise<string | number> => {
    try {
        // check that the offices is already available...
        const emptyOffice: Iasignacion_consultorio | null = await prisma.asignacion_consultorio.findFirst({
            where: {
                num_consultorio
            }
        });

        if(emptyOffice !== null){
            return 201;
        }

        // CREATE REGISTER...
        const response = await prisma.asignacion_consultorio.create({
            data: {
                id_doc,
                num_consultorio,
            }
        });

        return response.id_asignacion;
    } catch (error: any) {
        logging.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
}

/**
 * @method PUT
 * this service helps me to update the  assigned office, if it is required...
 *
 * @param {id_asign_consu, num_consultorio}
 * @returns {string}
 */
const updateAssignedOffice = async (id_asign_consu: string, num_consultorio: number): Promise<string | number> => {
    try {
        // check if the num_consultorio is difernt...
        const consultorio: IConsultorio | null = await prisma.asignacion_consultorio.findFirst({
            where: {
                id_asignacion: id_asign_consu,
                num_consultorio: num_consultorio
            }
        });

        if(consultorio){
            logging.warning('El numero de consultorio no fue cambiado.');
            return 200;
        }

        const response: Iasignacion_consultorio | null = await prisma.asignacion_consultorio.update({
            where: {
                id_asignacion: id_asign_consu
            },
            data: {
                num_consultorio: num_consultorio
            }
        });

        return `Consultorio actualizado. (${response.num_consultorio})`;
    } catch (error: any) {
        logging.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
}

/**
 * @method DELETE
 *
 * This services works with the logout controller to remove and specific record in the asignacion consultorio table...
 * @param {id_doc}
 */
const removeAssignedOffice = async (id_asig_consul: string): Promise<void> => {
    try {
        await prisma.asignacion_consultorio.delete({
            where: {
                id_asignacion: id_asig_consul
            }
        });
        logging.info('Registro borrado.');
    } catch (error: any) {
        logging.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
}

/**
 * @method GET
 *
 * this service helps me to retrieve a list of doctors that works in the clinic...
 *
 * @returns {doctors[]}
 */
const getAllDoctors = async (): Promise<IDoctosList[] | number> => {
    try {
        const response: IUser[] | null = await prisma.users.findMany({
            where: {
                type: 'Medico'
            }
        });

        if(response === null || response.length === 0){
            logging.warning('No se encontro registro.');
            return 404;
        }

        const data: IDoctosList[] = response.map((doc) => {
            return {
                id_doc: doc.id_user,
                nombre_doc: doc.nombre1,
                apellido_doc: doc.apellido1
            }
        });

        return data;
    } catch (error: any) {
        logging.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
}

export { getUser, updateUser, updatePassword, createCsvDailyReport, officeAssignment, updateAssignedOffice, removeAssignedOffice, getAllDoctors };