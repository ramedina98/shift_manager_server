// This file contains all the interfaces of the module shift management

export enum tipo_paciente {
    PRIMERA = 'primera_vez',
    SUBSE = 'subsecuente'
}

export interface ICita {
    id_cita: string;
    id_consulta: number;
    id_doc: string;
    hora_cita: Date;
}

export interface IConsulta {
    id_consulta: number;
    nombre_paciente: string;
    apellido_paciente: string;
    tipo_paciente: string;
    turno: string;
    citado: boolean;
    activo: boolean;
    create_at: Date;
}

export interface IAsignado {
    id_asignacion: string;
    id_consulta: number;
    id_doc: string;
}

export interface IConsultorio {
    id_asignacion: string;
    id_doc: string;
    num_consultorio: number;
    fecha: Date;
}

export interface ICitas {
    nombre_doc: string;
    apellido_doc: string; // paterno...
    nombre_paciente: string;
    apellido_paciente: string;
    turno: string;
    hora_citas: Date;
}

export interface IConsultas {
    nombre_paciente: string;
    apellido_paciente: string;
    turno: string;
}

export interface IAsignados {
    id_consulta?: number;
    nombre_doc: string;
    apellido_doc: string; // paterno...
    nombre_paciente: string;
    apellido_paciente: string;
    hora_cita?: Date;
    turno: string;
    consultorio: number;
    visita?: string;
    create_at?: Date;
    id_asignacion: string;
}

export interface IPaciente {
    id_consulta: number;
    nombre_paciente: string;
    apellido_paciente: string;
    tipo_paciente: string;
    turno: string;
    citado: boolean;
    activo: boolean;
}
export interface IPacienteNoId extends Omit<IPaciente, 'id_consulta'>{};
export interface IPacienteCitado extends Omit<IPaciente, 'id_consulta'>{
    id_doc: string;
    nombre_doc: string;
    apellido_doc: string;
    hora_cita: Date;
};


export interface IShifts {
    citas: ICitas[]; // campo para mostrar citas
    consultas: IConsultas[]; // campos para mostrar los demás turnos en espera
    asignados: IAsignados[]; // campos para mostrar los turnos que estan siendo atendidos...
}

export interface IShiftsTicketData {
    paciente_nombre: string;
    turno: string;
    datatime: string;
}

export interface IDataReport {
    consultorio: number;
    turno: string;
    nombre_paciente: string;
    visita: string;
    fecha_hora: Date;
}

export interface IReport {
    id_reporte: number;
    consultorio: number;
    turno: string
    nombre_paciente: string;
    doctor: string;
    visita: string;
    fecha_hora: Date;
}