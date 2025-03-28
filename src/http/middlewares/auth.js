"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const fastify_plugin_1 = require("fastify-plugin");
const unauthorized_error_1 = require("http/_errors/unauthorized-error");
const prisma_1 = require("lib/prisma");
exports.auth = (0, fastify_plugin_1.fastifyPlugin)(async (app) => {
    app.addHook('preHandler', async (request) => {
        request.getCurrentAgentId = async () => {
            try {
                // Verifica se o token é valido e retorna o sub
                const { sub } = await request.jwtVerify();
                return sub;
            }
            catch {
                throw new unauthorized_error_1.UnauthorizedError('Token inválido ou expirado. Faça login novamente.');
            }
        };
        request.checkIfAgentIsAdmin = async () => {
            // Verifica o token primeiro
            const { sub } = await request.jwtVerify().catch(() => {
                throw new unauthorized_error_1.UnauthorizedError('Token inválido ou expirado. Verifique as informações e tente novamente.');
            });
            // Busca o agente no banco de dados
            const agent = await prisma_1.prisma.agent.findUnique({
                where: { id: sub },
                select: { role: true },
            });
            if (!agent) {
                throw new unauthorized_error_1.UnauthorizedError('Funcionário não encontrado. Verifique os dados e tente novamente.');
            }
            if (agent.role === 'MEMBER') {
                throw new unauthorized_error_1.UnauthorizedError('Permissão negada. Você precisa ser um administrador para realizar esta ação.');
            }
        };
    });
});
