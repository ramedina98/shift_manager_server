/**
 * @module shiftManagement
 *TODO: checar web sockets, y primer service (asignaciones)...
 * This file contains all the required servies to handle all the routes of the endpoint
 * shif creator...
 *
 * 1. GET: both tables are involved in this process, citas and consulta...
 * 2. POST: create a new register in one of the them (citas/consultas), this depends on the
 * options sent by the frontend in a query...
 * 3. PUT: in order to have the ability to edit an appointment, if the
 * first or las name has been entered incorrectly...
 */
import { IDataReport, IConsulta, IAsignado, IShifts, ICitas, IConsultas, IConsultorio, IAsignados, IPacienteNoId, IPacienteCitado, IShiftsTicketData } from "../../interfaces/IShift";
import { IUser } from "../../interfaces/IUser";
import { formatDateTime } from "../../utils/timeUtils";
import prisma from "../../config/prismaClient";
import logging from "../../config/logging";
import wss from "../../webSocketServer";

/**
 * @method GET
 *
 * This service helps me to retrieve the needed data to show the shifts
 *
 * @param {id_doc}
 * @returns {citados[], consulta[]} --> an appointment list of the day, and a list of general waiting patiens...
 */
const getCitadosAndConsulta = async (): Promise<IShifts | number> => {
    try {
        const [consultas, citados, asignados] = await Promise.all([
            // first retrieve all the data from consultas table...
            prisma.consulta.findMany({
                where: {
                    activo: true,
                },
                orderBy: {
                    create_at: 'asc'
                }
            }),
            // second retrieve all the data from citados table...
            prisma.citados.findMany({
                orderBy: {
                    create_at: 'asc'
                }
            }),
            // third retrieve all the data from asignados table...
            prisma.asignacion.findMany({
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
        const formmattedConsultas: IConsultas[] = consultas
        .filter(consulta => !consulta.citado && consulta.activo) // Filtra solo los no citados
        .map(consulta => ({                  // Transforma los datos
            nombre_paciente: consulta.nombre_paciente,
            apellido_paciente: consulta.apellido_paciente,
            turno: consulta.turno,
        }));

        // citas...
        const formattedCitados: ICitas[] | any[]= await Promise.all(
            citados.map(async (cita) => {
                const filteredConsulta = consultas.find((consulta) => consulta.id_consulta === cita.id_consulta);

                const docInfo = await prisma.users.findFirst({ where: { id_user: cita.id_doc } });

                if(!docInfo || !filteredConsulta){
                    return[];
                }

                return {
                    nombre_doc: docInfo?.nombre1,
                    apellido_doc: docInfo?.apellido1,
                    nombre_paciente: filteredConsulta?.nombre_paciente,
                    apellido_paciente: filteredConsulta?.apellido_paciente,
                    turno: filteredConsulta?.turno,
                    hora_cita: cita.hora_cita
                };
            })
        );

        // asignados...
        const formattedAsignados: IAsignados[] | any[]= await Promise.all(
            asignados.map(async (asignado) => {
                const filteredConsulta = await prisma.consulta.findFirst({where: {id_consulta: asignado.id_consulta}})

                const docInfo: IUser | null = await prisma.users.findFirst({ where: { id_user: asignado.id_doc } });
                const consultorio: IConsultorio | null = await prisma.asignacion_consultorio.findFirst({ where: { id_doc: asignado.id_doc } });

                if(!docInfo || !consultorio || !filteredConsulta){
                    return[];
                }

                return {
                    nombre_doc: docInfo.nombre1,
                    apellido_doc: docInfo.apellido1,
                    nombre_paciente: filteredConsulta.nombre_paciente,
                    apellido_paciente: filteredConsulta.apellido_paciente,
                    turno: filteredConsulta.turno,
                    consultorio: consultorio.num_consultorio,
                };
            })
        );


        return {
            consultas: formmattedConsultas,
            citas: formattedCitados,
            asignados: formattedAsignados
        }
    } catch (error: any) {
        logging.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
}

/**
 * @method GET
 *
 * This service helps me to retrieve the latest shift maded...
 */
const latestShiftNumber = async (): Promise<string | number> => {
    try {
        const shift: IConsulta | null = await prisma.consulta.findFirst({
            orderBy: {
                create_at: 'desc'
            }
        });

        if(!shift){
            logging.warning('No hay turnos creados aun.');
            return 404;
        }

        return shift.turno;
    } catch (error: any) {
        logging.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
}

/**
 * @method webSocket
 * The porpuse of this function is to helps me to the process of send data
 * throw a webSocket...
 */
const webSocketMessage = async (title: string, message: string, turno: string | null, code: number): Promise<void> => {
    try {
        const data: IShifts | number = await getCitadosAndConsulta();

        if(typeof data === 'number'){
            logging.error(`Error: no hay datos. Status: ${data}}`);
        }

        wss.clients.forEach((client) => {
            if(client.readyState === 1){
                client.send(JSON.stringify({
                    code: code,
                    title: title,
                    message: message,
                    shiftsData: data,
                    turno: turno ? turno : null
                }));
            }
        });

    } catch (error: any) {
        logging.error(`WebSocket error: ` + error.message);
        throw new Error(`WebSocket error: ` + error.message);
    }
}

/**
 * @method POST
 *
 * This services helps me to create new register into the asignados table...
 * Internal use...
 */
const AssignedConsultation = async (id_doc: string, id_consulta: number, nombre_paciente: string, consultorio?: number, nombre_doc?: string, turno?: string): Promise<string> => {
    try {
        // create te register into the asignated consultaion table...
        const asign: IAsignado = await prisma.asignacion.create({
            data: {
                id_consulta,
                id_doc
            }
        });

        const title: string = `Turno ${turno}`;
        const message: string = `${nombre_paciente} pase con Dr. ${nombre_doc}, consultorio ${consultorio}`;
        await webSocketMessage(title, message, null, 1);

        return asign.id_asignacion;
    } catch (error: any) {
        logging.error(`Error in assigned Consultation: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
}

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
const shiftAsignado = async (id_doc: string, nombre_doc: string, apellido_doc: string): Promise<IAsignados | number> => {
    try {
        const now = new Date();
        const nextHalfHour = new Date(now.getTime() + 30 * 60 * 1000); // Calculate 30 minutes ahead

        // Check for upcoming appointments within the next 30 minutes
        const upcomingAppointment = await prisma.citados.findFirst({
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
            logging.info(`Upcoming appointment found for doctor ${id_doc}`);

            const { id_consulta, hora_cita } = upcomingAppointment;

            // Fetch patient information for the upcoming appointment
            const paciente = await prisma.consulta.findFirst({
                where: { id_consulta },
            });

            // Fetch consultorio information for the doctor
            const consultorio = await prisma.asignacion_consultorio.findFirst({
                where: { id_doc },
            });

            // patient assignment record...
            const id_asignacion: string = await AssignedConsultation(id_doc, id_consulta, `${paciente?.nombre_paciente} ${paciente?.apellido_paciente}`, consultorio?.num_consultorio, `${nombre_doc} ${apellido_doc}`,paciente?.turno);

            // Return upcoming appointment information
            return {
                id_consulta: paciente?.id_consulta,
                nombre_doc,
                apellido_doc,
                hora_cita,
                nombre_paciente: paciente?.nombre_paciente || 'N/A',
                apellido_paciente: paciente?.apellido_paciente || 'N/A',
                turno: paciente?.turno || 'N/A',
                consultorio: consultorio?.num_consultorio || 0,
                visita: paciente?.tipo_paciente,
                create_at: paciente?.create_at,
                id_asignacion: id_asignacion
            };
        }

        const nextPatient: IConsulta | null = await prisma.consulta.findFirst({
            where: {
                activo: true,
                citado: false
            },
            orderBy: {
                create_at: 'asc'
            }
        });

        if (!nextPatient) {
            logging.error(`There is any shifts right now: ${id_doc}`);
            return 404; // Bad Request
        }

        // Fetch consultorio information for the doctor
        const consultorio = await prisma.asignacion_consultorio.findFirst({
            where: { id_doc },
        });

        // patient assignment record...
        const id_asignacion: string = await AssignedConsultation(id_doc, nextPatient.id_consulta, `${nextPatient?.nombre_paciente} ${nextPatient?.apellido_paciente}`, consultorio?.num_consultorio, `${nombre_doc} ${apellido_doc}`, nextPatient?.turno);

        // when the assignment is done, we deactivate the patient...
        await prisma.consulta.update({
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
            nombre_paciente: nextPatient?.nombre_paciente || 'N/A',
            apellido_paciente: nextPatient?.apellido_paciente || 'N/A',
            turno: nextPatient?.turno || 'N/A',
            consultorio: consultorio?.num_consultorio || 0, // Default to 0 if undefined
            visita: nextPatient.tipo_paciente,
            create_at: nextPatient.create_at,
            id_asignacion: id_asignacion
        };
    } catch (error: any) {
        // Log and handle errors
        logging.error(`Error in getShiftAsignado: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
};

/**
 * @method GET
 *
 * This services helps me to retrieve the current assignated patient...
 *
 * @param {id_doc, nombre_doc, apellido_doc}
 * @returns {Promise<IAsignados | number>}
 */
const currentAssignatedPatient = async (id_doc: string, nombre_doc: string, apellido_doc: string): Promise<IAsignados | number> => {
    try {
        const assignedPatient: IAsignado | null = await prisma.asignacion.findFirst({
            where: {
                id_doc: id_doc
            }
        });

        if(!assignedPatient){
            logging.error('No assigment found.');
            return 404;
        }

        const consulta: IConsulta | null = await prisma.consulta.findFirst({
            where: {
                id_consulta: assignedPatient.id_consulta
            }
        });

        if(consulta === null){
            return 400;
        }

        const consultorio: IConsultorio | null = await prisma.asignacion_consultorio.findFirst({
            where: {
                id_doc: id_doc
            }
        });

        return {
            id_consulta: consulta?.id_consulta,
            nombre_doc,
            apellido_doc,
            nombre_paciente: consulta?.nombre_paciente || 'N/A',
            apellido_paciente: consulta?.apellido_paciente || 'N/A',
            turno: consulta?.turno || 'N/A',
            consultorio: consultorio?.num_consultorio || 0, // Default to 0 if undefined
            create_at: consulta?.create_at,
            visita: consulta?.tipo_paciente,
            id_asignacion: assignedPatient.id_asignacion
        };

    } catch (error: any) {
        // Log and handle errors
        logging.error(`Error in currentAssignatedPatient: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
}

/**
 * @method POST
 *
 * This service helps me to create a new record in the table of consultations or appointments,
 * as well as to create a shift ticket and notify the viewer that a new shift has been entered.
 *
 * @param {citado?, patien_data}
 * @returns {message}
 */
const newShift = async (citado: boolean, patien_data: IPacienteNoId | IPacienteCitado): Promise<{message: string, shiftData: IShiftsTicketData } | number> => {
    try {
        const createdConsulta: IConsulta = await prisma.consulta.create({
            data: {
                nombre_paciente: patien_data.nombre_paciente,
                apellido_paciente: patien_data.apellido_paciente,
                tipo_paciente: patien_data.tipo_paciente,
                turno: patien_data.turno,
                citado: citado,
                activo: true
            }
        });

        if(!createdConsulta ){
            logging.error('Something went wrong create a new register into consultas table');
            return 404;
        }

        if(citado){
            if('id_doc' in patien_data
                &&'hora_cita' in patien_data
                && 'nombre_doc' in patien_data
                && 'apellido_doc' in patien_data){
                await prisma.citados.create({
                    data: {
                        id_consulta: createdConsulta.id_consulta,
                        id_doc: patien_data.id_doc,
                        hora_cita: patien_data.hora_cita
                    }
                });
            }
        }

        const title: string = `¡Turno ${createdConsulta.turno} agregado!`;
        const message: string = `${createdConsulta.nombre_paciente} ${createdConsulta.apellido_paciente} bienvenido(a) a Hospital San Jose de Los ojos`;
        await webSocketMessage(title, message, createdConsulta.turno, 2);

        return {
            message: `Turno ${patien_data.turno} creado con exito.`,
            shiftData: {
                paciente_nombre: `${createdConsulta.nombre_paciente} ${createdConsulta.apellido_paciente}`,
                turno: createdConsulta.turno,
                datatime: formatDateTime()
            }
        }
    } catch (error: any) {
        // Log and handle errors
        logging.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
}



/**
 * @method DELETE
 *
 * this services helps me to delete register from the asignated patient and consulta table and, move that info into
 * reports table...
 *
 * @param {id_doc,  id_consulta, dataReport}
 * @returns {string | number}
 */
const removeRegistersAndCreateOneIntoReports = async (id_doc: string, id_consulta: number, id_asignacion: string, dataReport: IDataReport): Promise<string> => {
    try {
        // resolve all the async process...
        const [_asignacion, consulta, _reporte] = await Promise.all([
            prisma.asignacion.delete({
                where: {
                    id_asignacion
                }
            }),
            prisma.consulta.delete({
                where: {
                    id_consulta
                }
            }),
            prisma.reporte.create({
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
        if(consulta.citado){
            await prisma.citados.delete({
                where: {
                    id_consulta: consulta.id_consulta
                }
            });
        }

        const title: string = `Turno ${consulta.turno} terminado`;
        const message: string = `${dataReport.nombre_paciente} gracias por tu preferencia, esperamos verte pronto.`
        await webSocketMessage(title, message, null, 3);

        return `Turno ${consulta.turno} terminado`;
    } catch (error: any) {
        // Log and handle errors
        logging.error(`Error: ${error.message}`);
        throw new Error(`Error: ${error.message}`);
    }
}

export {
    getCitadosAndConsulta,
    shiftAsignado,
    currentAssignatedPatient,
    newShift,
    removeRegistersAndCreateOneIntoReports,
    latestShiftNumber
};