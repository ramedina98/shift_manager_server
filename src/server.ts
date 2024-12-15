import app from "./app";
import { createServer } from "http";
import { SERVER } from "./config/config";
import configureWebSocket from "./webSocketServer";
import logging from "./config/logging";

const server = createServer(app);

export const wss = configureWebSocket(server);

// set the por from enviroment variables or default to 3000...
const PORT: any = process.env.PORT || SERVER.SERVER_PORT;
// log a message when the server start listening...
server.listen(PORT, "0.0.0.0", () => {
    logging.info('----------------------------------------------');
    logging.info(`Server running on port http://localhost:${PORT}`);
    logging.info('----------------------------------------------');
});