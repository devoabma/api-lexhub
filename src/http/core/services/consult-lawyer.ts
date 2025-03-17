import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { UnauthorizedError } from 'http/_errors/unauthorized-error'
import { auth } from 'http/middlewares/auth'
import { API_PROTHEUS_DATA_URL, API_PROTHEUS_FIN_URL } from 'lib/axios'
import { z } from 'zod'

interface LawyersProps {
  lawyer: {
    nome: string
  }
}

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
            200: z.object({
              name: z.string(),
            }),
          },
        },
      },
      async (request, reply) => {
        await request.getCurrentAgentId()

        const { oab } = request.body

        // Busca na API do Protheus se o advogado está adimplente
        const { data } = await API_PROTHEUS_FIN_URL(`/${oab}`)

        const {
          data: { lawyer },
        } = await API_PROTHEUS_DATA_URL<LawyersProps>('/', {
          params: {
            idOrg: 10,
            param: oab,
          },
        })

        if (!data) {
          const name = lawyer?.nome

          throw new UnauthorizedError(
            `Prezado(a) ${name}, não podemos prosseguir com o atendimento. Para mais informações, entre em contato com o Setor Financeiro.`
          )
        }

        return reply.status(200).send({
          name: lawyer?.nome,
        })
      }
    )
}
