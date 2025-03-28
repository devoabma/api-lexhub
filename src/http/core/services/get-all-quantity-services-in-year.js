"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllQuantityServicesInYear = getAllQuantityServicesInYear;
const dayjs_1 = __importDefault(require("dayjs"));
const auth_1 = require("http/middlewares/auth");
const prisma_1 = require("lib/prisma");
const zod_1 = __importDefault(require("zod"));
async function getAllQuantityServicesInYear(app) {
    app
        .withTypeProvider()
        .register(auth_1.auth)
        .get('/services/general/year', {
        schema: {
            tags: ['services'],
            summary: 'Busca todos os atendimentos cadastrados no ano atual',
            security: [{ bearerAuth: [] }],
            response: {
                200: zod_1.default.object({
                    totalCurrentYear: zod_1.default.number(),
                    totalPreviousYear: zod_1.default.number(),
                }),
            },
        },
    }, async (request, reply) => {
        await request.getCurrentAgentId();
        // Obtém a data atual
        const now = (0, dayjs_1.default)();
        // Obtém o primeiro dia do ano atual
        const startOfYear = now.startOf('year').toDate();
        // Obtém o último dia do ano atual
        const endOfYear = now.endOf('year').toDate();
        // Conta os atendimentos que foram criados no ano atual
        const servicesInYear = await prisma_1.prisma.services.count({
            where: {
                createdAt: {
                    gte: startOfYear,
                    lte: endOfYear,
                },
            },
        });
        // Lógica para o mês anterior
        const startOfPreviousYear = now
            .subtract(1, 'year')
            .startOf('year')
            .toDate();
        const endOfPreviousYear = now.subtract(1, 'year').endOf('year').toDate();
        const previousYearServices = await prisma_1.prisma.services.count({
            where: {
                createdAt: {
                    gte: startOfPreviousYear,
                    lte: endOfPreviousYear,
                },
            },
        });
        return reply.status(200).send({
            totalCurrentYear: servicesInYear,
            totalPreviousYear: previousYearServices,
        });
    });
}
