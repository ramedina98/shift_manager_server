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
exports.latestShiftNumber = exports.removeRegistersAndCreateOneIntoReports = exports.newShift = exports.currentAssignatedPatient = exports.shiftAsignado = exports.getCitadosAndConsulta = void 0;
const timeUtils_1 = require("../../utils/timeUtils");
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const logging_1 = __importDefault(require("../../config/logging"));
const server_1 = require("../../server");
/**
 * @method GET
 *
 * This service helps me to retrieve the needed data to show the shifts
 *
 * @param {id_doc}
 * @returns {citados[], consulta[]} --> an appointment list of the day, and a list of general waiting patiens...
 */
const getCitadosAndConsulta = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [consultas, citados, asignados] = yield Promise.all([
            // first retrieve all the data from consultas table...
            prismaClient_1.default.consulta.findMany({
                where: {
                    activo: true,
                },
                orderBy: {
                    create_at: 'asc'
                }
            }),
            // second retrieve all the data from citados table...
            prismaClient_1.default.citados.findMany({
                orderBy: {
                    create_at: 'asc'
                }
            }),
            // third retrieve all the data from asignados table...
            prismaClient_1.default.asignacion.findMany({
                orderBy: {
                    create_at: 'asc'
                }
            })
        ]);
        // check if we hava retrieved all the required data...
        if (!consultas.length && !citados.length && !asignados.length) {
            return 404;
        }
        // general consultas...
        const formmattedConsultas = consultas
            .filter(consulta => !consulta.citado && consulta.activo) // Filtra solo los no citados
            .map(consulta => ({
            nombre_paciente: consulta.nombre_paciente,
            apellido_paciente: consulta.apellido_paciente,
            turno: consulta.turno,
        }));
        // citas...
        const formattedCitados = yield Promise.all(citados.map((cita) => __awaiter(void 0, void 0, void 0, function* () {
            const filteredConsulta = consultas.find((consulta) => consulta.id_consulta === cita.id_consulta);
            const docInfo = yield prismaClient_1.default.users.findFirst({ where: { id_user: cita.id_doc } });
            if (!docInfo || !filteredConsulta) {
                return [];
            }
            return {
                nombre_doc: docInfo === null || docInfo === void 0 ? void 0 : docInfo.nombre1,
                apellido_doc: docInfo === null || docInfo === void 0 ? void 0 : docInfo.apellido1,
                nombre_paciente: filteredConsulta === null || filteredConsulta === void 0 ? void 0 : filteredConsulta.nombre_paciente,
                apellido_paciente: filteredConsulta === null || filteredConsulta === void 0 ? void 0 : filteredConsulta.apellido_paciente,
                turno: filteredConsulta === null || filteredConsulta === void 0 ? void 0 : filteredConsulta.turno,
                hora_cita: cita.hora_cita
            };
        })));
        // asignados...
        const formattedAsignados = yield Promise.all(asignados.map((asignado) => __awaiter(void 0, void 0, void 0, function* () {
            const filteredConsulta = yield prismaClient_1.default.consulta.findFirst({ where: { id_consulta: asignado.id_consulta } });
            const docInfo = yield prismaClient_1.default.users.findFirst({ where: { id_user: asignado.id_doc } });
            const consultorio = yield prismaClient_1.default.asignacion_consultorio.findFirst({ where: { id_doc: asignado.id_doc } });
            if (!docInfo || !consultorio || !filteredConsulta) {
                return [];
            }
            return {
                nombre_doc: docInfo.nombre1,
                apellido_doc: docInfo.apellido1,
                nombre_paciente: filteredConsulta.nombre_paciente,
                apellido_paciente: filteredConsulta.apellido_paciente,
                turno: filteredConsulta.turno,
                consultorio: consultorio.num_consultorio,
            };
        })));
        return {
            consultas: formmattedConsultas,
            citas: formattedCitados,
            asignados: formattedAsignados
        };
    }
    catch (error) {
        logging_1.default.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
});
exports.getCitadosAndConsulta = getCitadosAndConsulta;
/**
 * @method GET
 *
 * This service helps me to retrieve the latest shift maded...
 */
