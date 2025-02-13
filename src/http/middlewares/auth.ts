import type { FastifyInstance } from 'fastify'
import { fastifyPlugin } from 'fastify-plugin'
import { UnauthorizedError } from 'http/_errors/unauthorized-error'
import { prisma } from 'lib/prisma'

export const auth = fastifyPlugin(async (app: FastifyInstance) => {
  app.addHook('preHandler', async request => {
    request.getCurrentAgentId = async () => {
      try {
        const { sub } = await request.jwtVerify<{ sub: string }>()

        return sub
      } catch {
        throw new UnauthorizedError(
          '🚨 Não autorizado para realizar essa operação.'
        )
      }
    }

    request.checkIfAgentIsAdmin = async () => {
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
    }
  })
})
