import { hash } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { BadRequestError } from 'http/_errors/bad-request-error'
import { auth } from 'http/middlewares/auth'
import { prisma } from 'lib/prisma'
import { z } from 'zod'

export async function createAccountService(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/agents',
      {
        schema: {
          tags: ['agents'],
          summary: 'Criação de um novo funcionário',
          body: z.object({
            name: z.string(),
            email: z.string().email(),
            password_hash: z.string().min(8),
          }),
          response: {
            201: z.object({}),
          },
        },
      },
      async (request, reply) => {
        await request.checkIfAgentIsAdmin()

        const { name, email, password_hash } = request.body

        const userWithSameEmail = await prisma.agent.findUnique({
          where: {
            email,
          },
        })

        if (userWithSameEmail) {
          throw new BadRequestError(
            'Já existe um funcionário cadastrado com esse e-mail.'
          )
        }

        const passwordHash = await hash(password_hash, 8)

        await prisma.agent.create({
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
