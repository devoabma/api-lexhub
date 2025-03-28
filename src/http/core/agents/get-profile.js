"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = getProfile;
const bad_request_error_1 = require("http/_errors/bad-request-error");
const auth_1 = require("http/middlewares/auth");
const prisma_1 = require("lib/prisma");
const zod_1 = __importDefault(require("zod"));
async function getProfile(app) {
    app
        .withTypeProvider()
        .register(auth_1.auth)
        .get('/agents/profile', {
        schema: {
            tags: ['agents'],
            summary: 'Busca o perfil de um funcionário logado',
            security: [{ bearerAuth: [] }],
            response: {
                200: zod_1.default.object({
                    agent: zod_1.default.object({
                        id: zod_1.default.string().uuid(),
                        name: zod_1.default.string(),
                        email: zod_1.default.string().email(),
                        role: zod_1.default.enum(['ADMIN', 'MEMBER']),
                    }),
                }),
            },
        },
    }, async (request, reply) => {
        const agentId = await request.getCurrentAgentId();
        // Retorna o usuário somente com os dados necessários
        const agent = await prisma_1.prisma.agent.findUnique({
            where: {
                id: agentId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        });
        if (!agent) {
            throw new bad_request_error_1.BadRequestError('Funcionário não encontrado. Verifique os dados e tente novamente.');
        }
        return reply.status(200).send({ agent });
    });
}
