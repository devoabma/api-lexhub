"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllTypesServicesWithoutPagination = getAllTypesServicesWithoutPagination;
const bad_request_error_1 = require("http/_errors/bad-request-error");
const auth_1 = require("http/middlewares/auth");
const prisma_1 = require("lib/prisma");
const zod_1 = __importDefault(require("zod"));
async function getAllTypesServicesWithoutPagination(app) {
    app
        .withTypeProvider()
        .register(auth_1.auth)
        .get('/services/types/all-wp', {
        schema: {
            tags: ['servicesTypes'],
            summary: 'Busca todos os tipos de serviços cadastrados sem paginação',
            security: [{ bearerAuth: [] }],
            response: {
                200: zod_1.default.object({
                    servicesTypes: zod_1.default.array(zod_1.default.object({
                        id: zod_1.default.string().cuid(),
                        name: zod_1.default.string(),
                    })),
                }),
            },
        },
    }, async (request, reply) => {
        await request.getCurrentAgentId();
        const servicesTypes = await prisma_1.prisma.serviceTypes.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: [
                {
                    createdAt: 'desc', // Mostra os tipos de serviços mais recentes primeiro
                },
            ],
        });
        if (!servicesTypes) {
            throw new bad_request_error_1.BadRequestError('Nenhum tipo de serviço cadastrado. Cadastre um para continuar.');
        }
        return reply.status(200).send({ servicesTypes });
    });
}
