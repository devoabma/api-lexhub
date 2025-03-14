import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { UnauthorizedError } from 'http/_errors/unauthorized-error'
import { auth } from 'http/middlewares/auth'
import { API_PROTHEUS_FIN_URL } from 'lib/axios'
import { z } from 'zod'

export async function consultLawyer(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/services/consult/lawyer',
      {
        schema: {
          tags: ['services'],
          summary: 'Consulta inadimplência do advogado',
          security: [{ bearerAuth: [] }],
          body: z.object({
            oab: z.string(),
          }),
          response: {
            200: z.null(),
          },
        },
      },
      async (request, reply) => {
        await request.getCurrentAgentId()

        const { oab } = request.body

        // Busca na API do Protheus se o advogado está adimplente
        const { data } = await API_PROTHEUS_FIN_URL(`/${oab}`)

        if (!data) {
          throw new UnauthorizedError(
            'Infelizmente não será possível prosseguir com o atendimento no momento. Por favor, entre em contato com o Setor Financeiro para mais informações.'
          )
        }

        return reply.status(200).send()
      }
    )
}
