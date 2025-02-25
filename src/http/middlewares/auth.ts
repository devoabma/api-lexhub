import type { FastifyInstance } from 'fastify'
import { fastifyPlugin } from 'fastify-plugin'
import { UnauthorizedError } from 'http/_errors/unauthorized-error'
import { prisma } from 'lib/prisma'

export const auth = fastifyPlugin(async (app: FastifyInstance) => {
  app.addHook('preHandler', async request => {
    request.getCurrentAgentId = async () => {
      try {
        // Verifica se o token é valido e retorna o sub
        const { sub } = await request.jwtVerify<{ sub: string }>()

        return sub
      } catch {
        throw new UnauthorizedError(
          '🚨 Token inválido ou expirado. Faça login novamente.'
        )
      }
    }

    request.checkIfAgentIsAdmin = async () => {
      // Verifica o token primeiro
      const { sub } = await request.jwtVerify<{ sub: string }>().catch(() => {
        throw new UnauthorizedError(
          '🚨 Token inválido ou expirado. Verifique as informações e tente novamente.'
        )
      })

      // Busca o agente no banco de dados
      const agent = await prisma.agent.findUnique({
        where: { id: sub },
        select: { role: true },
      })

      if (!agent) {
        throw new UnauthorizedError(
          '🚨 Funcionário não encontrado. Verifique os dados e tente novamente.'
        )
      }

      if (agent.role === 'MEMBER') {
        throw new UnauthorizedError(
          '🚨 Permissão negada. Você precisa ser um administrador para realizar esta ação.'
        )
      }
    }
  })
})
