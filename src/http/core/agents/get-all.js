"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAll = getAll;
const bad_request_error_1 = require("http/_errors/bad-request-error");
const auth_1 = require("http/middlewares/auth");
const prisma_1 = require("lib/prisma");
const zod_1 = __importDefault(require("zod"));
async function getAll(app) {
    app
        .withTypeProvider()
        .register(auth_1.auth)
        .get('/agents/all', {
        schema: {
            tags: ['agents'],
            summary: 'Busca todos os funcionários cadastrados',
            security: [{ bearerAuth: [] }],
            querystring: zod_1.default.object({
                pageIndex: zod_1.default.coerce.number().default(1),
                name: zod_1.default.string().optional(),
                role: zod_1.default.enum(['ADMIN', 'MEMBER']).optional(),
            }),
            response: {
                200: zod_1.default.object({
                    agents: zod_1.default.array(zod_1.default.object({
                        id: zod_1.default.string().uuid(),
                        name: zod_1.default.string(),
                        email: zod_1.default.string().email(),
                        role: zod_1.default.enum(['ADMIN', 'MEMBER']),
                        inactive: zod_1.default.date().nullable(),
                    })),
                    total: zod_1.default.number(),
                }),
            },
        },
    }, async (request, reply) => {
        // Somente administradores podem listar todos os funcionários
        await request.checkIfAgentIsAdmin();
        const { pageIndex, name, role } = request.query;
        try {
            const [agents, total] = await Promise.all([
                prisma_1.prisma.agent.findMany({
                    where: {
                        name: name
                            ? { contains: name, mode: 'insensitive' }
                            : undefined,
                        role: role ? role : undefined,
                    },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        inactive: true,
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                    skip: (pageIndex - 1) * 10,
                    take: 10,
                }),
                prisma_1.prisma.agent.count({
                    where: {
                        name: name
                            ? { contains: name, mode: 'insensitive' }
                            : undefined,
                        role: role ? role : undefined,
                    },
                }),
            ]);
            if (!agents) {
                throw new bad_request_error_1.BadRequestError('Nenhum funcionário cadastrado. Cadastre um para continuar.');
            }
            return reply.status(200).send({
                agents,
                total,
            });
        }
        catch (err) {
            throw new bad_request_error_1.BadRequestError('Não foi possível recuperar os atendimentos. Tente novamente mais tarde.');
        }
        // const agents = await prisma.agent.findMany({
        //   select: {
        //     id: true,
        //     name: true,
        //     email: true,
        //     role: true,
        //     inactive: true,
        //   },
        //   orderBy: [
        //     {
        //       createdAt: 'desc', // Mostra os funcionários mais recentes primeiro
        //     },
        //   ],
        // })
        // if (!agents) {
        //   throw new BadRequestError(
        //     ' Ainda não há funcionários cadastrados no sistema. Por favor, cadastre um funcionário antes de prosseguir.'
        //   )
        // }
        // return reply.status(200).send({
        //   agents,
        //   total: agents.length,
        // })
    });
}
