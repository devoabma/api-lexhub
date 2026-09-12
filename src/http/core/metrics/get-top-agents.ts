import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from 'http/middlewares/auth'
import { resolvePeriodFilter } from 'utils/metrics/period'
import { countServices, findTopAgents } from 'utils/metrics/queries'
import { monthQuerySchema, yearQuerySchema } from 'utils/metrics/schemas'
import { z } from 'zod'

export async function getTopAgents(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/metrics/agents/top',
      {
        schema: {
          tags: ['metrics'],
          summary: 'Ranking dos funcionários(as) que mais atenderam',
          description:
            'Sem `year` e `month`, considera todo o histórico. `month` sem `year` usa o ano atual. Inclui funcionários inativos.',
          security: [{ bearerAuth: [] }],
          querystring: z.object({
            year: yearQuerySchema.optional(),
            month: monthQuerySchema.optional(),
            limit: z.coerce.number().int().min(1).max(20).default(3),
          }),
          response: {
            200: z.object({
              servicesInPeriod: z.number(),
              agents: z.array(
                z.object({
                  id: z.string(),
                  name: z.string(),
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

        const [servicesInPeriod, agents] = await Promise.all([
          countServices(period),
          findTopAgents(period, request.query.limit),
        ])

        return reply.status(200).send({ servicesInPeriod, agents })
      }
    )
}
