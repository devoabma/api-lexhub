import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from 'http/middlewares/auth'
import { currentDate } from 'utils/metrics/period'
import { countServicesPerDay } from 'utils/metrics/queries'
import { monthQuerySchema, yearQuerySchema } from 'utils/metrics/schemas'
import { z } from 'zod'

export async function getServicesDaily(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/metrics/services/daily',
      {
        schema: {
          tags: ['metrics'],
          summary: 'Quantidade de atendimentos por dia de um mês',
          description:
            'Sem `year`, usa o ano atual; sem `month`, usa o mês atual.',
          security: [{ bearerAuth: [] }],
          querystring: z.object({
            year: yearQuerySchema.optional(),
            month: monthQuerySchema.optional(),
          }),
          response: {
            200: z.object({
              year: z.number(),
              month: z.number(),
              total: z.number(),
              days: z.array(
                z.object({
                  day: z.number(),
                  date: z.string(),
                  total: z.number(),
                })
              ),
            }),
          },
        },
      },
      async (request, reply) => {
        await request.getCurrentAgentId()

        const today = currentDate()
        const year = request.query.year ?? today.year
        const month = request.query.month ?? today.month

        const days = await countServicesPerDay(year, month)
        const total = days.reduce((sum, day) => sum + day.total, 0)

        return reply.status(200).send({ year, month, total, days })
      }
    )
}
