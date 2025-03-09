import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { env } from 'http/_env'
import { prisma } from 'lib/prisma'
import { resend } from 'lib/resend'
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

      const { code } = await prisma.token.create({
        data: {
          type: 'PASSWORD_RECOVER',
          agentId: agentFromEmail.id,
          code: generateRecoveryCode(),
        },
      })

      await resend.emails.send({
        from: '📧 OAB Atende <oabatende@oabma.com.br>',
        // FIXME: Em ambiente de desenvolvimento envia para o email do desenvolvedor
        to: env.NODE_ENV === 'PRODUCTION' ? email : 'hilquiasfmelo@hotmail.com',
        subject: '🔄 Redefinição de Senha - OAB Atende',
        react: ResetPasswordEmail({
          name: agentFromEmail.name,
          code,
          link: `${env.WEB_URL}/reset-password?code=${code}`,
        }),
      })

      // Somente em ambiente de desenvolvimento mostra no console
      if (env.NODE_ENV === 'DEVELOPMENT') {
        console.log(
          '> ✅ Email de redefinição de senha enviado com sucesso.',
          code
        )
      }

      return reply.status(200).send()
    }
  )
}
