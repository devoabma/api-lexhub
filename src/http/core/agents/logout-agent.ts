import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { env } from 'http/_env'
import z from 'zod'

export async function logoutAgent(app: FastifyInstance) {
  // Rota pública e idempotente: funciona mesmo com o token expirado
  app.withTypeProvider<ZodTypeProvider>().post(
    '/agents/logout',
    {
      schema: {
        tags: ['agents'],
        summary: 'Desloga o funcionário, com ou sem token válido',
        response: {
          200: z.null(),
        },
      },
    },
    async (_request, reply) => {
      // Mesmos atributos do login, condição para o navegador apagar o cookie
      return reply
        .clearCookie('@lexhub-auth', {
          path: '/',
          domain: env.DOMAIN,
        })
        .status(200)
        .send()
    }
  )
}
