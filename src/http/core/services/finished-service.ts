import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { ConflictError } from 'http/_errors/conflict-error'
import { ForbiddenError } from 'http/_errors/forbidden-error'
import { NotFoundError } from 'http/_errors/not-found-error'
import { auth } from 'http/middlewares/auth'
import { prisma } from 'lib/prisma'
import z from 'zod'

export async function finishedService(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .patch(
      '/services/finished/:id',
      {
        schema: {
          tags: ['services'],
          summary: 'Finalizar um atendimento',
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
        const agent = await request.getCurrentAgent()

        const { id } = request.params

        const service = await prisma.services.findUnique({
          where: { id },
        })

        if (!service) {
          throw new NotFoundError(
            'O atendimento não foi encontrado. Verifique os dados e tente novamente.'
          )
        }

        // Autorização antes do status: não revela o estado de atendimentos
        // de terceiros a quem não pode agir sobre eles
        if (service.agentId !== agent.id && agent.role !== 'ADMIN') {
          throw new ForbiddenError(
            'Somente o funcionário que registrou o atendimento ou um administrador pode finalizá-lo.'
          )
        }

        if (service.status === 'COMPLETED') {
          throw new ConflictError(
            'O atendimento já foi finalizado. Verifique os dados e tente novamente.'
          )
        }

        await prisma.services.update({
          where: {
            id,
          },
          data: {
            finishedAt: new Date(),
            status: 'COMPLETED',
          },
        })

        return reply.status(204).send()
      }
    )
}
