"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const logging_1 = __importDefault(require("./config/logging"));
const configureWebSocket = (server) => {
    const wss = new ws_1.WebSocketServer({ server });
    wss.on('connection', (ws) => {
        logging_1.default.info('[WebSocketServer] New client connected to websocket...');
        ws.on('error', (err) => {
            logging_1.default.error(`[WebSocket] Connection error: ${err.message}`);
        });
        ws.on('message', (message) => {
            logging_1.default.info(`[WebSocket] Message received from client: ${message}`);
            // Broadcast del mensaje a todos los clientes conectados
            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === ws.OPEN) {
                    try {
                        client.send(`Server broadcast: ${message}`);
                    }
                    catch (error) {
                        logging_1.default.error(`[WebSocket] Error sending message: ${error.message}`);
                    }
                }
            });
        });
        ws.on('close', (code, reason) => {
            logging_1.default.info(`[WebSocket] Client disconnected (code: ${code}, reason: ${reason})`);
        });
    });
    logging_1.default.info('[WebSocketServer] WebSocket server configured successfully.');
    return wss;
};
exports.default = configureWebSocket;
