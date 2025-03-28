"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const _env_1 = require("http/_env");
exports.prisma = new client_1.PrismaClient({
    // Gera logs de queries apenas em ambiente de desenvolvimento
    log: _env_1.env.NODE_ENV === 'DEVELOPMENT' ? ['query'] : [],
});