const latestShiftNumber = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const shift = yield prismaClient_1.default.consulta.findFirst({
            orderBy: {
                create_at: 'desc'
            }
        });
        if (!shift) {
            logging_1.default.warning('No hay turnos creados aun.');
            return 404;
        }
        return shift.turno;
    }
    catch (error) {
        logging_1.default.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
});
exports.latestShiftNumber = latestShiftNumber;
/**
 * @method webSocket
 * The porpuse of this function is to helps me to the process of send data
 * throw a webSocket...
 */
const webSocketMessage = (title, message, turno, code) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield getCitadosAndConsulta();
        if (typeof data === 'number') {
            logging_1.default.error(`Error: no hay datos. Status: ${data}}`);
        }
        server_1.wss.clients.forEach((client) => {
            if (client.readyState === 1) {
                client.send(JSON.stringify({
                    code: code,
                    title: title,
                    message: message,
                    shiftsData: data,
                    turno: turno ? turno : null
                }));
            }
        });
    }
    catch (error) {
        logging_1.default.error(`WebSocket error: ` + error.message);
        throw new Error(`WebSocket error: ` + error.message);
    }
});
/**
 * @method POST
 *
 * This services helps me to create new register into the asignados table...
 * Internal use...
 */
const AssignedConsultation = (id_doc, id_consulta, nombre_paciente, consultorio, nombre_doc, turno) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // create te register into the asignated consultaion table...
        const asign = yield prismaClient_1.default.asignacion.create({
            data: {
                id_consulta,
                id_doc
            }
        });
        const title = `Turno ${turno}`;
        const message = `${nombre_paciente} pase con Dr. ${nombre_doc}, consultorio ${consultorio}`;
        yield webSocketMessage(title, message, null, 1);
        return asign.id_asignacion;
    }
    catch (error) {
        logging_1.default.error(`Error in assigned Consultation: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
});
/**
 * @method POST
 *
 * In this service, the data of the waiting shifts are entered into the table of assigned shifts.
 * WS needed...
 *
 * @param {string} id_doc - Doctor's unique identifier.
 * @param {string} nombre_doc - Doctor's first name.
 * @param {string} apellido_doc - Doctor's last name.
 * @returns {Promise<IAsignados | number>} Shift information or a status code in case of an error.
 */
const shiftAsignado = (id_doc, nombre_doc, apellido_doc) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const now = new Date();
        const nextHalfHour = new Date(now.getTime() + 30 * 60 * 1000); // Calculate 30 minutes ahead
        // Check for upcoming appointments within the next 30 minutes
        const upcomingAppointment = yield prismaClient_1.default.citados.findFirst({
            where: {
                id_doc: id_doc,
                hora_cita: {
                    gte: now,
                    lte: nextHalfHour,
                },
            },
        });
        console.log("citado: ", upcomingAppointment);
        if (upcomingAppointment) {
            logging_1.default.info(`Upcoming appointment found for doctor ${id_doc}`);
            const { id_consulta, hora_cita } = upcomingAppointment;
            // Fetch patient information for the upcoming appointment
            const paciente = yield prismaClient_1.default.consulta.findFirst({
                where: { id_consulta },
            });
            // Fetch consultorio information for the doctor
            const consultorio = yield prismaClient_1.default.asignacion_consultorio.findFirst({
                where: { id_doc },
            });
            // patient assignment record...
            const id_asignacion = yield AssignedConsultation(id_doc, id_consulta, `${paciente === null || paciente === void 0 ? void 0 : paciente.nombre_paciente} ${paciente === null || paciente === void 0 ? void 0 : paciente.apellido_paciente}`, consultorio === null || consultorio === void 0 ? void 0 : consultorio.num_consultorio, `${nombre_doc} ${apellido_doc}`, paciente === null || paciente === void 0 ? void 0 : paciente.turno);
            // Return upcoming appointment information
            return {
                id_consulta: paciente === null || paciente === void 0 ? void 0 : paciente.id_consulta,
                nombre_doc,
                apellido_doc,
                hora_cita,
                nombre_paciente: (paciente === null || paciente === void 0 ? void 0 : paciente.nombre_paciente) || 'N/A',
                apellido_paciente: (paciente === null || paciente === void 0 ? void 0 : paciente.apellido_paciente) || 'N/A',
                turno: (paciente === null || paciente === void 0 ? void 0 : paciente.turno) || 'N/A',
                consultorio: (consultorio === null || consultorio === void 0 ? void 0 : consultorio.num_consultorio) || 0,
                visita: paciente === null || paciente === void 0 ? void 0 : paciente.tipo_paciente,
                create_at: paciente === null || paciente === void 0 ? void 0 : paciente.create_at,
                id_asignacion: id_asignacion
            };
        }
        const nextPatient = yield prismaClient_1.default.consulta.findFirst({
            where: {
                activo: true,
                citado: false
            },
            orderBy: {
                create_at: 'asc'
            }
        });
        if (!nextPatient) {
            logging_1.default.error(`There is any shifts right now: ${id_doc}`);
            return 404; // Bad Request
        }
        // Fetch consultorio information for the doctor
        const consultorio = yield prismaClient_1.default.asignacion_consultorio.findFirst({
            where: { id_doc },
        });
        // patient assignment record...
        const id_asignacion = yield AssignedConsultation(id_doc, nextPatient.id_consulta, `${nextPatient === null || nextPatient === void 0 ? void 0 : nextPatient.nombre_paciente} ${nextPatient === null || nextPatient === void 0 ? void 0 : nextPatient.apellido_paciente}`, consultorio === null || consultorio === void 0 ? void 0 : consultorio.num_consultorio, `${nombre_doc} ${apellido_doc}`, nextPatient === null || nextPatient === void 0 ? void 0 : nextPatient.turno);
        // when the assignment is done, we deactivate the patient...
        yield prismaClient_1.default.consulta.update({
            where: {
                id_consulta: nextPatient.id_consulta,
            },
            data: {
                activo: false,
            }
        });
        // Return formatted shift information
        return {
            id_consulta: nextPatient.id_consulta,
            nombre_doc,
            apellido_doc,
            nombre_paciente: (nextPatient === null || nextPatient === void 0 ? void 0 : nextPatient.nombre_paciente) || 'N/A',
            apellido_paciente: (nextPatient === null || nextPatient === void 0 ? void 0 : nextPatient.apellido_paciente) || 'N/A',
            turno: (nextPatient === null || nextPatient === void 0 ? void 0 : nextPatient.turno) || 'N/A',
            consultorio: (consultorio === null || consultorio === void 0 ? void 0 : consultorio.num_consultorio) || 0, // Default to 0 if undefined
            visita: nextPatient.tipo_paciente,
            create_at: nextPatient.create_at,
            id_asignacion: id_asignacion
        };
    }
    catch (error) {
        // Log and handle errors
        logging_1.default.error(`Error in getShiftAsignado: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
});
exports.shiftAsignado = shiftAsignado;
/**
 * @method GET
 *
 * This services helps me to retrieve the current assignated patient...
 *
 * @param {id_doc, nombre_doc, apellido_doc}
 * @returns {Promise<IAsignados | number>}
 */
