import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { NotFoundError } from 'http/_errors/not-found-error'
import { auth } from 'http/middlewares/auth'
import { prisma } from 'lib/prisma'
import z from 'zod'

export async function inactiveAgent(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .patch(
      '/agents/inactive/:id',
      {
        schema: {
          tags: ['agents'],
          summary: 'Inactivação de um funcionário',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string().uuid(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        // Somente administradores podem inativar funcionários
        await request.checkIfAgentIsAdmin()

        const { id } = request.params

        const agent = await prisma.agent.findUnique({
          where: { id },
        })

        if (!agent) {
          throw new NotFoundError(
            'O funcionário não foi encontrado. Verifique os dados informados e tente novamente.'
          )
        }

        // A partir da próxima requisição, a sessão aberta do funcionário é recusada
        await prisma.agent.update({
          where: {
            id,
          },
          data: {
            inactive: new Date(),
            updatedAt: new Date(),
          },
        })

        return reply.status(204).send()
      }
    )
}
