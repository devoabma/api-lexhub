import { hash } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { env } from 'http/_env'
import { BadGatewayError } from 'http/_errors/bad-gateway-error'
import { ConflictError } from 'http/_errors/conflict-error'
import { auth } from 'http/middlewares/auth'
import { prisma } from 'lib/prisma'
import { EmailDeliveryError, sendEmail } from 'lib/resend'
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
          throw new ConflictError(
            'E-mail já cadastrado para outro funcionário.'
          )
        }

        const passwordHash = await hash(password, 8)

        try {
          // Grava e envia na mesma transação: se o e-mail falhar, o cadastro
          // é desfeito; se a gravação falhar, nenhum e-mail é enviado
          await prisma.$transaction(
            async tx => {
              await tx.agent.create({
                data: {
                  name,
                  email,
                  passwordHash,
                },
              })

              // Envia email de boas vindas para o novo funcionário com seus dados
              await sendEmail({
                from: '📧 OAB Atende <oabatende@oabma.org.br>',
                to: email,
                subject: '🎉 Bem-vindo à equipe! Aqui estão suas informações.',
                react: AgentRegistrationEmail({
                  name,
                  email,
                  tempPassword: password,
                  link: env.WEB_URL,
                }),
              })
            },
            { timeout: 15_000 }
          )
        } catch (err) {
          if (err instanceof EmailDeliveryError) {
            throw new BadGatewayError(
              'Não foi possível enviar o e-mail de boas-vindas. O funcionário não foi cadastrado, tente novamente mais tarde.',
              { cause: err }
            )
          }

          throw err
        }

        return reply.status(201).send()
      }
    )
}
