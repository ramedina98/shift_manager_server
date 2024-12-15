// this is the webSokect server...
import { Server } from 'http';
import { WebSocketServer, WebSocket } from "ws";
import logging from "./config/logging";

const configureWebSocket = (server: Server): WebSocketServer => {

    const wss: WebSocketServer = new WebSocketServer({ server });

    wss.on('connection', (ws: WebSocket) => {
        logging.info('[WebSocketServer] New client connected to websocket...');

        ws.on('error', (err) => {
            logging.error(`[WebSocket] Connection error: ${err.message}`);
        });

        ws.on('message', (message) => {
            logging.info(`[WebSocket] Message received from client: ${message}`);

            // Broadcast del mensaje a todos los clientes conectados
            wss.clients.forEach((client: WebSocket) => {
                if (client !== ws && client.readyState === ws.OPEN) {
                    try {
                        client.send(`Server broadcast: ${message}`);
                    } catch (error: any) {
                        logging.error(`[WebSocket] Error sending message: ${error.message}`);
                    }
                }
            });
        });

        ws.on('close', (code, reason) => {
            logging.info(`[WebSocket] Client disconnected (code: ${code}, reason: ${reason})`);
        });
    });

    logging.info('[WebSocketServer] WebSocket server configured successfully.');
    return wss;
};

export default configureWebSocket;