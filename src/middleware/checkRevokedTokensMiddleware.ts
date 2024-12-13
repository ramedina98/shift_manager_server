import { Request, Response, NextFunction } from "express";
import { checkIfTokenIsRevoked } from "../modules/auth/authServices";
import { SERVER } from "../config/config";
import jwt from 'jsonwebtoken';

const checkRevokedToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if(!token){
        res.status(401).json({ message: 'No token provided' });
        return;
    }

    try {
        // check if the token is in the revoked tokens table...
        const isRevoked = await checkIfTokenIsRevoked(token);
        if(isRevoked){
            res.status(403).json({ message: 'Sesión expirada.' });
            return;
        }

        // decode the token to retrieve the user information...
        const decoded: any = jwt.verify(token, SERVER.JWT_KEY);
        req.user = decoded;

        next();
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            // El token ha expirado
            res.status(401).json({ message: 'Sesión expirada.' });
        } else {
            // Cualquier otro error de verificación
            res.status(403).json({ message: 'Invalid token' });
        }
    }
}

export default checkRevokedToken;