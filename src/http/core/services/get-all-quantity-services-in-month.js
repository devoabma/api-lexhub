"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllQuantityServicesInMonth = getAllQuantityServicesInMonth;
const dayjs_1 = __importDefault(require("dayjs"));
const auth_1 = require("http/middlewares/auth");
const prisma_1 = require("lib/prisma");
const zod_1 = __importDefault(require("zod"));
async function getAllQuantityServicesInMonth(app) {
    app
        .withTypeProvider()
        .register(auth_1.auth)
        .get('/services/general/month', {
        schema: {
            tags: ['services'],
            summary: 'Busca todos os atendimentos cadastrados no mês atual',
            security: [{ bearerAuth: [] }],
            response: {
                200: zod_1.default.object({
                    totalCurrentMonth: zod_1.default.number(),
                    totalPreviousMonth: zod_1.default.number(),
                }),
            },
        },
    }, async (request, reply) => {
        await request.getCurrentAgentId();
        // Obtém a data atual
        const now = (0, dayjs_1.default)();
        // Obtém o primeiro dia do mês atual
        const startOfMonth = now.startOf('month').toDate();
        // Obtém o último dia do mês atual
        const endOfMonth = now.endOf('month').toDate();
        // Conta os atendimentos que foram criados no mês atual
        const servicesInMonth = await prisma_1.prisma.services.count({
            where: {
                createdAt: {
                    gte: startOfMonth, // maior ou igual ao primeiro dia do mês
                    lte: endOfMonth, // menor ou igual ao último dia do mês
                },
            },
        });
        // Lógica para o mês anterior
        const startOfPreviousMonth = now
            .subtract(1, 'month')
            .startOf('month')
            .toDate();
        const endOfPreviousMonth = now
            .subtract(1, 'month')
            .endOf('month')
            .toDate();
        const previousMonthServices = await prisma_1.prisma.services.count({
            where: {
                createdAt: {
                    gte: startOfPreviousMonth,
                    lte: endOfPreviousMonth,
                },
            },
        });
        return reply.status(200).send({
            totalCurrentMonth: servicesInMonth,
            totalPreviousMonth: previousMonthServices,
        });
    });
}
