import { hash } from 'bcryptjs'
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

      // Verifica se o código de redefinição de senha é válido
      const tokenFromCode = await prisma.token.findUnique({
        where: {
          id: code,
        },
      })

      if (!tokenFromCode) {
        throw new UnauthorizedError(
          '🚨 Código de redefinição de senha inválido.'
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
    }
  )
}
