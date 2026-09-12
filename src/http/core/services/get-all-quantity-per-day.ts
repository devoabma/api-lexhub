import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from 'http/middlewares/auth'
import { currentDate, dayPeriod, shiftDate } from 'utils/metrics/period'
import { countServices } from 'utils/metrics/queries'
import { z } from 'zod'

export async function getAllQuantityServicesPerDay(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/services/general/agent/day',
      {
        schema: {
          tags: ['services'],
          summary: 'Busca todos os atendimentos cadastrados no dia',
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              totalTheDay: z.number(),
              totalLastDay: z.number(),
            }),
          },
        },
      },
      async (request, reply) => {
        await request.getCurrentAgentId()

        // Hoje e ontem no fuso da OAB Maranhão
        const { date: today } = currentDate()

        const [totalTheDay, totalLastDay] = await Promise.all([
          countServices(dayPeriod(today)),
          countServices(dayPeriod(shiftDate(today, -1))),
        ])

        return reply.status(200).send({
          totalTheDay,
          totalLastDay,
        })
      }
    )
}
