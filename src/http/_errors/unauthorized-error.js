"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnauthorizedError = void 0;
class UnauthorizedError extends Error {
    constructor(message) {
        super(message ?? ' Acesso não autorizado, tente novamente.');
    }
}
exports.UnauthorizedError = UnauthorizedError;
