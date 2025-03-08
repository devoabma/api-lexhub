import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { BadRequestError } from 'http/_errors/bad-request-error'
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

        if (!agent) {
          throw new BadRequestError(
            ' O funcionário solicitado não foi localizado em nossa base de dados. Por favor, verifique os dados informados e tente novamente.'
          )
        }

        return reply.status(200).send({ agent })
      }
    )
}
