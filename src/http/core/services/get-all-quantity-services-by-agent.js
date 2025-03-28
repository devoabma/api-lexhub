"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllQuantityServicesByAgent = getAllQuantityServicesByAgent;
const dayjs_1 = __importDefault(require("dayjs"));
const auth_1 = require("http/middlewares/auth");
const prisma_1 = require("lib/prisma");
const zod_1 = require("zod");
async function getAllQuantityServicesByAgent(app) {
    app
        .withTypeProvider()
        .register(auth_1.auth)
        .get('/services/general/agent/:id', {
        schema: {
            tags: ['services'],
            summary: 'Busca todos os atendimentos cadastrados de um funcionário',
            security: [{ bearerAuth: [] }],
            params: zod_1.z.object({
                id: zod_1.z.string().uuid(),
            }),
            response: {
                200: zod_1.z.object({
                    totalGeneral: zod_1.z.number(),
                    totalOnMonth: zod_1.z.number(),
                    totalOnPreviousMonth: zod_1.z.number(),
                }),
            },
        },
    }, async (request, reply) => {
        await request.getCurrentAgentId();
        const { id } = request.params;
        // Obtém o total geral de atendimentos do funcionário
        const servicesByAgent = await prisma_1.prisma.services.count({
            where: {
                agentId: id,
            },
        });
        // Obtém a data atual
        const now = (0, dayjs_1.default)();
        // Obtém o primeiro dia do mês atual
        const startOfMonth = now.startOf('month').toDate();
        // Obtém o último dia do mês atual
        const endOfMonth = now.endOf('month').toDate();
        // Obtém o total de atendimentos no mês do funcionário
        const servicesInMonth = await prisma_1.prisma.services.count({
            where: {
                agentId: id,
                createdAt: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
            },
        });
        const startOfPreviousMonth = now
            .subtract(1, 'month')
            .startOf('month')
            .toDate();
        const endOfPreviousMonth = now
            .subtract(1, 'month')
            .endOf('month')
            .toDate();
        // Obtém o total de atendimentos no mês anterior do funcionário
        const servicesInPreviousMonth = await prisma_1.prisma.services.count({
            where: {
                agentId: id,
                createdAt: {
                    gte: startOfPreviousMonth,
                    lte: endOfPreviousMonth,
                },
            },
        });
        return reply.status(200).send({
            totalGeneral: servicesByAgent,
            totalOnMonth: servicesInMonth,
            totalOnPreviousMonth: servicesInPreviousMonth,
        });
    });
}
