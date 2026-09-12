import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { ConflictError } from 'http/_errors/conflict-error'
import { ForbiddenError } from 'http/_errors/forbidden-error'
import { NotFoundError } from 'http/_errors/not-found-error'
import { auth } from 'http/middlewares/auth'
import { prisma } from 'lib/prisma'
import z from 'zod'

export async function cancelService(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/services/cancel/:id',
      {
        schema: {
          tags: ['services'],
          summary: 'Cancelar um atendimento enquanto em aberto',
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
            'O serviço solicitado não foi localizado em nossa base de dados. Por favor, verifique as informações e tente novamente.'
          )
        }

        // Autorização antes do status: não revela o estado de atendimentos
        // de terceiros a quem não pode agir sobre eles
        if (service.agentId !== agent.id && agent.role !== 'ADMIN') {
          throw new ForbiddenError(
            'Somente o funcionário que registrou o atendimento ou um administrador pode cancelá-lo.'
          )
        }

        if (service.status !== 'OPEN') {
          throw new ConflictError(
            'O serviço solicitado já foi finalizado. Por favor, verifique as informações e tente novamente.'
          )
        }

        await prisma.services.delete({
          where: { id },
        })

        return reply.status(204).send()
      }
    )
}
