import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { UnauthorizedError } from 'http/_errors/unauthorized-error'
import { auth } from 'http/middlewares/auth'
import { prisma } from 'lib/prisma'
import z from 'zod'

export async function getProfile(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/agents/profile',
      {
        schema: {
          tags: ['agents'],
          summary: 'Busca o perfil de um funcionário logado',
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              agent: z.object({
                id: z.string().uuid(),
                name: z.string(),
                email: z.string().email(),
                role: z.enum(['ADMIN', 'MEMBER']),
              }),
            }),
          },
        },
      },
      async (request, reply) => {
        const agentId = await request.getCurrentAgentId()

        // Retorna o usuário somente com os dados necessários
        const agent = await prisma.agent.findUnique({
          where: {
            id: agentId,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        })

        // Funcionário removido entre a validação da sessão e esta consulta
        if (!agent) {
          throw new UnauthorizedError(
            'Token inválido ou expirado. Faça login novamente.'
          )
        }

        return reply.status(200).send({ agent })
      }
    )
}
