"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wss = void 0;
const http_1 = require("http");
const config_1 = require("./config/config");
const redisLock_1 = require("./config/redisLock");
const webSocketServer_1 = __importDefault(require("./webSocketServer"));
const logging_1 = __importDefault(require("./config/logging"));
const app_1 = __importDefault(require("./app"));
const server = (0, http_1.createServer)(app_1.default);
exports.wss = (0, webSocketServer_1.default)(server);
// verify redis conecction...
redisLock_1.redis.on("connect", () => {
    logging_1.default.info("Redis conectado exitosamente.");
});
// if there is any error...
redisLock_1.redis.on("error", (err) => {
    logging_1.default.error("Error al conectar a Redis: ", err);
});
// set the por from enviroment variables or default to 3000...
const PORT = process.env.PORT || config_1.SERVER.SERVER_PORT;
// log a message when the server start listening...
server.listen(PORT, "0.0.0.0", () => {
    logging_1.default.info('----------------------------------------------');
    logging_1.default.info(`Server running on port http://localhost:${PORT}`);
    logging_1.default.info('----------------------------------------------');
});
