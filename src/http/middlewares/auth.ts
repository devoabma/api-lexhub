import type { Role } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import { fastifyPlugin } from 'fastify-plugin'
import { ForbiddenError } from 'http/_errors/forbidden-error'
import { UnauthorizedError } from 'http/_errors/unauthorized-error'
import { prisma } from 'lib/prisma'

interface CurrentAgent {
  id: string
  role: Role
}

export const auth = fastifyPlugin(async (app: FastifyInstance) => {
  app.addHook('preHandler', async request => {
    // Guarda a busca do funcionário da sessão: vários helpers chamados na
    // mesma requisição geram uma única consulta ao banco
    let currentAgent: Promise<CurrentAgent> | undefined

    async function loadCurrentAgent(): Promise<CurrentAgent> {
      // Verifica se o token é valido e pega o sub
      const { sub } = await request.jwtVerify<{ sub: string }>().catch(() => {
        throw new UnauthorizedError(
          'Token inválido ou expirado. Faça login novamente.'
        )
      })

      // O papel e a inatividade vêm do banco, não do JWT
      const agent = await prisma.agent.findUnique({
        where: { id: sub },
        select: { id: true, role: true, inactive: true },
      })

      // Funcionário removido do banco: a sessão deixa de valer
      if (!agent) {
        throw new UnauthorizedError(
          'Token inválido ou expirado. Faça login novamente.'
        )
      }

      // Funcionário inativado perde o acesso na hora, mesmo com token válido
      if (agent.inactive) {
        throw new UnauthorizedError(
          'Seu acesso foi desativado. Procure o administrador do sistema.'
        )
      }

      return { id: agent.id, role: agent.role }
    }

    request.getCurrentAgent = () => {
      currentAgent ??= loadCurrentAgent()

      return currentAgent
    }

    request.getCurrentAgentId = async () => {
      const { id } = await request.getCurrentAgent()

      return id
    }

    request.checkIfAgentIsAdmin = async () => {
      const { role } = await request.getCurrentAgent()

      if (role !== 'ADMIN') {
        throw new ForbiddenError(
          'Permissão negada. Você precisa ser um administrador para realizar esta ação.'
        )
      }
    }
  })
})
