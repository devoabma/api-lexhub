import { hash } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { env } from 'http/_env'
import { BadRequestError } from 'http/_errors/bad-request-error'
import { auth } from 'http/middlewares/auth'
import { prisma } from 'lib/prisma'
import { resend } from 'lib/resend'
import { AgentRegistrationEmail } from 'utils/emails/agent-registration-email'
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
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string(),
            email: z.string().email(),
            password: z.string().min(8),
          }),
          response: {
            201: z.null(),
          },
        },
      },
      async (request, reply) => {
        // Somente admins podem criar um novo funcionário
        await request.checkIfAgentIsAdmin()

        const { name, email, password } = request.body

        const userWithSameEmail = await prisma.agent.findUnique({
          where: {
            email,
          },
        })

        if (userWithSameEmail) {
          throw new BadRequestError(
            '🚨 Já existe um funcionário cadastrado com esse e-mail.'
          )
        }

        const passwordHash = await hash(password, 8)

        try {
          // Envia email de boas vindas para o novo funcionário com seus dados
          await resend.emails.send({
            from: '📧 OAB Atende <oabatende@oabma.com.br>',
            // FIXME: Em ambiente de desenvolvimento envia para o email do desenvolvedor
            to:
              env.NODE_ENV === 'PRODUCTION'
                ? email
                : 'hilquiasfmelo@hotmail.com',
            subject: '🎉 Bem-vindo à equipe! Aqui estão suas informações.',
            react: AgentRegistrationEmail({
              name,
              email,
              tempPassword: password,
              link: env.WEB_URL,
            }),
          })

          await prisma.agent.create({
            data: {
              name,
              email,
              passwordHash,
            },
          })

          return reply.status(201).send()
        } catch (err) {
          throw new BadRequestError(
            '🚨 Ocorreu um erro ao tentar criar o funcionário. Por favor, tente novamente mais tarde.'
          )
        }
      }
    )
}
