"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDateTime = formatDateTime;
exports.todaysDate = todaysDate;
function formatDateTime() {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0'); // Día con dos dígitos
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Mes con dos dígitos (mes es base 0)
    const year = date.getFullYear(); // Año completo
    const hours = String(date.getHours()).padStart(2, '0'); // Horas con dos dígitos
    const minutes = String(date.getMinutes()).padStart(2, '0'); // Minutos con dos dígitos
    const seconds = String(date.getSeconds()).padStart(2, '0'); // Segundos con dos dígitos
    return `${day}/${month}/${year} - ${hours}:${minutes}:${seconds}`;
}
function todaysDate() {
    const now = new Date(); // Hora actual
    // Ajustamos la fecha para que sea 00:00:00 del día actual
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    // Ajustamos la fecha para que sea 23:59:59 del día actual
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));
    // Convertir ambas fechas a UTC (lo que Prisma espera)
    const startOfDayUtc = new Date(startOfDay.toISOString());
    const endOfDayUtc = new Date(endOfDay.toISOString());
    return { startOfDay: startOfDayUtc, endOfDay: endOfDayUtc };
}
