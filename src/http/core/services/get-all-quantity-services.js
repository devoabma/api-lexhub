"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllQuantityServices = getAllQuantityServices;
const auth_1 = require("http/middlewares/auth");
const prisma_1 = require("lib/prisma");
const zod_1 = __importDefault(require("zod"));
async function getAllQuantityServices(app) {
    app
        .withTypeProvider()
        .register(auth_1.auth)
        .get('/services/general', {
        schema: {
            tags: ['services'],
            summary: 'Busca todos os atendimentos cadastrados geral',
            security: [{ bearerAuth: [] }],
            response: {
                200: zod_1.default.object({
                    total: zod_1.default.number(),
                }),
            },
        },
    }, async (request, reply) => {
        await request.getCurrentAgentId();
        const services = await prisma_1.prisma.services.count();
        return reply.status(200).send({ total: services });
    });
}
