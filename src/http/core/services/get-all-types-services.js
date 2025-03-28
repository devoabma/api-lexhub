"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllTypesServices = getAllTypesServices;
const bad_request_error_1 = require("http/_errors/bad-request-error");
const auth_1 = require("http/middlewares/auth");
const prisma_1 = require("lib/prisma");
const zod_1 = __importDefault(require("zod"));
async function getAllTypesServices(app) {
    app
        .withTypeProvider()
        .register(auth_1.auth)
        .get('/services/types/all', {
        schema: {
            tags: ['servicesTypes'],
            summary: 'Busca todos os tipos de serviços cadastrados',
            security: [{ bearerAuth: [] }],
            querystring: zod_1.default.object({
                pageIndex: zod_1.default.coerce.number().default(1),
                id: zod_1.default.string().cuid().optional(),
                name: zod_1.default.string().optional(),
            }),
            response: {
                200: zod_1.default.object({
                    servicesTypes: zod_1.default.array(zod_1.default.object({
                        id: zod_1.default.string().cuid(),
                        name: zod_1.default.string(),
                    })),
                    total: zod_1.default.number(),
                }),
            },
        },
    }, async (request, reply) => {
        // Somente administradores podem listar todos os funcionários
        await request.checkIfAgentIsAdmin();
        const { pageIndex, id, name } = request.query;
        try {
            const [servicesTypes, total] = await Promise.all([
                prisma_1.prisma.serviceTypes.findMany({
                    where: {
                        id: id && { equals: id },
                        name: name
                            ? { contains: name, mode: 'insensitive' }
                            : undefined,
                    },
                    select: {
                        id: true,
                        name: true,
                    },
                    orderBy: [
                        {
                            createdAt: 'desc', // Mostra os tipos de serviços mais recentes primeiro
                        },
                    ],
                    skip: (pageIndex - 1) * 10,
                    take: 10,
                }),
                prisma_1.prisma.serviceTypes.count({
                    where: {
                        id: id && { equals: id },
                        name: name
                            ? { contains: name, mode: 'insensitive' }
                            : undefined,
                    },
                }),
            ]);
            if (!servicesTypes) {
                throw new bad_request_error_1.BadRequestError('Nenhum tipo de serviço cadastrado. Cadastre um para continuar.');
            }
            return reply.status(200).send({ servicesTypes, total });
        }
        catch (err) {
            throw new bad_request_error_1.BadRequestError('Não foi possível recuperar os tipos de serviços. Tente novamente mais tarde.');
        }
    });
}
