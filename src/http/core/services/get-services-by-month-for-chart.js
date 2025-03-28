"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServicesByMonthForChart = getServicesByMonthForChart;
const bad_request_error_1 = require("http/_errors/bad-request-error");
const auth_1 = require("http/middlewares/auth");
const prisma_1 = require("lib/prisma");
const zod_1 = __importDefault(require("zod"));
async function getServicesByMonthForChart(app) {
    app
        .withTypeProvider()
        .register(auth_1.auth)
        .get('/services/monthly', {
        schema: {
            tags: ['services'],
            summary: 'Busca a quantidade de atendimentos por mês',
            security: [{ bearerAuth: [] }],
            response: {
                200: zod_1.default.array(zod_1.default.object({
                    data: zod_1.default.string(),
                    services: zod_1.default.number(),
                })),
            },
        },
    }, async (request, reply) => {
        await request.getCurrentAgentId();
        try {
            const services = await prisma_1.prisma.services.groupBy({
                by: ['createdAt'],
                _count: {
                    id: true,
                },
                orderBy: {
                    createdAt: 'asc',
                },
            });
            const months = [
                'Jan',
                'Fev',
                'Mar',
                'Abr',
                'Mai',
                'Jun',
                'Jul',
                'Ago',
                'Set',
                'Out',
                'Nov',
                'Dez',
            ];
            const formattedData = months.map((month, index) => {
                const monthData = services.filter(service => new Date(service.createdAt).getMonth() === index);
                return {
                    data: month,
                    services: monthData.reduce((sum, service) => sum + service._count.id, 0),
                };
            });
            return reply.status(200).send(formattedData);
        }
        catch (err) {
            throw new bad_request_error_1.BadRequestError('Ocorreu um erro ao tentar recuperar os atendimentos mensais. Por favor, tente novamente mais tarde.');
        }
    });
}
