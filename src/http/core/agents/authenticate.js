"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const bcryptjs_1 = require("bcryptjs");
const bad_request_error_1 = require("http/_errors/bad-request-error");
const prisma_1 = require("lib/prisma");
const zod_1 = require("zod");
async function authenticate(app) {
    app.withTypeProvider().post('/agents/sessions', {
        schema: {
            tags: ['agents'],
            summary: 'Autenticação de um funcionário',
            body: zod_1.z.object({
                email: zod_1.z.string().email(),
                password: zod_1.z.string().min(8),
            }),
            response: {
                201: zod_1.z.object({
                    token: zod_1.z.string(),
                }),
            },
        },
    }, async (request, reply) => {
        const { email, password } = request.body;
        const userFromEmail = await prisma_1.prisma.agent.findUnique({
            where: {
                email,
            },
        });
        // Verifica se o usuário foi desativado pelo administrador
        if (userFromEmail && userFromEmail.inactive !== null) {
            throw new bad_request_error_1.BadRequestError('O funcionário está inativo. Procure com o administrador do sistema.');
        }
        if (!userFromEmail) {
            throw new bad_request_error_1.BadRequestError('Credenciais inválidas. Verifique suas informações e tente novamente.');
        }
        const isPasswordValid = await (0, bcryptjs_1.compare)(password, userFromEmail.passwordHash);
        if (!isPasswordValid) {
            throw new bad_request_error_1.BadRequestError('Credenciais inválidas. Verifique suas informações e tente novamente.');
        }
        // Criação do token de autenticação
        const token = await reply.jwtSign({
            // Envia o id do usuário para o token
            sub: userFromEmail.id,
            role: userFromEmail.role,
        }, {
            sign: {
                expiresIn: '1d',
            },
        });
        return reply
            .setCookie('@lexhub-auth', token, {
            path: '/',
            httpOnly: true,
            sameSite: true,
            maxAge: 60 * 60 * 24,
        })
            .status(201)
            .send({
            token,
        });
    });
}
