import { createServer } from "http";
import { SERVER } from "./config/config";
import { redis } from "./config/redisLock";
import configureWebSocket from "./webSocketServer";
import logging from "./config/logging";
import app from "./app";

const server = createServer(app);

export const wss = configureWebSocket(server);

// verify redis conecction...
redis.on("connect", () => {
    logging.info("Redis conectado exitosamente.");
});
// if there is any error...
redis.on("error", (err) => {
    logging.error("Error al conectar a Redis: ", err);
});

// set the por from enviroment variables or default to 3000...
const PORT: any = process.env.PORT || SERVER.SERVER_PORT;
// log a message when the server start listening...
server.listen(PORT, "0.0.0.0", () => {
    logging.info('----------------------------------------------');
    logging.info(`Server running on port http://localhost:${PORT}`);
    logging.info('----------------------------------------------');
});