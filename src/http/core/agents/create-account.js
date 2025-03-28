"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAccountService = createAccountService;
const bcryptjs_1 = require("bcryptjs");
const _env_1 = require("http/_env");
const bad_request_error_1 = require("http/_errors/bad-request-error");
const auth_1 = require("http/middlewares/auth");
const prisma_1 = require("lib/prisma");
const resend_1 = require("lib/resend");
const agent_registration_email_1 = require("utils/emails/agent-registration-email");
const zod_1 = require("zod");
async function createAccountService(app) {
    app
        .withTypeProvider()
        .register(auth_1.auth)
        .post('/agents', {
        schema: {
            tags: ['agents'],
            summary: 'Criação de um novo funcionário',
            security: [{ bearerAuth: [] }],
            body: zod_1.z.object({
                name: zod_1.z.string(),
                email: zod_1.z.string().email(),
                password: zod_1.z.string().min(8),
            }),
            response: {
                201: zod_1.z.null(),
            },
        },
    }, async (request, reply) => {
        // Somente admins podem criar um novo funcionário
        await request.checkIfAgentIsAdmin();
        const { name, email, password } = request.body;
        const userWithSameEmail = await prisma_1.prisma.agent.findUnique({
            where: {
                email,
            },
        });
        if (userWithSameEmail) {
            throw new bad_request_error_1.BadRequestError('E-mail já cadastrado para outro funcionário.');
        }
        const passwordHash = await (0, bcryptjs_1.hash)(password, 8);
        // Envia email de boas vindas para o novo funcionário com seus dados
        await resend_1.resend.emails.send({
            from: '📧 OAB Atende <oabatende@oabma.com.br>',
            to: email,
            subject: '🎉 Bem-vindo à equipe! Aqui estão suas informações.',
            react: (0, agent_registration_email_1.AgentRegistrationEmail)({
                name,
                email,
                tempPassword: password,
                link: _env_1.env.WEB_URL,
            }),
        });
        try {
            await prisma_1.prisma.agent.create({
                data: {
                    name,
                    email,
                    passwordHash,
                },
            });
            return reply.status(201).send();
        }
        catch (err) {
            throw new bad_request_error_1.BadRequestError('Erro ao criar funcionário. Por favor, tente novamente.');
        }
    });
}
