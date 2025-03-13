import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { BadRequestError } from 'http/_errors/bad-request-error'
import { UnauthorizedError } from 'http/_errors/unauthorized-error'
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
          throw new UnauthorizedError(
            'Serviço não encontrado. Verifique as informações e tente novamente.'
          )
        }

        if (name === serviceType.name) {
          throw new BadRequestError(
            'O nome inserido já está registrado para este serviço. Revise e insira uma nova opção.'
          )
        }

        // Verifica se o nome do tipo de serviço foi alterado
        if (serviceType && name !== serviceType.name) {
          // Verifica se o nome do tipo de serviço ja existe na base de dados
          const serviceTypeExists = await prisma.serviceTypes.findUnique({
            where: { name },
          })

          if (serviceTypeExists) {
            throw new UnauthorizedError(
              'O tipo de serviço informado já existe. Insira um nome único para prosseguir.'
            )
          }
        }

        try {
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
        } catch (err) {
          throw new UnauthorizedError(
            'Erro na atualização. Verifique os dados e tente novamente.'
          )
        }
      }
    )
}
