export interface IUser {
    id_user: string;
    nombre1: string;
    nombre2: string;
    apellido1: string;
    apellido2: string;
    email: string;
    user_name: string;
    password: string;
    foto?: Buffer;
    type: string;
}

export interface IUserNoId extends Omit<IUser, 'id_user' | 'foto'>{
    foto: string;
};

export interface INoUserIdandPasswordRequired extends Omit<IUser, 'id_user' | 'password'>{};
export interface INoUserIdPasswordandFotoRequired extends Omit<IUser, 'id_user' | 'password' | 'foto'>{};

export interface ISissionData{
    user_name: string;
    password: string;
}

export interface IEmailUsername {
    user_name: string[];
    email: string[];
}

export interface IUserPasswords{
    oldPass: string;
    newPass: string;
}

export interface IUserDataFields {
    id_user: string,
    user_name: string,
    nombre: string,
    apellido: string,
    type: string
}

export enum UserDataFields {
    ID_USER = 'id_user',
    USER_NAME = 'user_name',
    NOMBRE = 'nombre',
    APELLIDO = 'apellido',
    TYPE = 'type',
}

export interface Iasignacion_consultorio {
    id_asignacion: string;
    id_doc: string;
    num_consultorio: number
    fecha: Date;
}

export interface IDoctosList {
    id_doc: string;
    nombre_doc: string;
    apellido_doc: string;
}