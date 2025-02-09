import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

export async function createAccount(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/agents',
    {
      schema: {
        body: z.object({
          name: z.string(),
          email: z.string().email(),
          password_hash: z.string().min(8),
        }),
      },
    },
    () => {
      return 'Usuario criado com sucesso'
    }
  )
}
