import app from "./app";
import { SERVER } from "./config/config";
import "./webSocketServer";
import logging from "./config/logging";

// set the por from enviroment variables or default to 3000...
const PORT: any = process.env.PORT || SERVER.SERVER_PORT;

// log a message when the server start listening...
app.listen(PORT, "0.0.0.0", () => {
    logging.info('----------------------------------------------');
    logging.info(`Server running on port http://localhost:${PORT}`);
    logging.info('----------------------------------------------');
});