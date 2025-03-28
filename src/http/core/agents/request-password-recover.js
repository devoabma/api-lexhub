"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestPasswordRecover = requestPasswordRecover;
const _env_1 = require("http/_env");
const prisma_1 = require("lib/prisma");
const resend_1 = require("lib/resend");
const reset_password_email_1 = require("utils/emails/reset-password-email");
const generate_recovery_code_1 = require("utils/generate-recovery-code");
const zod_1 = require("zod");
async function requestPasswordRecover(app) {
    app.withTypeProvider().post('/agents/password/recover', {
        schema: {
            tags: ['agents'],
            summary: 'Requisição de redefinição de senha',
            security: [{ bearerAuth: [] }],
            body: zod_1.z.object({
                email: zod_1.z.string().email(),
            }),
            response: {
                200: zod_1.z.null(),
            },
        },
    }, async (request, reply) => {
        const { email } = request.body;
        const agentFromEmail = await prisma_1.prisma.agent.findUnique({
            where: {
                email,
            },
        });
        if (!agentFromEmail) {
            // Não queremos que as pessoas saibam se o usuário realmente existe
            return reply.status(200).send();
        }
        const { code } = await prisma_1.prisma.token.create({
            data: {
                type: 'PASSWORD_RECOVER',
                agentId: agentFromEmail.id,
                code: (0, generate_recovery_code_1.generateRecoveryCode)(),
            },
        });
        await resend_1.resend.emails.send({
            from: '📧 OAB Atende <oabatende@oabma.com.br>',
            // FIXME: Em ambiente de desenvolvimento envia para o email do desenvolvedor
            to: _env_1.env.NODE_ENV === 'production' ? email : 'hilquiasfmelo@hotmail.com',
            subject: '🔄 Redefinição de Senha - OAB Atende',
            react: (0, reset_password_email_1.ResetPasswordEmail)({
                name: agentFromEmail.name,
                code,
                link: `${_env_1.env.WEB_URL}/reset-password?code=${code}`,
            }),
        });
        // Excluir o token após 2 minutos (120000ms)
        setTimeout(async () => {
            await prisma_1.prisma.token.delete({
                where: { code },
            });
        }, 120000);
        // Somente em ambiente de desenvolvimento mostra no console
        if (_env_1.env.NODE_ENV === 'development') {
            console.log('> ✅ Email de redefinição de senha enviado com sucesso.', code);
        }
        return reply.status(200).send();
    });
}
