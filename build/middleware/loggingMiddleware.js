"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggingHandler = void 0;
const loggingHandler = (req, res, next) => {
    logging.log(`Incomming - METHOD: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.address}]`);
    res.on('finish', () => {
        logging.log(`Incomming - METHOD: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.address}] - STATUS [${res.status}]`);
    });
    next();
};
exports.loggingHandler = loggingHandler;
