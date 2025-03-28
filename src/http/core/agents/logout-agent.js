"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutAgent = logoutAgent;
const bad_request_error_1 = require("http/_errors/bad-request-error");
const auth_1 = require("http/middlewares/auth");
const prisma_1 = require("lib/prisma");
const zod_1 = __importDefault(require("zod"));
async function logoutAgent(app) {
    app
        .withTypeProvider()
        .register(auth_1.auth)
        .post('/agents/logout', {
        schema: {
            tags: ['agents'],
            summary: 'Desloga o funcionário logado',
            security: [{ bearerAuth: [] }],
            response: {
                200: zod_1.default.null(),
            },
        },
    }, async (request, reply) => {
        const agentId = await request.getCurrentAgentId();
        // Retorna o usuário somente com os dados necessários
        const agent = await prisma_1.prisma.agent.findUnique({
            where: {
                id: agentId,
            },
        });
        if (!agent) {
            throw new bad_request_error_1.BadRequestError(' O funcionário solicitado não foi localizado em nossa base de dados. Por favor, verifique os dados informados e tente novamente.');
        }
        return reply
            .clearCookie('@lexhub-auth', {
            path: '/',
        })
            .status(200)
            .send();
    });
}
