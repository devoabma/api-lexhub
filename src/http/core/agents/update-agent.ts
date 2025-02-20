import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { UnauthorizedError } from 'http/_errors/unauthorized-error'
import { auth } from 'http/middlewares/auth'
import { prisma } from 'lib/prisma'
import z from 'zod'

export async function updateAgent(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/agents/update/:id',
      {
        schema: {
          tags: ['agents'],
          summary: 'Atualização de um funcionário',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string().uuid(),
          }),
          body: z.object({
            name: z.string().optional(),
            email: z.string().email().optional(),
            role: z.enum(['ADMIN', 'MEMBER']).optional(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        // Somente administradores podem listar todos os funcionários
        await request.checkIfAgentIsAdmin()

        const { id } = request.params
        const { name, email, role } = request.body

        const agent = await prisma.agent.findUnique({
          where: { id },
        })

        if (!agent) {
          throw new UnauthorizedError(
            '🚨 O funcionário solicitado não foi localizado em nossa base de dados. Por favor, verifique os dados informados e tente novamente.'
          )
        }

        // Verifica se o e-mail que está tentando alterar já existe
        if (email && email !== agent.email) {
          // Busca se o e-mail já existe no banco
          const emailExists = await prisma.agent.findUnique({
            where: { email },
          })

          if (emailExists) {
            throw new UnauthorizedError(
              '🚨 Não foi possível concluir o cadastro, pois já existe um funcionário vinculado a este e-mail. Por favor, verifique as informações e tente novamente.'
            )
          }
        }

        try {
          await prisma.agent.update({
            where: {
              id,
            },
            data: {
              name,
              email,
              role,
              updatedAt: new Date(),
            },
          })

          return reply.status(204).send()
        } catch (err) {
          throw new UnauthorizedError(
            '🚨 Não foi possível atualizar as informações do funcionário. Por favor, verifique os dados e tente novamente.'
          )
        }
      }
    )
}