const currentAssignatedPatient = (id_doc, nombre_doc, apellido_doc) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const assignedPatient = yield prismaClient_1.default.asignacion.findFirst({
            where: {
                id_doc: id_doc
            }
        });
        if (!assignedPatient) {
            logging_1.default.error('No assigment found.');
            return 404;
        }
        const consulta = yield prismaClient_1.default.consulta.findFirst({
            where: {
                id_consulta: assignedPatient.id_consulta
            }
        });
        if (consulta === null) {
            return 400;
        }
        const consultorio = yield prismaClient_1.default.asignacion_consultorio.findFirst({
            where: {
                id_doc: id_doc
            }
        });
        return {
            id_consulta: consulta === null || consulta === void 0 ? void 0 : consulta.id_consulta,
            nombre_doc,
            apellido_doc,
            nombre_paciente: (consulta === null || consulta === void 0 ? void 0 : consulta.nombre_paciente) || 'N/A',
            apellido_paciente: (consulta === null || consulta === void 0 ? void 0 : consulta.apellido_paciente) || 'N/A',
            turno: (consulta === null || consulta === void 0 ? void 0 : consulta.turno) || 'N/A',
            consultorio: (consultorio === null || consultorio === void 0 ? void 0 : consultorio.num_consultorio) || 0, // Default to 0 if undefined
            create_at: consulta === null || consulta === void 0 ? void 0 : consulta.create_at,
            visita: consulta === null || consulta === void 0 ? void 0 : consulta.tipo_paciente,
            id_asignacion: assignedPatient.id_asignacion
        };
    }
    catch (error) {
        // Log and handle errors
        logging_1.default.error(`Error in currentAssignatedPatient: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
});
exports.currentAssignatedPatient = currentAssignatedPatient;
/**
 * @method POST
 *
 * This service helps me to create a new record in the table of consultations or appointments,
 * as well as to create a shift ticket and notify the viewer that a new shift has been entered.
 *
 * @param {citado?, patien_data}
 * @returns {message}
 */
const newShift = (citado, patien_data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const createdConsulta = yield prismaClient_1.default.consulta.create({
            data: {
                nombre_paciente: patien_data.nombre_paciente,
                apellido_paciente: patien_data.apellido_paciente,
                tipo_paciente: patien_data.tipo_paciente,
                turno: patien_data.turno,
                citado: citado,
                activo: true
            }
        });
        if (!createdConsulta) {
            logging_1.default.error('Something went wrong create a new register into consultas table');
            return 404;
        }
        if (citado) {
            if ('id_doc' in patien_data
                && 'hora_cita' in patien_data
                && 'nombre_doc' in patien_data
                && 'apellido_doc' in patien_data) {
                yield prismaClient_1.default.citados.create({
                    data: {
                        id_consulta: createdConsulta.id_consulta,
                        id_doc: patien_data.id_doc,
                        hora_cita: patien_data.hora_cita
                    }
                });
            }
        }
        const title = `¡Turno ${createdConsulta.turno} agregado!`;
        const message = `${createdConsulta.nombre_paciente} ${createdConsulta.apellido_paciente} bienvenido(a) a Hospital San Jose de Los ojos`;
        yield webSocketMessage(title, message, createdConsulta.turno, 2);
        return {
            message: `Turno ${patien_data.turno} creado con exito.`,
            shiftData: {
                paciente_nombre: `${createdConsulta.nombre_paciente} ${createdConsulta.apellido_paciente}`,
                turno: createdConsulta.turno,
                datatime: (0, timeUtils_1.formatDateTime)()
            }
        };
    }
    catch (error) {
        // Log and handle errors
        logging_1.default.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
});
exports.newShift = newShift;
/**
 * @method DELETE
 *
 * this services helps me to delete register from the asignated patient and consulta table and, move that info into
 * reports table...
 *
 * @param {id_doc,  id_consulta, dataReport}
 * @returns {string | number}
 */
const removeRegistersAndCreateOneIntoReports = (id_doc, id_consulta, id_asignacion, dataReport) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // resolve all the async process...
        const [_asignacion, consulta, _reporte] = yield Promise.all([
            prismaClient_1.default.asignacion.delete({
                where: {
                    id_asignacion
                }
            }),
            prismaClient_1.default.consulta.delete({
                where: {
                    id_consulta
                }
            }),
            prismaClient_1.default.reporte.create({
                data: {
                    consultorio: dataReport.consultorio,
                    turno: dataReport.turno,
                    nombre_paciente: dataReport.nombre_paciente,
                    doctor: id_doc,
                    visita: dataReport.visita,
                    fecha_hora: dataReport.fecha_hora
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
        const message = `${dataReport.nombre_paciente} gracias por tu preferencia, esperamos verte pronto.`;
        yield webSocketMessage(title, message, null, 3);
        return `Turno ${consulta.turno} terminado`;
    }
    catch (error) {
        // Log and handle errors
        logging_1.default.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
});
exports.removeRegistersAndCreateOneIntoReports = removeRegistersAndCreateOneIntoReports;
