import { compare, hash } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { UnauthorizedError } from 'http/_errors/unauthorized-error'
import { prisma } from 'lib/prisma'
import { z } from 'zod'

export async function resetPassword(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/agents/password/reset',
    {
      schema: {
        tags: ['agents'],
        summary: 'Reset de senha de um funcionário',
        body: z.object({
          code: z.string(),
          password: z.string().min(8),
        }),
        response: {
          204: z.null(),
        },
      },
    },
    async (request, reply) => {
      const { code, password } = request.body

      try {
        // Verifica se o código de redefinição de senha é válido
        const tokenFromCode = await prisma.token.findUnique({
          where: {
            code,
          },
        })

        if (!tokenFromCode) {
          throw new UnauthorizedError(
            '🚨 O código de redefinição de senha informado é inválido. Por favor, verifique e tente novamente.'
          )
        }

        // Busca o funcionário associado ao token
        const agent = await prisma.agent.findUnique({
          where: {
            id: tokenFromCode.agentId,
          },
        })

        if (!agent) {
          throw new UnauthorizedError(
            '🚨 Nenhum funcionário correspondente foi encontrado. Por favor, verifique as informações e tente novamente.'
          )
        }

        // Verifica se a nova senha é igual à senha atual
        const isSamePassword = await compare(password, agent.passwordHash)

        if (isSamePassword) {
          throw new UnauthorizedError(
            '🚨 A nova senha deve ser diferente da senha atual. Por favor, escolha uma senha diferente e tente novamente.'
          )
        }

        const passwordHash = await hash(password, 8)

        // Atualiza a senha do agente com o novo hash de senha
        await prisma.agent.update({
          where: {
            id: tokenFromCode.agentId,
          },
          data: {
            passwordHash,
          },
        })

        return reply.status(204).send()
      } catch (err) {
        throw new UnauthorizedError(
          '🚨 Ocorreu um erro ao redefinir a senha. Por favor, tente novamente mais tarde.'
        )
      }
    }
  )
}
