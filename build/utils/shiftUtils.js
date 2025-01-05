"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incrementCode = void 0;
const incrementCode = (code) => {
    // Separate the initial letter from the number
    const letra = code[0];
    const numero = parseInt(code.slice(1), 10);
    if (isNaN(numero)) {
        throw new Error('El formato del código no es válido.');
    }
    // Increment the number by 1
    const nuevoNumero = numero + 1;
    // Format new number with leading zeros (5 digits)
    const nuevoCodigo = `${letra}${nuevoNumero.toString().padStart(4, '0')}`;
    return nuevoCodigo;
};
exports.incrementCode = incrementCode;
