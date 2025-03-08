import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { UnauthorizedError } from 'http/_errors/unauthorized-error'
import { auth } from 'http/middlewares/auth'
import { prisma } from 'lib/prisma'
import z from 'zod'

export async function activeAgent(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .patch(
      '/agents/active/:id',
      {
        schema: {
          tags: ['agents'],
          summary: 'Ativação de um funcionário',
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
        // Somente administradores podem ativar funcionários
        await request.checkIfAgentIsAdmin()

        const { id } = request.params

        const agent = await prisma.agent.findUnique({
          where: { id },
        })

        if (!agent) {
          throw new UnauthorizedError(
            ' O funcionário solicitado não foi localizado em nossa base de dados. Por favor, verifique os dados informados e tente novamente.'
          )
        }

        try {
          await prisma.agent.update({
            where: {
              id,
            },
            data: {
              inactive: null,
              updatedAt: new Date(),
            },
          })

          return reply.status(204).send()
        } catch (err) {
          throw new UnauthorizedError(
            ' Ocorreu um erro ao ativar um funcionário. Por favor, tente novamente mais tarde.'
          )
        }
      }
    )
}
