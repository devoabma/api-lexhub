import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from 'http/middlewares/auth'
import { countServicesPerYear } from 'utils/metrics/queries'
import { z } from 'zod'

export async function getServicesYearly(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/metrics/services/yearly',
      {
        schema: {
          tags: ['metrics'],
          summary: 'Quantidade de atendimentos por ano',
          description:
            'Do primeiro ano com atendimentos até o ano atual, com zero nos anos sem registro.',
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              years: z.array(
                z.object({
                  year: z.number(),
                  total: z.number(),
                })
              ),
            }),
          },
        },
      },
      async (request, reply) => {
        await request.getCurrentAgentId()

        const years = await countServicesPerYear()

        return reply.status(200).send({ years })
      }
    )
}
