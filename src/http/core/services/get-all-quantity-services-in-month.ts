import dayjs from 'dayjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { BadRequestError } from 'http/_errors/bad-request-error'
import { auth } from 'http/middlewares/auth'
import { prisma } from 'lib/prisma'
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

        // Obtém a data atual
        const now = dayjs()

        // Obtém o primeiro dia do mês atual
        const startOfMonth = now.startOf('month').toDate()

        // Obtém o último dia do mês atual
        const endOfMonth = now.endOf('month').toDate()

        // Conta os atendimentos que foram criados no mês atual
        const servicesInMonth = await prisma.services.count({
          where: {
            createdAt: {
              gte: startOfMonth, // maior ou igual ao primeiro dia do mês
              lte: endOfMonth, // menor ou igual ao último dia do mês
            },
          },
        })

        if (!servicesInMonth) {
          throw new BadRequestError(
            '🚨 Não existem atendimentos cadastrados ainda. Tente novamente mais tarde.'
          )
        }

        // Lógica para o mês anterior
        const startOfPreviousMonth = now
          .subtract(1, 'month')
          .startOf('month')
          .toDate()
        const endOfPreviousMonth = now
          .subtract(1, 'month')
          .endOf('month')
          .toDate()

        const previousMonthServices = await prisma.services.count({
          where: {
            createdAt: {
              gte: startOfPreviousMonth,
              lte: endOfPreviousMonth,
            },
          },
        })

        return reply.status(200).send({
          totalCurrentMonth: servicesInMonth,
          totalPreviousMonth: previousMonthServices,
        })
      }
    )
}
