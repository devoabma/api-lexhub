import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { BadRequestError } from 'http/_errors/bad-request-error'
import { ConflictError } from 'http/_errors/conflict-error'
import { NotFoundError } from 'http/_errors/not-found-error'
import { auth } from 'http/middlewares/auth'
import { prisma } from 'lib/prisma'
import z from 'zod'

export async function updateTypeService(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/services/types/update/:id',
      {
        schema: {
          tags: ['servicesTypes'],
          summary: 'Atualização de um tipo de serviço',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string().cuid(),
          }),
          body: z.object({
            name: z.string().min(6),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        // Somente administradores podem atualizar tipos de serviços
        await request.checkIfAgentIsAdmin()

        const { id } = request.params
        const { name } = request.body

        const serviceType = await prisma.serviceTypes.findUnique({
          where: { id },
        })

        if (!serviceType) {
          throw new NotFoundError(
            'Serviço não encontrado. Verifique as informações e tente novamente.'
          )
        }

        if (name === serviceType.name) {
          throw new BadRequestError(
            'O nome inserido já está registrado para este serviço. Revise e insira uma nova opção.'
          )
        }

        // Verifica se o nome do tipo de serviço ja existe na base de dados
        const serviceTypeExists = await prisma.serviceTypes.findUnique({
          where: { name },
        })

        if (serviceTypeExists) {
          throw new ConflictError(
            'O tipo de serviço informado já existe. Insira um nome único para prosseguir.'
          )
        }

        await prisma.serviceTypes.update({
          where: {
            id,
          },
          data: {
            name,
            updateAt: new Date(),
          },
        })

        return reply.status(204).send()
      }
    )
}
