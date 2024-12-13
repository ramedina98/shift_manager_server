"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// express framewokr...
const express_1 = __importDefault(require("express"));
// cors middleware to handle cross-origin request...
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
//loggings...
const logging_1 = __importDefault(require("./config/logging"));
//middleware to handle the loggings...
const loggingMiddleware_1 = require("./middleware/loggingMiddleware");
const config_1 = require("./config/config");
const routeNotFoundMiddleware_1 = require("./middleware/routeNotFoundMiddleware");
const index_routes_1 = __importDefault(require("./index_routes"));
//create an instance of the express application...
const app = (0, express_1.default)();
// use cors...
const corsOptions = {
    origin: config_1.SERVER.FRONT_SERVER,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Authorization',
        'Content-Type',
    ],
};
app.use((0, cors_1.default)(corsOptions));
//
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ limit: '10mb', extended: true }));
// use middleware to parse JSON request bodies...
app.use(express_1.default.json());
//Logging handler here...
logging_1.default.info('Logging & configuration');
app.use(loggingMiddleware_1.loggingHandler);
(0, index_routes_1.default)(app);
//this middleware helps us to send an error messages if any route doesn't exist...
app.use(routeNotFoundMiddleware_1.routeNotFound);
// global error handler...
app.use((err, _req, res, _next) => {
    logging_1.default.error(err.stack);
    res.status(500).json({ message: 'Internal server error.' });
});
exports.default = app;
