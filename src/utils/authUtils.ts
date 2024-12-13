import { IUser, IUserDataFields, UserDataFields } from '../interfaces/IUser';
import { SERVER } from '../config/config';
import prisma from '../config/prismaClient';
import jwt from 'jsonwebtoken';

// this function helps me creating jwt's...
const token = (user: IUser, duration_time: string): string => {
    return jwt.sign(
        {
            id_user: user.id_user,
            user_name: user.user_name,
            nombre: user.nombre1,
            apellido: user.apellido1,
            type: user.type
        },
        SERVER.JWT_KEY,
        { expiresIn: duration_time}
    );
}

// refresh token...
const generateRefreshToken = async (user: IUser) => {
    const refreshToken: string = token(user, SERVER.JWT_RE_TIME);

    // storage the refresh token...
    await prisma.refresh_tokens.create({
        data: {
            id_user: user.id_user,
            token: refreshToken
        }
    });

    return refreshToken;
}

const recoveryToken = (id: string): string => {
    return jwt.sign(
        {
            id_user: id
        },
        SERVER.JWT_KEY,
        { expiresIn: '2m' }
    );
}

const extractUserInfo = (token: string, field: UserDataFields): string | null => {
    try {
        // verify and decodify the token...
        const decoded: any = jwt.verify(token, SERVER.JWT_KEY);

        // returns the required data...
        return decoded[field] || null;
    } catch (error: any) {
        console.log(`Error al decodificar el token: ${error.message}`)
        return null;
    }
}

const extractAllUserInfo = (token: string): IUserDataFields | null => {
    try {
        // verify and decodify the token...
        const decoded: any = jwt.verify(token, SERVER.JWT_KEY);

        // returns the required data...
        return decoded;
    } catch (error: any) {
        console.log(`Error al decodificar el token: ${error.message}`)
        return null;
    }
}

export { token, generateRefreshToken, recoveryToken, extractUserInfo, extractAllUserInfo };