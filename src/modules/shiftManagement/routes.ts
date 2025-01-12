/**
 * @module shiftManagement
 *
 * Routes...
 */
import { Router } from "express";
import {
    getCitadosAndConsultaController,
    scheduledPatientsController,
    shiftAsignadoController,
    currentAssignatedPatientControler,
    newShiftController,
    removeRegistersAndCreateOneIntoReportsController,
    latestShiftNumberController,
    numberOfSchedulePatientsController
} from "./shiftControllers";
import checkRevokedToken from "../../middleware/checkRevokedTokensMiddleware";

const shiftRouter = Router();

// GET...
shiftRouter.get('/', getCitadosAndConsultaController);
shiftRouter.get('/current-shift/', checkRevokedToken, currentAssignatedPatientControler);
shiftRouter.get('/last-shift/', checkRevokedToken, latestShiftNumberController);
shiftRouter.get('/num-schpatients/', checkRevokedToken, numberOfSchedulePatientsController);
// POST...
shiftRouter.post('/schedule-patient/', checkRevokedToken, scheduledPatientsController);
shiftRouter.post('/next-shifts/', checkRevokedToken, shiftAsignadoController);
shiftRouter.post('/newShift/', newShiftController);
// DELETE...
shiftRouter.delete('/finish-shift/', checkRevokedToken, removeRegistersAndCreateOneIntoReportsController);

export default shiftRouter;