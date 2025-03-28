"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAgent = updateAgent;
const unauthorized_error_1 = require("http/_errors/unauthorized-error");
const auth_1 = require("http/middlewares/auth");
const prisma_1 = require("lib/prisma");
const zod_1 = __importDefault(require("zod"));
async function updateAgent(app) {
    app
        .withTypeProvider()
        .register(auth_1.auth)
        .put('/agents/update/:id', {
        schema: {
            tags: ['agents'],
            summary: 'Atualização de um funcionário',
            security: [{ bearerAuth: [] }],
            params: zod_1.default.object({
                id: zod_1.default.string().uuid(),
            }),
            body: zod_1.default.object({
                name: zod_1.default.string().optional(),
                email: zod_1.default.string().email().optional(),
                role: zod_1.default.enum(['ADMIN', 'MEMBER']).optional(),
            }),
            response: {
                204: zod_1.default.null(),
            },
        },
    }, async (request, reply) => {
        // Somente administradores podem listar todos os funcionários
        await request.checkIfAgentIsAdmin();
        const { id } = request.params;
        const { name, email, role } = request.body;
        const agent = await prisma_1.prisma.agent.findUnique({
            where: { id },
        });
        if (!agent) {
            throw new unauthorized_error_1.UnauthorizedError('Funcionário não encontrado. Verifique os dados e tente novamente.');
        }
        // Verifica se o e-mail que está tentando alterar já existe
        if (email && email !== agent.email) {
            // Busca se o e-mail já existe no banco
            const emailExists = await prisma_1.prisma.agent.findUnique({
                where: { email },
            });
            if (emailExists) {
                throw new unauthorized_error_1.UnauthorizedError('E-mail já cadastrado. Verifique as informações e tente novamente.');
            }
        }
        try {
            await prisma_1.prisma.agent.update({
                where: {
                    id,
                },
                data: {
                    name,
                    email,
                    role,
                    updatedAt: new Date(),
                },
            });
            return reply.status(204).send();
        }
        catch (err) {
            throw new unauthorized_error_1.UnauthorizedError('Falha na atualização. Verifique os dados e tente novamente.');
        }
    });
}
