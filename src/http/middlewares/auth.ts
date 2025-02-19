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
      try {
        const { sub } = await request.jwtVerify<{ sub: string }>()

        const agent = await prisma.agent.findUnique({
          where: {
            id: sub,
          },
          select: {
            role: true,
          },
        })

        // Se o agente não for encontrado ou não for um administrador, lança um erro
        if (!agent || agent.role !== 'ADMIN') {
          throw new UnauthorizedError(
            '🚨 Você não possui permissão para realizar essa operação.'
          )
        }
      } catch {
        throw new UnauthorizedError(
          '🚨 Token inválido ou expirado. Faça login novamente.'
        )
      }
    }
  })
})
