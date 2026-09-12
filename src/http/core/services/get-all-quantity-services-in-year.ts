import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from 'http/middlewares/auth'
import { currentDate, yearPeriod } from 'utils/metrics/period'
import { countServices } from 'utils/metrics/queries'
import z from 'zod'

export async function getAllQuantityServicesInYear(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/services/general/year',
      {
        schema: {
          tags: ['services'],
          summary: 'Busca todos os atendimentos cadastrados no ano atual',
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              totalCurrentYear: z.number(),
              totalPreviousYear: z.number(),
            }),
          },
        },
      },
      async (request, reply) => {
        await request.getCurrentAgentId()

        // Ano atual e anterior no fuso da OAB Maranhão
        const { year } = currentDate()

        const [totalCurrentYear, totalPreviousYear] = await Promise.all([
          countServices(yearPeriod(year)),
          countServices(yearPeriod(year - 1)),
        ])

        return reply.status(200).send({
          totalCurrentYear,
          totalPreviousYear,
        })
      }
    )
}
