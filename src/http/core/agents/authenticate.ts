import { compare } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { BadRequestError } from 'http/_errors/bad-request-error'
import { UnauthorizedError } from 'http/_errors/unauthorized-error'
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

      // Verifica se o usuário foi desativado pelo administrador
      if (userFromEmail && userFromEmail.inactive !== null) {
        throw new BadRequestError(
          'O funcionário está inativo. Procure com o administrador do sistema.'
        )
      }

      if (!userFromEmail) {
        throw new BadRequestError(
          'Credenciais inválidas. Verifique suas informações e tente novamente.'
        )
      }

      const isPasswordValid = await compare(
        password,
        userFromEmail.passwordHash
      )

      if (!isPasswordValid) {
        throw new BadRequestError(
          'Credenciais inválidas. Verifique suas informações e tente novamente.'
        )
      }

      try {
        // Criação do token de autenticação
        const token = await reply.jwtSign(
          {
            // Envia o id do usuário para o token
            sub: userFromEmail.id,
            role: userFromEmail.role,
          },
          {
            sign: {
              expiresIn: '1d',
            },
          }
        )

        return reply
          .setCookie('@lexhub-auth', token, {
            path: '/',
            httpOnly: true,
            sameSite: true,
            maxAge: 60 * 60 * 24, // 1 dia
          })
          .status(201)
          .send({
            token,
          })
      } catch (err) {
        throw new UnauthorizedError(
          'Erro ao se autenticar. Verifique suas informações e tente novamente.'
        )
      }
    }
  )
}
