"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServiceExternal = createServiceExternal;
const unauthorized_error_1 = require("http/_errors/unauthorized-error");
const auth_1 = require("http/middlewares/auth");
const prisma_1 = require("lib/prisma");
const zod_1 = __importDefault(require("zod"));
async function createServiceExternal(app) {
    app
        .withTypeProvider()
        .register(auth_1.auth)
        .post('/services/external', {
        schema: {
            tags: ['servicesExternal'],
            summary: 'Criação de um novo serviço externo',
            security: [{ bearerAuth: [] }],
            body: zod_1.default.object({
                oab: zod_1.default.string(),
                name: zod_1.default.string(),
                email: zod_1.default.string().email(),
                serviceTypeId: zod_1.default.array(zod_1.default.string().cuid()),
                observation: zod_1.default.string().optional(),
                assistance: zod_1.default.enum(['PERSONALLY', 'REMOTE']),
                status: zod_1.default.enum(['OPEN', 'COMPLETED']).default('OPEN'),
            }),
            response: {
                201: zod_1.default.null(),
            },
        },
    }, async (request, reply) => {
        const agentId = await request.getCurrentAgentId();
        const { oab, name, email, serviceTypeId, observation, assistance } = request.body;
        // Verifica se o advogado já está cadastrado no banco de dados
        let lawyer = await prisma_1.prisma.lawyer.findUnique({
            where: {
                oab,
            },
        });
        if (!lawyer) {
            lawyer = await prisma_1.prisma.lawyer.create({
                data: {
                    oab,
                    name,
                    email,
                },
            });
        }
        const serviceTypes = await Promise.all(serviceTypeId.map(async (serviceType) => {
            const type = await prisma_1.prisma.serviceTypes.findUnique({
                where: {
                    id: serviceType,
                },
            });
            if (!type) {
                throw new unauthorized_error_1.UnauthorizedError('Tipo de serviço não encontrado. Verifique os dados e tente novamente.');
            }
            return type;
        }));
        // Cria o atendimento (Service)
        const service = await prisma_1.prisma.services.create({
            data: {
                assistance,
                observation,
                agentId,
                lawyerId: lawyer.id,
            },
        });
        // Associa o Service aos ServiceTypes na tabela ServiceServiceTypes
        await Promise.all(serviceTypes.map(async (serviceType) => {
            await prisma_1.prisma.serviceServiceTypes.create({
                data: {
                    serviceId: service.id,
                    serviceTypeId: serviceType.id,
                },
            });
        }));
        return reply.status(201).send();
    });
}
