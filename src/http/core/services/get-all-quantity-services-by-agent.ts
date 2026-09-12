import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from 'http/middlewares/auth'
import { currentDate, monthPeriod, previousMonth } from 'utils/metrics/period'
import { countServices } from 'utils/metrics/queries'
import { z } from 'zod'

export async function getAllQuantityServicesByAgent(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/services/general/agent/:id',
      {
        schema: {
          tags: ['services'],
          summary: 'Busca todos os atendimentos cadastrados de um funcionário',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string().uuid(),
          }),
          response: {
            200: z.object({
              totalGeneral: z.number(),
              totalOnMonth: z.number(),
              totalOnPreviousMonth: z.number(),
            }),
          },
        },
      },
      async (request, reply) => {
        await request.getCurrentAgentId()

        const { id } = request.params

        // Mês atual e anterior no fuso da OAB Maranhão
        const { year, month } = currentDate()
        const previous = previousMonth(year, month)

        const [totalGeneral, totalOnMonth, totalOnPreviousMonth] =
          await Promise.all([
            countServices(null, { agentId: id }),
            countServices(monthPeriod(year, month), { agentId: id }),
            countServices(monthPeriod(previous.year, previous.month), {
              agentId: id,
            }),
          ])

        return reply.status(200).send({
          totalGeneral,
          totalOnMonth,
          totalOnPreviousMonth,
        })
      }
    )
}
