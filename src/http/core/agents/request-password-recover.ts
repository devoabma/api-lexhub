import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { prisma } from 'lib/prisma'
import { z } from 'zod'

export async function requestPasswordRecover(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/agents/password/recover',
    {
      schema: {
        tags: ['agents'],
        summary: 'Requisição de redefinição de senha',
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

      const { id: code } = await prisma.token.create({
        data: {
          type: 'PASSWORD_RECOVER',
          agentId: agentFromEmail.id,
        },
      })

      // TODO: Enviar email de redefinição de senha com o Resend

      console.log(
        '> ✅ Email de redefinição de senha enviado com sucesso.',
        code
      )

      return reply.status(200).send()
    }
  )
}
