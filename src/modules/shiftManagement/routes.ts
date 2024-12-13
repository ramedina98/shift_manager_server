/**
 * @module shiftManagement
 *
 * Routes...
 */
import { Router } from "express";
import {
    getCitadosAndConsultaController,
    shiftAsignadoController,
    currentAssignatedPatientControler,
    newShiftController,
    removeRegistersAndCreateOneIntoReportsController,
    latestShiftNumberController
} from "./shiftControllers";
import checkRevokedToken from "../../middleware/checkRevokedTokensMiddleware";

const shiftRouter = Router();

// GET...
shiftRouter.get('/', getCitadosAndConsultaController);
shiftRouter.get('/current-shift/', checkRevokedToken, currentAssignatedPatientControler);
shiftRouter.get('/last-shift/', checkRevokedToken, latestShiftNumberController);
// POST...
shiftRouter.post('/next-shifts/', checkRevokedToken, shiftAsignadoController);
shiftRouter.post('/newShift/', newShiftController);
// DELETE...
shiftRouter.delete('/finish-shift/', checkRevokedToken, removeRegistersAndCreateOneIntoReportsController);

export default shiftRouter;