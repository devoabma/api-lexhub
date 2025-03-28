"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRecoveryCode = generateRecoveryCode;
function generateRecoveryCode(length = 6) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    // Gera o código aleatório com base na quantidade desejada
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        code += characters[randomIndex];
    }
    return code;
}
