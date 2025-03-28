"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllServices = getAllServices;
const bad_request_error_1 = require("http/_errors/bad-request-error");
const auth_1 = require("http/middlewares/auth");
const prisma_1 = require("lib/prisma");
const zod_1 = __importDefault(require("zod"));
async function getAllServices(app) {
    app
        .withTypeProvider()
        .register(auth_1.auth)
        .get('/services/all', {
        schema: {
            tags: ['services'],
            summary: 'Busca todos os atendimentos cadastrados',
            security: [{ bearerAuth: [] }],
            querystring: zod_1.default.object({
                pageIndex: zod_1.default.coerce.number().default(1),
                oab: zod_1.default.string().optional(),
                lawyerName: zod_1.default.string().optional(),
                agentName: zod_1.default.string().optional(),
                assistance: zod_1.default.enum(['PERSONALLY', 'REMOTE']).optional(), // Filtro por tipo de assistance
                status: zod_1.default.enum(['OPEN', 'COMPLETED']).optional(), // Filtro por status
            }),
            response: {
                200: zod_1.default.object({
                    services: zod_1.default.array(zod_1.default.object({
                        id: zod_1.default.string().uuid(),
                        assistance: zod_1.default.enum(['PERSONALLY', 'REMOTE']),
                        observation: zod_1.default.string().nullable(),
                        status: zod_1.default.enum(['OPEN', 'COMPLETED']),
                        createdAt: zod_1.default.date(),
                        finishedAt: zod_1.default.date().nullable(),
                        lawyer: zod_1.default.object({
                            id: zod_1.default.string().uuid(),
                            name: zod_1.default.string(),
                            oab: zod_1.default.string(),
                            email: zod_1.default.string(),
                        }),
                        agent: zod_1.default.object({
                            id: zod_1.default.string().uuid(),
                            name: zod_1.default.string(),
                            email: zod_1.default.string(),
                            role: zod_1.default.enum(['ADMIN', 'MEMBER']),
                        }),
                        serviceTypes: zod_1.default.array(zod_1.default.object({
                            serviceType: zod_1.default.object({
                                id: zod_1.default.string().cuid(),
                                name: zod_1.default.string(),
                            }),
                        })),
                    })),
                    total: zod_1.default.number(),
                }),
            },
        },
    }, async (request, reply) => {
        await request.getCurrentAgentId();
        const { pageIndex, oab, lawyerName, agentName, assistance, status } = request.query;
        try {
            const [services, total] = await Promise.all([
                prisma_1.prisma.services.findMany({
                    where: {
                        assistance: assistance ? assistance : undefined, // Filtro por assistance
                        status: status ? status : undefined, // Filtro por status
                        lawyer: {
                            oab: oab ? { contains: oab, mode: 'insensitive' } : undefined,
                            name: lawyerName
                                ? { contains: lawyerName, mode: 'insensitive' }
                                : undefined,
                        },
                        agent: {
                            name: agentName
                                ? { contains: agentName, mode: 'insensitive' }
                                : undefined,
                        },
                    },
                    select: {
                        id: true,
                        assistance: true,
                        observation: true,
                        status: true,
                        createdAt: true,
                        finishedAt: true,
                        lawyer: {
                            select: {
                                id: true,
                                name: true,
                                oab: true,
                                email: true,
                            },
                        },
                        agent: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true,
                            },
                        },
                        serviceTypes: {
                            select: {
                                serviceType: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: [
                        { status: 'asc' }, // OPEN antes de COMPLETED
                        { finishedAt: 'desc' }, // Mais recentes primeiro
                        { createdAt: 'desc' }, // Mais recentes primeiro
                    ],
                    skip: (pageIndex - 1) * 10, // Pular os primeiros 10 atendimentos
                    take: 10, // Recuperar apenas 10 atendimentos
                }),
                prisma_1.prisma.services.count({
                    where: {
                        assistance: assistance ? assistance : undefined, // Filtro por assistance
                        status: status ? status : undefined, // Filtro por status
                        lawyer: {
                            oab: oab ? { contains: oab, mode: 'insensitive' } : undefined,
                            name: lawyerName
                                ? { contains: lawyerName, mode: 'insensitive' }
                                : undefined,
                        },
                        agent: {
                            name: agentName
                                ? { contains: agentName, mode: 'insensitive' }
                                : undefined,
                        },
                    },
                }),
            ]);
            if (!services) {
                throw new bad_request_error_1.BadRequestError(' Ainda não existem atendimentos cadastrados.');
            }
            return reply.status(200).send({ services, total });
        }
        catch (err) {
            throw new bad_request_error_1.BadRequestError(' Ocorreu um erro ao tentar recuperar os atendimentos. Por favor, tente novamente mais tarde. Caso o problema persista, entre em contato com o suporte técnico para assistência.');
        }
    });
}
