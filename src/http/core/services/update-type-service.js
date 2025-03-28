"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTypeService = updateTypeService;
const bad_request_error_1 = require("http/_errors/bad-request-error");
const unauthorized_error_1 = require("http/_errors/unauthorized-error");
const auth_1 = require("http/middlewares/auth");
const prisma_1 = require("lib/prisma");
const zod_1 = __importDefault(require("zod"));
async function updateTypeService(app) {
    app
        .withTypeProvider()
        .register(auth_1.auth)
        .put('/services/types/update/:id', {
        schema: {
            tags: ['servicesTypes'],
            summary: 'Atualização de um tipo de serviço',
            security: [{ bearerAuth: [] }],
            params: zod_1.default.object({
                id: zod_1.default.string().cuid(),
            }),
            body: zod_1.default.object({
                name: zod_1.default.string().min(6),
            }),
            response: {
                204: zod_1.default.null(),
            },
        },
    }, async (request, reply) => {
        // Somente administradores podem atualizar tipos de serviços
        await request.checkIfAgentIsAdmin();
        const { id } = request.params;
        const { name } = request.body;
        const serviceType = await prisma_1.prisma.serviceTypes.findUnique({
            where: { id },
        });
        if (!serviceType) {
            throw new unauthorized_error_1.UnauthorizedError('Serviço não encontrado. Verifique as informações e tente novamente.');
        }
        if (name === serviceType.name) {
            throw new bad_request_error_1.BadRequestError('O nome inserido já está registrado para este serviço. Revise e insira uma nova opção.');
        }
        // Verifica se o nome do tipo de serviço foi alterado
        if (serviceType && name !== serviceType.name) {
            // Verifica se o nome do tipo de serviço ja existe na base de dados
            const serviceTypeExists = await prisma_1.prisma.serviceTypes.findUnique({
                where: { name },
            });
            if (serviceTypeExists) {
                throw new unauthorized_error_1.UnauthorizedError('O tipo de serviço informado já existe. Insira um nome único para prosseguir.');
            }
        }
        try {
            await prisma_1.prisma.serviceTypes.update({
                where: {
                    id,
                },
                data: {
                    name,
                    updateAt: new Date(),
                },
            });
            return reply.status(204).send();
        }
        catch (err) {
            throw new unauthorized_error_1.UnauthorizedError('Erro na atualização. Verifique os dados e tente novamente.');
        }
    });
}
