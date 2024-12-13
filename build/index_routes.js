"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = allRoutes;
/**
 * @routes
 *
 * This file contains all the necessary routes for the management of all
 * the api endpoints. This way I have a correct order of all of them...
 */
const routes_1 = __importDefault(require("./modules/auth/routes"));
const routes_2 = __importDefault(require("./modules/users/routes"));
const routes_3 = __importDefault(require("./modules/shiftManagement/routes"));
function allRoutes(app) {
    // auth routes...
    app.use('/auth', routes_1.default);
    // user routes...
    app.use('/user', routes_2.default);
    // shift routes...
    app.use('/shifts', routes_3.default);
}
