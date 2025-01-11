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
exports.latestShiftNumberController = exports.removeRegistersAndCreateOneIntoReportsController = exports.newShiftController = exports.currentAssignatedPatientControler = exports.shiftAsignadoController = exports.scheduledPatientsController = exports.getCitadosAndConsultaController = void 0;
const shiftServices_1 = require("./shiftServices");
/**
 * @method GET
 * This controller obtain the info of citados, asignados y consultas tables...
 */
const getCitadosAndConsultaController = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield (0, shiftServices_1.getCitadosAndConsulta)();
        if (typeof response === 'number') {
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
    }
    catch (error) {
        return res.status(500).json({
            error: `Internal server error: ${error.message}`
        });
    }
});
exports.getCitadosAndConsultaController = getCitadosAndConsultaController;
/**
 * @method GET
 *
 * Latest shift number...
 */
const latestShiftNumberController = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield (0, shiftServices_1.latestShiftNumber)();
        if (typeof response === 'number') {
            return res.status(response).json({
                message: 'No hay turnos creados aun.',
                data: []
            });
        }
        return res.status(200).json({
            message: 'Dato encontrado',
            data: response
        });
    }
    catch (error) {
        return res.status(500).json({
            error: `Internal server error: ${error.message}`
        });
    }
});
exports.latestShiftNumberController = latestShiftNumberController;
/**
 * @method POS
 *
 * This controller manages the service that makes the appointment of patients...
 * @param {session_token}
 */
const scheduledPatientsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user_data = req.user;
    try {
        // feetch the schedule patient...
        const response = yield (0, shiftServices_1.scheduledPatients)(user_data.id_user, user_data.nombre, user_data.apellido);
        // handler cases where no shift is assigned...
        if (typeof response === 'number') {
            return res.status(400).json({
                message: 'No hay turno citados para asignar en este momento.',
                shift: []
            });
        }
        return res.status(200).json({
            message: 'Turno asignado',
            shift: response
        });
    }
    catch (error) {
        return res.status(500).json({
            error: `Internal server error ${error.message}`
        });
    }
});
exports.scheduledPatientsController = scheduledPatientsController;
/**
 * @method POS
 *
 * In the client, they have to click a botton to start this process...
 * @param {Session_token}
 */
const shiftAsignadoController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user_data = req.user;
    try {
        // fetch the assigned shift
        const response = yield (0, shiftServices_1.shiftAsignado)(user_data.id_user, user_data.nombre, user_data.apellido);
        // handler cases where no shift is assigned...
        if (typeof response === 'number') {
            return res.status(404).json({
                message: 'No hay turno para asignar en este momento.',
                shift: []
            });
        }
        return res.status(200).json({
            message: 'Turno asignado',
            shift: response
        });
    }
    catch (error) {
        return res.status(500).json({
            error: `Internal server error ${error.message}`
        });
    }
});
exports.shiftAsignadoController = shiftAsignadoController;
/**
 * @method GET
 *
 * This controller handle the process of retrieve an assignated patient...
 */
const currentAssignatedPatientControler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user_data = req.user;
    try {
        const response = yield (0, shiftServices_1.currentAssignatedPatient)(user_data.id_user, user_data.nombre, user_data.apellido);
        // handler cases where no shift is assigned...
        if (typeof response === 'number') {
            let message = '';
            if (response === 400) {
                message = 'Consulta no encontrada.';
            }
            else if (response === 404) {
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
    }
    catch (error) {
        return res.status(500).json({
            error: `Internal server error ${error.message}`
        });
    }
});
exports.currentAssignatedPatientControler = currentAssignatedPatientControler;
/**
 * @method POST
 *
 * Controller to handle the proces of create a new shift...
 */
const newShiftController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { patien_data } = req.body;
    if (!patien_data) {
        return res.status(400).json({
            error: 'Datos no proporiconados'
        });
    }
    try {
        const response = yield (0, shiftServices_1.newShift)(patien_data.citado, patien_data);
        if (typeof response === 'number') {
            return res.status(404).json({
                error: 'Ha ocurrido un error al crear el turno, intente nuevamente.',
            });
        }
        return res.status(201).json({
            response
        });
    }
    catch (error) {
        return res.status(500).json({
            error: `Internal server error ${error.message}`
        });
    }
});
exports.newShiftController = newShiftController;
/**
 * @method DELETE
 *
 * this controller handle the process of delete the following registers (citados, consultas, asignados)...
 */
const removeRegistersAndCreateOneIntoReportsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user_data = req.user;
    const { id_consulta, id_asignacion, dataReport } = req.body;
    if (!dataReport) {
        return res.status(404).json({
            error: 'Datos para el reporte no proporcionados.'
        });
    }
    try {
        const response = yield (0, shiftServices_1.removeRegistersAndCreateOneIntoReports)(user_data.id_user, id_consulta, id_asignacion, dataReport);
        res.status(200).json({
            message: response
        });
    }
    catch (error) {
        res.status(500).json({
            error: `Internal server error: ${error.message}`
        });
    }
});
exports.removeRegistersAndCreateOneIntoReportsController = removeRegistersAndCreateOneIntoReportsController;
