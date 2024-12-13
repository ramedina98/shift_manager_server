import { Request, Response, NextFunction } from "express";

export const loggingHandler = (req: Request, res: Response, next: NextFunction) => {
    logging.log(`Incomming - METHOD: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.address}]`);

    res.on('finish', () => {
        logging.log(`Incomming - METHOD: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.address}] - STATUS [${res.status}]`);
    });

    next();
};