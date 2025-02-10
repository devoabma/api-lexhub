import { hash } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { prisma } from 'lib/prisma'
import { z } from 'zod'

export async function createAccountService(app: FastifyInstance) {
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
    async (request, reply) => {
      const {name, email, password_hash} = request.body

      const userWithSameEmail = await prisma.agent.findUnique({
        where: {
          email,
        },
      })

      if(userWithSameEmail) {
        return reply.status(400).send({
          message: 'Já existe um funcionário cadastrado com esse e-mail.',
        })
      }

      const passwordHash = await hash(password_hash, 8)

      const agent = await prisma.agent.create({
        data: {
          name,
          email,
          passwordHash,
        },
      })

      return reply.status(201).send()
    }
  )
}
