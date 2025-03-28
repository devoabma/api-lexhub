"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.finishedService = finishedService;
const unauthorized_error_1 = require("http/_errors/unauthorized-error");
const auth_1 = require("http/middlewares/auth");
const prisma_1 = require("lib/prisma");
const zod_1 = __importDefault(require("zod"));
async function finishedService(app) {
    app
        .withTypeProvider()
        .register(auth_1.auth)
        .patch('/services/finished/:id', {
        schema: {
            tags: ['services'],
            summary: 'Finalizar um atendimento',
            security: [{ bearerAuth: [] }],
            params: zod_1.default.object({
                id: zod_1.default.string().uuid(),
            }),
            response: {
                204: zod_1.default.null(),
            },
        },
    }, async (request, reply) => {
        await request.getCurrentAgentId();
        const { id } = request.params;
        const service = await prisma_1.prisma.services.findUnique({
            where: { id },
        });
        if (!service) {
            throw new unauthorized_error_1.UnauthorizedError('O atendimento não foi encontrado. Verifique os dados e tente novamente.');
        }
        if (service.status === 'COMPLETED') {
            throw new unauthorized_error_1.UnauthorizedError('O atendimento já foi finalizado. Verifique os dados e tente novamente.');
        }
        try {
            await prisma_1.prisma.services.update({
                where: {
                    id,
                },
                data: {
                    finishedAt: new Date(),
                    status: 'COMPLETED',
                },
            });
            return reply.status(204).send();
        }
        catch (err) {
            throw new unauthorized_error_1.UnauthorizedError(' Ocorreu um erro ao finalizar o atendimento. Por favor, tente novamente mais tarde.');
        }
    });
}
