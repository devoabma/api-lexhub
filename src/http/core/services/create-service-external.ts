import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { UnauthorizedError } from 'http/_errors/unauthorized-error'
import { auth } from 'http/middlewares/auth'
import { prisma } from 'lib/prisma'
import z from 'zod'

export async function createServiceExternal(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/services/external',
      {
        schema: {
          tags: ['servicesExternal'],
          summary: 'Criação de um novo serviço externo',
          security: [{ bearerAuth: [] }],
          body: z.object({
            oab: z.string(),
            name: z.string(),
            cpf: z.string(),
            email: z.string().email(),
            serviceTypeId: z.array(z.string().cuid()),
            observation: z.string().optional(),
            assistance: z.enum(['PERSONALLY', 'REMOTE']),
            status: z.enum(['OPEN', 'COMPLETED']).default('OPEN'),
          }),
          response: {
            201: z.null(),
          },
        },
      },
      async (request, reply) => {
        const agentId = await request.getCurrentAgentId()

        const {
          oab,
          name,
          cpf,
          email,
          serviceTypeId,
          observation,
          assistance,
        } = request.body

        // Verifica se o advogado já está cadastrado no banco de dados
        let lawyer = await prisma.lawyer.findUnique({
          where: {
            oab,
          },
        })

        if (!lawyer) {
          lawyer = await prisma.lawyer.create({
            data: {
              oab,
              name,
              cpf,
              email,
            },
          })
        }

        const serviceTypes = await Promise.all(
          serviceTypeId.map(async serviceType => {
            const type = await prisma.serviceTypes.findUnique({
              where: {
                id: serviceType,
              },
            })

            if (!type) {
              throw new UnauthorizedError(
                'Tipo de serviço não encontrado. Verifique os dados e tente novamente.'
              )
            }

            return type
          })
        )

        // Cria o atendimento (Service)
        const service = await prisma.services.create({
          data: {
            assistance,
            observation,
            agentId,
            lawyerId: lawyer.id,
          },
        })

        // Associa o Service aos ServiceTypes na tabela ServiceServiceTypes
        await Promise.all(
          serviceTypes.map(async serviceType => {
            await prisma.serviceServiceTypes.create({
              data: {
                serviceId: service.id,
                serviceTypeId: serviceType.id,
              },
            })
          })
        )

        return reply.status(201).send()
      }
    )
}
