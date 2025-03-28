"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelService = cancelService;
const unauthorized_error_1 = require("http/_errors/unauthorized-error");
const auth_1 = require("http/middlewares/auth");
const prisma_1 = require("lib/prisma");
const zod_1 = __importDefault(require("zod"));
async function cancelService(app) {
    app
        .withTypeProvider()
        .register(auth_1.auth)
        .delete('/services/cancel/:id', {
        schema: {
            tags: ['services'],
            summary: 'Cancelar um atendimento enquanto em aberto',
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
            throw new unauthorized_error_1.UnauthorizedError('O serviço solicitado não foi localizado em nossa base de dados. Por favor, verifique as informações e tente novamente.');
        }
        if (service.status !== 'OPEN') {
            throw new unauthorized_error_1.UnauthorizedError('O serviço solicitado já foi finalizado. Por favor, verifique as informações e tente novamente.');
        }
        try {
            await prisma_1.prisma.services.delete({
                where: { id },
            });
            return reply.status(204).send();
        }
        catch (err) {
            throw new unauthorized_error_1.UnauthorizedError('Ocorreu um erro para cancelar o atendimento. Por favor, verifique os dados informados e tente novamente.');
        }
    });
}
