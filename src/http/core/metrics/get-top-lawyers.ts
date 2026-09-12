import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from 'http/middlewares/auth'
import { resolvePeriodFilter } from 'utils/metrics/period'
import { countServices, findTopLawyers } from 'utils/metrics/queries'
import { monthQuerySchema, yearQuerySchema } from 'utils/metrics/schemas'
import { z } from 'zod'

export async function getTopLawyers(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/metrics/lawyers/top',
      {
        schema: {
          tags: ['metrics'],
          summary: 'Ranking dos advogados(as) mais atendidos(as)',
          description:
            'Sem `year` e `month`, considera todo o histórico. `month` sem `year` usa o ano atual.',
          security: [{ bearerAuth: [] }],
          querystring: z.object({
            year: yearQuerySchema.optional(),
            month: monthQuerySchema.optional(),
            limit: z.coerce.number().int().min(1).max(50).default(10),
          }),
          response: {
            200: z.object({
              servicesInPeriod: z.number(),
              lawyers: z.array(
                z.object({
                  id: z.string(),
                  name: z.string(),
                  oab: z.string(),
                  total: z.number(),
                })
              ),
            }),
          },
        },
      },
      async (request, reply) => {
        await request.getCurrentAgentId()

        const period = resolvePeriodFilter(request.query)

        const [servicesInPeriod, lawyers] = await Promise.all([
          countServices(period),
          findTopLawyers(period, request.query.limit),
        ])

        return reply.status(200).send({ servicesInPeriod, lawyers })
      }
    )
}
