import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { BadRequestError } from 'http/_errors/bad-request-error'
import { auth } from 'http/middlewares/auth'
import { prisma } from 'lib/prisma'
import { z } from 'zod'

export async function createTypeService(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/services/types',
      {
        schema: {
          tags: ['servicesTypes'],
          summary: 'Criação de um novo tipo de serviço',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string(),
          }),
          response: {
            201: z.null(),
          },
        },
      },
      async (request, reply) => {
        // Somente admins podem criar um novo funcionário
        await request.checkIfAgentIsAdmin()

        const { name } = request.body

        const serviceType = await prisma.serviceTypes.findUnique({
          where: {
            name,
          },
        })

        if (serviceType) {
          throw new BadRequestError('🚨 Tipo de serviço já cadastrado.')
        }

        await prisma.serviceTypes.create({
          data: {
            name,
          },
        })

        return reply.status(201).send()
      }
    )
}
