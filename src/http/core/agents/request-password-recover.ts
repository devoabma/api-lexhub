import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { env } from 'http/_env'
import { prisma } from 'lib/prisma'
import { EmailDeliveryError, sendEmail } from 'lib/resend'
import { ResetPasswordEmail } from 'utils/emails/reset-password-email'
import { generateRecoveryCode } from 'utils/generate-recovery-code'
import { z } from 'zod'

export async function requestPasswordRecover(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/agents/password/recover',
    {
      schema: {
        tags: ['agents'],
        summary: 'Requisição de redefinição de senha',
        security: [{ bearerAuth: [] }],
        body: z.object({
          email: z.string().email(),
        }),
        response: {
          200: z.null(),
        },
      },
    },
    async (request, reply) => {
      const { email } = request.body

      const agentFromEmail = await prisma.agent.findUnique({
        where: {
          email,
        },
      })

      if (!agentFromEmail) {
        // Não queremos que as pessoas saibam se o usuário realmente existe
        return reply.status(200).send()
      }

      let code: string

      try {
        // Grava o token e envia na mesma transação: se o e-mail falhar, o
        // token é desfeito e não sobra código que ninguém recebeu
        code = await prisma.$transaction(
          async tx => {
            const token = await tx.token.create({
              data: {
                type: 'PASSWORD_RECOVER',
                agentId: agentFromEmail.id,
                code: generateRecoveryCode(),
              },
            })

            await sendEmail({
              from: '📧 OAB Atende <oabatende@oabma.org.br>',
              // FIXME: Em ambiente de desenvolvimento envia para o email do desenvolvedor
              to:
                env.NODE_ENV === 'production'
                  ? email
                  : 'hilquiasfmelo@hotmail.com',
              subject: '🔄 Redefinição de Senha - OAB Atende',
              react: ResetPasswordEmail({
                name: agentFromEmail.name,
                code: token.code,
                link: `${env.WEB_URL}/reset-password?code=${token.code}`,
              }),
            })

            return token.code
          },
          { timeout: 15_000 }
        )
      } catch (err) {
        if (!(err instanceof EmailDeliveryError)) {
          throw err
        }

        // Responde 200 mesmo assim para não revelar que o e-mail existe
        console.error(
          '> Falha ao enviar o e-mail de redefinição de senha:',
          err
        )

        return reply.status(200).send()
      }

      // Excluir o token após 2 minutos (120000ms)
      setTimeout(async () => {
        await prisma.token.delete({
          where: { code },
        })
      }, 120000)

      // Somente em ambiente de desenvolvimento mostra no console
      if (env.NODE_ENV === 'development') {
        console.log(
          '> ✅ Email de redefinição de senha enviado com sucesso.',
          code
        )
      }

      return reply.status(200).send()
    }
  )
}
