import dayjs from 'dayjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { BadRequestError } from 'http/_errors/bad-request-error'
import { auth } from 'http/middlewares/auth'
import { prisma } from 'lib/prisma'
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

        // Obtém a data atual
        const now = dayjs()

        // Obtém o primeiro dia do ano atual
        const startOfYear = now.startOf('year').toDate()

        // Obtém o último dia do ano atual
        const endOfYear = now.endOf('year').toDate()

        // Conta os atendimentos que foram criados no ano atual
        const servicesInYear = await prisma.services.count({
          where: {
            createdAt: {
              gte: startOfYear,
              lte: endOfYear,
            },
          },
        })

        if (!servicesInYear) {
          throw new BadRequestError(
            '🚨 Não existem atendimentos cadastrados ainda neste ano. Tente novamente mais tarde.'
          )
        }

        // Lógica para o mês anterior
        const startOfPreviousYear = now
          .subtract(1, 'year')
          .startOf('year')
          .toDate()
        const endOfPreviousYear = now.subtract(1, 'year').endOf('year').toDate()

        const previousYearServices = await prisma.services.count({
          where: {
            createdAt: {
              gte: startOfPreviousYear,
              lte: endOfPreviousYear,
            },
          },
        })

        return reply.status(200).send({
          totalCurrentYear: servicesInYear,
          totalPreviousYear: previousYearServices,
        })
      }
    )
}
