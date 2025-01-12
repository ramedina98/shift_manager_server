/**
 * @module shiftManagement
 *
 * This controller helps me to handle all the request of the routes of the shiftmanagemant endpoint...
 */
import { Request, Response } from "express";
import {
    getCitadosAndConsulta,
    scheduledPatients,
    shiftAsignado,
    currentAssignatedPatient,
    newShift,
    removeRegistersAndCreateOneIntoReports,
    latestShiftNumber,
    numberOfSchedulePatients
} from "./shiftServices";
import { IAsignados, IDataReport, IShifts } from "../../interfaces/IShift";
import { IPacienteCitado, IPacienteNoId, IShiftsTicketData } from "../../interfaces/IShift";

/**
 * @method GET
 * This controller obtain the info of citados, asignados y consultas tables...
 */
const getCitadosAndConsultaController = async (_req: Request, res: Response): Promise<any> => {
    try {
        const response: IShifts | number = await getCitadosAndConsulta();

        if(typeof response === 'number'){
            return res.status(404).json({
                message: 'No se encontraron datos aun.',
                consultas: [],
                citas: [],
                asignados: []
            });
        }

        return res.status(200).json({
            consultas: response.consultas,
            citas: response.citas,
            asignados: response.asignados
        });
    } catch (error: any) {
        return res.status(500).json({
            error: `Internal server error: ${error.message}`
        });
    }
}

/**
 * @method GET
 *
 * Latest shift number...
 */
const latestShiftNumberController = async (_req: Request, res: Response): Promise<any> => {
    try {
        const response: string | number = await latestShiftNumber();

        if(typeof response === 'number'){
            return res.status(response).json({
                message: 'No hay turnos creados aun.',
                data: []
            });
        }

        return res.status(200).json({
            message: 'Dato encontrado',
            data: response
        });
    } catch (error: any) {
        return res.status(500).json({
            error: `Internal server error: ${error.message}`
        });
    }
}

/**
 * @method GET
 *
 * This controller handle the service number of schedule patients...
 */
const numberOfSchedulePatientsController = async (req: Request, res: Response): Promise<any> => {
    const user_data = req.user;

    console.log(user_data.type);
    try {
        if(user_data.type.toLowerCase() === "cajero"){
            return res.status(404).json({
                message: "Los cajeros no atienden pacientes",
                data: 0
            });
        }

        const response = await numberOfSchedulePatients(user_data.id_user);

        return res.status(200).json({
            message: "Proceso exitoso.",
            data: response
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
 * This controller manages the service that makes the appointment of patients...
 * @param {session_token}
 */
const scheduledPatientsController = async (req: Request, res: Response): Promise<any> => {
    const user_data = req.user;

    try {
        // feetch the schedule patient...
        const response: IAsignados | number = await scheduledPatients(user_data.id_user, user_data.nombre, user_data.apellido);

        // handler cases where no shift is assigned...
        if(typeof response === 'number'){
            return res.status(400).json({
                message: 'No hay turno citados para asignar en este momento.',
                shift: []
            });
        }

        return res.status(200).json({
            message: 'Turno asignado',
            shift: response
        });
    } catch (error: any) {
        return res.status(500).json({
            error: `Internal server error ${error.message}`
        });
    }
}

/**
 * @method POS
 *
 * In the client, they have to click a botton to start this process...
 * @param {Session_token}
 */
const shiftAsignadoController = async (req:Request, res:Response): Promise<any> => {
    const user_data = req.user;

    try {
        // fetch the assigned shift
        const response: IAsignados | number = await shiftAsignado(user_data.id_user, user_data.nombre, user_data.apellido);

        // handler cases where no shift is assigned...
        if(typeof response === 'number'){
            return res.status(404).json({
                message: 'No hay turno para asignar en este momento.',
                shift: []
            })
        }

        return res.status(200).json({
            message: 'Turno asignado',
            shift: response
        });

    } catch (error: any) {
        return res.status(500).json({
            error: `Internal server error ${error.message}`
        });
    }
}

/**
 * @method GET
 *
 * This controller handle the process of retrieve an assignated patient...
 */
const currentAssignatedPatientControler = async (req: Request, res: Response): Promise<any> => {
    const user_data = req.user;

    try {
        const response: IAsignados | number = await currentAssignatedPatient(user_data.id_user, user_data.nombre, user_data.apellido);

        // handler cases where no shift is assigned...
        if(typeof response === 'number'){
            let message: string = '';
            if(response === 400){
                message = 'Consulta no encontrada.';
            } else if(response === 404){
                message = 'Turno no encontrado.';
            }

            return res.status(response).json({
                message: message
            });
        }

        return res.status(200).json({
            message: 'Turno asignado',
            shift: response
        });
    } catch (error: any) {
        return res.status(500).json({
            error: `Internal server error ${error.message}`
        });
    }
}

/**
 * @method POST
 *
 * Controller to handle the proces of create a new shift...
 */
const newShiftController = async (req:Request, res: Response): Promise<any> => {
    const {patien_data}: {patien_data: IPacienteNoId | IPacienteCitado} = req.body;

    if(!patien_data){
        return res.status(400).json({
            error: 'Datos no proporiconados'
        });
    }

    try {
        const response: {message: string, shiftData: IShiftsTicketData} | number = await newShift(patien_data.citado, patien_data);

        if(typeof response === 'number'){
            return res.status(404).json({
                error: 'Ha ocurrido un error al crear el turno, intente nuevamente.',
            });
        }

        return res.status(201).json({
            response
        });
    } catch (error: any) {
        return res.status(500).json({
            error: `Internal server error ${error.message}`
        });
    }
}

/**
 * @method DELETE
 *
 * this controller handle the process of delete the following registers (citados, consultas, asignados)...
 */
const removeRegistersAndCreateOneIntoReportsController = async (req:Request, res:Response): Promise<any> => {
    const user_data = req.user;
    const {id_consulta, id_asignacion, dataReport}: {id_consulta: number, id_asignacion: string, dataReport: IDataReport} = req.body;

    if(!dataReport){
        return res.status(404).json({
            error: 'Datos para el reporte no proporcionados.'
        });
    }

    try {
        const response: string = await removeRegistersAndCreateOneIntoReports(user_data.id_user, id_consulta, id_asignacion, dataReport);

        res.status(200).json({
            message: response
        });
    } catch (error: any) {
        res.status(500).json({
            error: `Internal server error: ${error.message}`
        });
    }
}

export {
    getCitadosAndConsultaController,
    scheduledPatientsController,
    shiftAsignadoController,
    currentAssignatedPatientControler,
    newShiftController,
    removeRegistersAndCreateOneIntoReportsController,
    latestShiftNumberController,
    numberOfSchedulePatientsController
};