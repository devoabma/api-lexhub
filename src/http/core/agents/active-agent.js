"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activeAgent = activeAgent;
const unauthorized_error_1 = require("http/_errors/unauthorized-error");
const auth_1 = require("http/middlewares/auth");
const prisma_1 = require("lib/prisma");
const zod_1 = __importDefault(require("zod"));
async function activeAgent(app) {
    app
        .withTypeProvider()
        .register(auth_1.auth)
        .patch('/agents/active/:id', {
        schema: {
            tags: ['agents'],
            summary: 'Ativação de um funcionário',
            security: [{ bearerAuth: [] }],
            params: zod_1.default.object({
                id: zod_1.default.string().uuid(),
            }),
            response: {
                204: zod_1.default.null(),
            },
        },
    }, async (request, reply) => {
        // Somente administradores podem ativar funcionários
        await request.checkIfAgentIsAdmin();
        const { id } = request.params;
        const agent = await prisma_1.prisma.agent.findUnique({
            where: { id },
        });
        if (!agent) {
            throw new unauthorized_error_1.UnauthorizedError('O funcionário não foi encontrado. Verifique os dados informados e tente novamente.');
        }
        try {
            await prisma_1.prisma.agent.update({
                where: {
                    id,
                },
                data: {
                    inactive: null,
                    updatedAt: new Date(),
                },
            });
            return reply.status(204).send();
        }
        catch (err) {
            throw new unauthorized_error_1.UnauthorizedError('Não foi possível inativar o funcionário. Tente novamente mais tarde.');
        }
    });
}
