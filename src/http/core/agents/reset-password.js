"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = resetPassword;
const bcryptjs_1 = require("bcryptjs");
const unauthorized_error_1 = require("http/_errors/unauthorized-error");
const prisma_1 = require("lib/prisma");
const zod_1 = require("zod");
async function resetPassword(app) {
    app.withTypeProvider().post('/agents/password/reset', {
        schema: {
            tags: ['agents'],
            summary: 'Reset de senha de um funcionário',
            body: zod_1.z.object({
                code: zod_1.z.string(),
                password: zod_1.z.string().min(8),
            }),
            response: {
                204: zod_1.z.null(),
            },
        },
    }, async (request, reply) => {
        const { code, password } = request.body;
        // Verifica se o código de redefinição de senha é válido
        const tokenFromCode = await prisma_1.prisma.token.findUnique({
            where: {
                code,
            },
        });
        if (!tokenFromCode || tokenFromCode.code !== code) {
            throw new unauthorized_error_1.UnauthorizedError('Código de redefinição de senha inválido. Verifique e tente novamente.');
        }
        // Busca o funcionário associado ao token
        const agent = await prisma_1.prisma.agent.findUnique({
            where: {
                id: tokenFromCode.agentId,
            },
        });
        if (!agent) {
            throw new unauthorized_error_1.UnauthorizedError('Nenhum funcionário encontrado. Verifique as informações e tente novamente.');
        }
        // Verifica se a nova senha é igual à senha atual
        const isSamePassword = await (0, bcryptjs_1.compare)(password, agent.passwordHash);
        if (isSamePassword) {
            throw new unauthorized_error_1.UnauthorizedError('A nova senha deve ser diferente da atual. Escolha outra senha e tente novamente.');
        }
        const passwordHash = await (0, bcryptjs_1.hash)(password, 8);
        // Atualiza a senha do agente com o novo hash de senha
        await prisma_1.prisma.agent.update({
            where: {
                id: tokenFromCode.agentId,
            },
            data: {
                passwordHash,
            },
        });
        return reply.status(204).send();
    });
}
