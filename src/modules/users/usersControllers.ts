/**
 * @module users
 *
 * This file contains all the require controllers to handle all the endpoints of the
 * users module...
 */
import { Request, Response } from "express";
import { IDoctosList, INoUserIdandPasswordRequired, INoUserIdPasswordandFotoRequired, IUserPasswords } from "../../interfaces/IUser";
import {
    getUser,
    updateUser,
    updateAssignedOffice,
    updatePassword,
    getAllDoctors,
} from "./usersServices";


/**
 * @method GET
 *
 * This controller helps me to handle the process of obtain info of a specific user, using the
 * token session...
 */
const getUserController = async (req: Request, res: Response): Promise<any> => {
    const user_data = req.user;

    try {
        // start the process...
        const result: INoUserIdandPasswordRequired | number = await getUser(user_data.id_user);

        if(result === 404){
            return res.status(result).json({
                message: 'Usuario no encontrado.'
            });
        }

        // return a 200 code, success...
        return res.status(200).json({
            message: 'Usuario encontrado con exito.',
            result
        });

    } catch (error: any) {
        return res.status(500).json({
            error: `Internal server error: ${error.message}`
        });
    }
}

/**
 * @method PUT
 *
 * This controller handle the process of update an specific user, except their password and photo, that's
 * separate...
 */
const updateUserController = async (req: Request, res: Response): Promise<any> => {
    // deconstruting the req.body to botain the token, user_data and password...
    const { data }: { data: INoUserIdPasswordandFotoRequired } = req.body;
    const user_data = req.user;

    // check if the datas was sent...
    if(!data) return res.status(400).json({ error: 'Data no provided.' });

    try {
        const result: string | number = await updateUser(user_data.id_user, data);

        // check the type of result, if result = number,
        if(typeof result === 'number'){
            let message = '';

            if(result === 404){
                message = 'Usuario no encontrado.'
            }

            return res.status(result).json({
                message
            });
        }

        // if is not type of = number, and is a string, return the message of success...
        return res.status(201).json({
            message: result
        });

    } catch (error: any) {
        return res.status(500).json({
            error: `Internal server error: ${error.message}`
        });
    }
}

/**
 * @method PUT
 *
 * This controller helps me to handle upate the password of a user, it recieve the
 * session token, the new and the old password to do the process...
 */
const updatePasswordController = async (req: Request, res: Response): Promise<any> => {
    // deconstruting the req.body to obtain the token, old and new password...
    const { passwords }: { passwords: IUserPasswords } = req.body;
    const user_data = req.user;

    // check if the data was recieved correctly...
    if(!passwords.oldPass || !passwords.newPass) return res.status(400).json({ error: 'Data not provied.'});

    try {
        const result: string | number = await updatePassword(user_data.id_user, passwords);

        // check the type of result, if result = number,
        if(typeof result === 'number'){
            let message = '';

            if(result === 404){
                message = 'Usuario no encontrado.'
            } else if(result === 401){
                message = 'Contraseña incorrecta.'
            }

            return res.status(result).json({
                message
            });
        }

        // if is not type of = number, and is a string, return the message of success...
        return res.status(201).json({
            message: result
        });

    } catch (error: any) {
        return res.status(500).json({
            error: `Internal server error: ${error.message}`
        });
    }
}

/**
 * @method PUT
 *
 * This controller handle the process of update the register of a specific
 * asigned office...
 */
const updateAssignedOfficeController = async (req: Request, res: Response): Promise<any> => {
    const {id_asign_consu, num_consultorio}: {id_asign_consu: string, num_consultorio: number} = req.body;

    if(!id_asign_consu || num_consultorio === 0){
        return res.status(404).json({ error: 'Datos no proporcionados.' });
    }

    try {
        const response: string | number = await updateAssignedOffice(id_asign_consu, num_consultorio);

        if(typeof response === 'number'){
            return res.status(400).json({
                error: 'Numero de consultorio no actualizado.'
            });
        }

        return res.status(201).json({
            message: `Actualización exitosa, consultorio Num. ${num_consultorio}`
        });
    } catch (error: any) {
        return res.status(500).json({
            error: `Internal server error: ${error.message}`
        });
    }
}

/**
 * @method GET
 *
 * Controller to handle the process of obtain a list of doctors in the clinic...
 */
const getAllDoctorsController = async (_req:Request, res:Response): Promise<any> => {
    try {
        const response: IDoctosList[] | number = await getAllDoctors();

        if(typeof response === 'number'){
            return res.status(response).json({ error: 'No se encontro registro.' });
        }

        return res.status(200).json({
            message: 'Datos obtenidos con exito',
            data: response
        });
    } catch (error: any) {
        return res.status(500).json({
            error: `Internal server error: ${error.message}`
        });
    }
}

export { getUserController, updateUserController, updatePasswordController, updateAssignedOfficeController, getAllDoctorsController };