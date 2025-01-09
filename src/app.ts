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

//
app.use(cookieParser());

// use cors...
// Configuración dinámica para CORS
app.use((req, res, next) => {
    const origin = req.headers.origin; // Captura el origen de la solicitud
    res.setHeader('Access-Control-Allow-Origin', origin || '*'); // Configura el origen permitido
    res.setHeader('Access-Control-Allow-Credentials', 'true'); // Permite credenciales
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS'); // Métodos permitidos
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Cabeceras permitidas
    next();
});

// Manejo de solicitudes OPTIONS para preflight
app.options('*', (req, res) => {
    const origin = req.headers.origin;
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.sendStatus(204); // Respuesta vacía para OPTIONS
});

app.use(express.urlencoded({ extended: true }));

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