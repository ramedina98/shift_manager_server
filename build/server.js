"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config/config");
require("./webSocketServer");
const logging_1 = __importDefault(require("./config/logging"));
// set the por from enviroment variables or default to 3000...
const PORT = process.env.PORT || config_1.SERVER.SERVER_PORT;
// log a message when the server start listening...
app_1.default.listen(PORT, "0.0.0.0", () => {
    logging_1.default.info('----------------------------------------------');
    logging_1.default.info(`Server running on port http://localhost:${PORT}`);
    logging_1.default.info('----------------------------------------------');
});
