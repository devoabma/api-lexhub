import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from 'http/middlewares/auth'
import { currentDate, monthPeriod, previousMonth } from 'utils/metrics/period'
import { countServices } from 'utils/metrics/queries'
import z from 'zod'

export async function getAllQuantityServicesInMonth(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/services/general/month',
      {
        schema: {
          tags: ['services'],
          summary: 'Busca todos os atendimentos cadastrados no mês atual',
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              totalCurrentMonth: z.number(),
              totalPreviousMonth: z.number(),
            }),
          },
        },
      },
      async (request, reply) => {
        await request.getCurrentAgentId()

        // Mês atual e anterior no fuso da OAB Maranhão
        const { year, month } = currentDate()
        const previous = previousMonth(year, month)

        const [totalCurrentMonth, totalPreviousMonth] = await Promise.all([
          countServices(monthPeriod(year, month)),
          countServices(monthPeriod(previous.year, previous.month)),
        ])

        return reply.status(200).send({
          totalCurrentMonth,
          totalPreviousMonth,
        })
      }
    )
}
