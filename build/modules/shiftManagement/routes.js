"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module shiftManagement
 *
 * Routes...
 */
const express_1 = require("express");
const shiftControllers_1 = require("./shiftControllers");
const checkRevokedTokensMiddleware_1 = __importDefault(require("../../middleware/checkRevokedTokensMiddleware"));
const shiftRouter = (0, express_1.Router)();
// GET...
shiftRouter.get('/', shiftControllers_1.getCitadosAndConsultaController);
shiftRouter.get('/current-shift/', checkRevokedTokensMiddleware_1.default, shiftControllers_1.currentAssignatedPatientControler);
shiftRouter.get('/last-shift/', checkRevokedTokensMiddleware_1.default, shiftControllers_1.latestShiftNumberController);
// POST...
shiftRouter.post('/schedule-patient/', checkRevokedTokensMiddleware_1.default, shiftControllers_1.scheduledPatientsController);
shiftRouter.post('/next-shifts/', checkRevokedTokensMiddleware_1.default, shiftControllers_1.shiftAsignadoController);
shiftRouter.post('/newShift/', shiftControllers_1.newShiftController);
// DELETE...
shiftRouter.delete('/finish-shift/', checkRevokedTokensMiddleware_1.default, shiftControllers_1.removeRegistersAndCreateOneIntoReportsController);
exports.default = shiftRouter;
