import { compare } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { BadRequestError } from 'http/_errors/bad-request-error'
import { prisma } from 'lib/prisma'
import { z } from 'zod'

export async function authenticate(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/agents/sessions',
    {
      schema: {
        tags: ['agents'],
        summary: 'Autenticação de um funcionário',
        body: z.object({
          email: z.string().email(),
          password: z.string().min(8),
        }),
        response: {
          201: z.object({
            token: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body

      const userFromEmail = await prisma.agent.findUnique({
        where: {
          email,
        },
      })

      if (!userFromEmail) {
        throw new BadRequestError('Credenciais fornecidas inválidas.')
      }

      const isPasswordValid = await compare(
        password,
        userFromEmail.passwordHash
      )

      if (!isPasswordValid) {
        throw new BadRequestError('Credenciais fornecidas inválidas.')
      }

      // Criação do token de autenticação
      const token = await reply.jwtSign(
        {
          sub: userFromEmail.id,
        },
        {
          sign: {
            expiresIn: '1d',
          },
        }
      )

      return reply.status(201).send({
        token,
      })
    }
  )
}
