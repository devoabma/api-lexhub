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
          querystring: z.object({
            pageIndex: z.coerce.number().default(1),
            id: z.string().cuid().optional(),
            name: z.string().optional(),
          }),
          response: {
            200: z.object({
              servicesTypes: z.array(
                z.object({
                  id: z.string().cuid(),
                  name: z.string(),
                })
              ),
              total: z.number(),
            }),
          },
        },
      },
      async (request, reply) => {
        // Somente administradores podem listar todos os funcionários
        await request.checkIfAgentIsAdmin()

        const { pageIndex, id, name } = request.query

        try {
          const [servicesTypes, total] = await Promise.all([
            prisma.serviceTypes.findMany({
              where: {
                id: id && { equals: id },
                name: name
                  ? { contains: name, mode: 'insensitive' }
                  : undefined,
              },
              select: {
                id: true,
                name: true,
              },
              orderBy: [
                {
                  createdAt: 'desc', // Mostra os tipos de serviços mais recentes primeiro
                },
              ],
              skip: (pageIndex - 1) * 10,
              take: 10,
            }),
            prisma.serviceTypes.count({
              where: {
                id: id && { equals: id },
                name: name
                  ? { contains: name, mode: 'insensitive' }
                  : undefined,
              },
            }),
          ])

          if (!servicesTypes) {
            throw new BadRequestError(
              'Nenhum tipo de serviço cadastrado. Cadastre um para continuar.'
            )
          }

          return reply.status(200).send({ servicesTypes, total })
        } catch (err) {
          throw new BadRequestError(
            'Não foi possível recuperar os tipos de serviços. Tente novamente mais tarde.'
          )
        }
      }
    )
}
