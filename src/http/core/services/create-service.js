"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createService = createService;
const unauthorized_error_1 = require("http/_errors/unauthorized-error");
const auth_1 = require("http/middlewares/auth");
const axios_1 = require("lib/axios");
const prisma_1 = require("lib/prisma");
const zod_1 = require("zod");
async function createService(app) {
    app
        .withTypeProvider()
        .register(auth_1.auth)
        .post('/services', {
        schema: {
            tags: ['services'],
            summary: 'Criação de um novo atendimento',
            security: [{ bearerAuth: [] }],
            body: zod_1.z.object({
                oab: zod_1.z.string(),
                serviceTypeId: zod_1.z.array(zod_1.z.string().cuid()),
                observation: zod_1.z.string().optional(),
                assistance: zod_1.z.enum(['PERSONALLY', 'REMOTE']),
                status: zod_1.z.enum(['OPEN', 'COMPLETED']).default('OPEN'),
            }),
            response: {
                201: zod_1.z.null(),
            },
        },
    }, async (request, reply) => {
        const agentId = await request.getCurrentAgentId();
        const { oab, serviceTypeId, observation, assistance } = request.body;
        // Verifica se o advogado já está cadastrado no banco de dados
        let lawyer = await prisma_1.prisma.lawyer.findUnique({
            where: {
                oab,
            },
        });
        // Cria o advogado no banco de dados se ele ainda não estiver cadastrado
        if (!lawyer) {
            const { data: { lawyer: lawyerData }, } = await (0, axios_1.API_PROTHEUS_DATA_URL)('/', {
                params: {
                    idOrg: 10,
                    param: oab,
                },
            });
            lawyer = await prisma_1.prisma.lawyer.create({
                data: {
                    name: lawyerData.nome,
                    oab: lawyerData.registro,
                    email: lawyerData.email,
                },
            });
        }
        // Verifica se todos os tipos de serviço existem
        const serviceTypes = await Promise.all(serviceTypeId.map(async (serviceType) => {
            const type = await prisma_1.prisma.serviceTypes.findUnique({
                where: {
                    id: serviceType,
                },
            });
            if (!type) {
                throw new unauthorized_error_1.UnauthorizedError('Tipo de serviço não encontrado. Verifique as informações e tente novamente.');
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
