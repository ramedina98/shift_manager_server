// this is the webSokect server...
import { WebSocketServer } from "ws";
import logging from "./config/logging";

// create websocket server...
const wss = new WebSocketServer({ port: 8081 });

wss.on('connection', (ws) => {
    logging.info("[WebSocketServer] New client connected to websocket...");

    ws.on("error", (err) => {
        logging.error(`[WebSocket] Connection error: ${err.message}`);
    });

    ws.on("message", (message) => {
        logging.info(`[WebSocket] Message received from client: ${message}`);

        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                try {
                    client.send(`Server broadcast: ${message}`);
                } catch (error: any) {
                    logging.error(`[WebSocket] Error sending message: ${error.message}`);
                }
            }
        });
    });

    ws.on("close", (code, reason) => {
        logging.info(`[WebSocket] Client disconnected (code: ${code}, reason: ${reason})`);
    });
});

export default wss;