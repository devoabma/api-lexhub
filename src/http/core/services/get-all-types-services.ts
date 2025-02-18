import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { BadRequestError } from 'http/_errors/bad-request-error'
import { auth } from 'http/middlewares/auth'
import { prisma } from 'lib/prisma'
import z from 'zod'

export async function getAllTypesServices(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/services/types/all',
      {
        schema: {
          tags: ['servicesTypes'],
          summary: 'Busca todos os tipos de serviços cadastrados',
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              servicesTypes: z.array(
                z.object({
                  id: z.string().cuid(),
                  name: z.string(),
                })
              ),
            }),
          },
        },
      },
      async (request, reply) => {
        // Somente administradores podem listar todos os funcionários
        await request.checkIfAgentIsAdmin()

        try {
          const servicesTypes = await prisma.serviceTypes.findMany({
            select: {
              id: true,
              name: true,
            },
            orderBy: [
              {
                createdAt: 'desc', // Mostra os tipos de serviços mais recentes primeiro
              },
            ],
          })

          if (!servicesTypes) {
            throw new BadRequestError(
              '🚨 Não existem tipos de serviços cadastrados.'
            )
          }

          return reply.status(200).send({ servicesTypes })
        } catch (err) {
          throw new BadRequestError(
            '🚨 Houve um erro ao buscar os tipos de serviços.'
          )
        }
      }
    )
}
