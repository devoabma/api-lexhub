import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { BadRequestError } from 'http/_errors/bad-request-error'
import { auth } from 'http/middlewares/auth'
import { prisma } from 'lib/prisma'
import z from 'zod'

export async function getAllQuantityServices(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/services/general',
      {
        schema: {
          tags: ['services'],
          summary: 'Busca todos os atendimentos cadastrados geral',
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              total: z.number(),
            }),
          },
        },
      },
      async (request, reply) => {
        await request.getCurrentAgentId()

        try {
          const services = await prisma.services.count()

          if (!services) {
            throw new BadRequestError(
              ' Não existem atendimentos cadastrados ainda. Tente novamente mais tarde.'
            )
          }

          return reply.status(200).send({ total: services })
        } catch (error) {
          throw new BadRequestError(
            ' Ocorreu um erro ao buscar os atendimentos cadastrados'
          )
        }
      }
    )
}
