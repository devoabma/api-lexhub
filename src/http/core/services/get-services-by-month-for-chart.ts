import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { BadRequestError } from 'http/_errors/bad-request-error'
import { auth } from 'http/middlewares/auth'
import { prisma } from 'lib/prisma'
import z from 'zod'

export async function getServicesByMonthForChart(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/services/monthly',
      {
        schema: {
          tags: ['services'],
          summary: 'Busca a quantidade de atendimentos por mês',
          security: [{ bearerAuth: [] }],
          response: {
            200: z.array(
              z.object({
                data: z.string(),
                services: z.number(),
              })
            ),
          },
        },
      },
      async (request, reply) => {
        await request.getCurrentAgentId()

        try {
          const services = await prisma.services.groupBy({
            by: ['createdAt'],
            _count: {
              id: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          })

          const months = [
            'Jan',
            'Fev',
            'Mar',
            'Abr',
            'Mai',
            'Jun',
            'Jul',
            'Ago',
            'Set',
            'Out',
            'Nov',
            'Dez',
          ]

          const formattedData = months.map((month, index) => {
            const monthData = services.filter(
              service => new Date(service.createdAt).getMonth() === index
            )

            return {
              data: month,
              services: monthData.reduce(
                (sum, service) => sum + service._count.id,
                0
              ),
            }
          })

          return reply.status(200).send(formattedData)
        } catch (err) {
          throw new BadRequestError(
            'Ocorreu um erro ao tentar recuperar os atendimentos mensais. Por favor, tente novamente mais tarde.'
          )
        }
      }
    )
}
