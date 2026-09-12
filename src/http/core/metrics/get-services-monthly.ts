import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from 'http/middlewares/auth'
import { currentDate } from 'utils/metrics/period'
import { countServicesPerMonth } from 'utils/metrics/queries'
import { yearQuerySchema } from 'utils/metrics/schemas'
import { z } from 'zod'

export async function getServicesMonthly(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/metrics/services/monthly',
      {
        schema: {
          tags: ['metrics'],
          summary: 'Quantidade de atendimentos por mês de um ano',
          description: 'Sem `year`, usa o ano atual.',
          security: [{ bearerAuth: [] }],
          querystring: z.object({
            year: yearQuerySchema.optional(),
          }),
          response: {
            200: z.object({
              year: z.number(),
              total: z.number(),
              months: z.array(
                z.object({
                  month: z.number(),
                  label: z.string(),
                  total: z.number(),
                })
              ),
            }),
          },
        },
      },
      async (request, reply) => {
        await request.getCurrentAgentId()

        const year = request.query.year ?? currentDate().year

        const months = await countServicesPerMonth(year)
        const total = months.reduce((sum, month) => sum + month.total, 0)

        return reply.status(200).send({ year, total, months })
      }
    )
}
