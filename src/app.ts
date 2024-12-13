// express framewokr...
import express from 'express';
// cors middleware to handle cross-origin request...
import cors from 'cors';
import cookieParser from 'cookie-parser';
//loggings...
import logging from './config/logging';
//middleware to handle the loggings...
import { loggingHandler } from './middleware/loggingMiddleware';
import { SERVER } from './config/config';
import { routeNotFound } from './middleware/routeNotFoundMiddleware';
import allRoutes from './index_routes';

//create an instance of the express application...
const app = express();
// use cors...
const corsOptions = {
    origin: SERVER.FRONT_SERVER,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Authorization',
        'Content-Type',
    ],
}

app.use(cors(corsOptions));

//
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
// use middleware to parse JSON request bodies...
app.use(express.json());

//Logging handler here...
logging.info('Logging & configuration');
app.use(loggingHandler);

allRoutes(app);

//this middleware helps us to send an error messages if any route doesn't exist...
app.use(routeNotFound);

// global error handler...
app.use((err: any, _req: any, res: any, _next: any) => {
    logging.error(err.stack);
    res.status(500).json({ message: 'Internal server error.'});
});

export default app;