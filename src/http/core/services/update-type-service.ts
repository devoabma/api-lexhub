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
            ' O tipo de serviço solicitado não foi localizado em nossa base de dados. Por favor, verifique as informações e tente novamente.'
          )
        }

        if (name === serviceType.name) {
          throw new BadRequestError(
            ' O nome inserido é idêntico ao nome já registrado para este tipo de serviço. Por favor, revise e insira uma nova opção.'
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
              ' O tipo de serviço informado já consta em nossa base de dados. Por favor, insira um nome único para prosseguir com o cadastro.'
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
            ' Ocorreu um erro durante a atualização do tipo de serviço. Por favor, verifique os dados informados e tente novamente. Caso o problema persista, entre em contato com o suporte técnico.'
          )
        }
      }
    )
}
