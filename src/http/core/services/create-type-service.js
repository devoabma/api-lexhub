"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTypeService = createTypeService;
const bad_request_error_1 = require("http/_errors/bad-request-error");
const auth_1 = require("http/middlewares/auth");
const prisma_1 = require("lib/prisma");
const zod_1 = require("zod");
async function createTypeService(app) {
    app
        .withTypeProvider()
        .register(auth_1.auth)
        .post('/services/types', {
        schema: {
            tags: ['servicesTypes'],
            summary: 'Criação de um novo tipo de serviço',
            security: [{ bearerAuth: [] }],
            body: zod_1.z.object({
                name: zod_1.z.string(),
            }),
            response: {
                201: zod_1.z.null(),
            },
        },
    }, async (request, reply) => {
        // Somente admins podem criar um novo funcionário
        await request.checkIfAgentIsAdmin();
        const { name } = request.body;
        const serviceType = await prisma_1.prisma.serviceTypes.findUnique({
            where: {
                name,
            },
        });
        if (serviceType) {
            throw new bad_request_error_1.BadRequestError('Tipo de serviço já cadastrado. Insira um nome único.');
        }
        await prisma_1.prisma.serviceTypes.create({
            data: {
                name,
            },
        });
        return reply.status(201).send();
    });
}
