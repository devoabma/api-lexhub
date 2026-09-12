import dayjs from 'dayjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { UnprocessableEntityError } from 'http/_errors/unprocessable-entity-error'
import { auth } from 'http/middlewares/auth'
import { API_PROTHEUS_DATA_URL, API_PROTHEUS_FIN_URL } from 'lib/axios'
import { prisma } from 'lib/prisma'
import { assertLawyerHasNoOpenService } from 'utils/services/assert-no-open-service'
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
            oab: z.string().trim().min(1),
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

        // Com atendimento em aberto, nem consulta o Protheus
        await assertLawyerHasNoOpenService(oab)

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

        const lawyerRestrictionService = await prisma.lawyer.findFirst({
          where: {
            oab,
          },
          select: {
            restrictedServiceCount: true,
          },
        })

        const restrictedServiceCount =
          lawyerRestrictionService?.restrictedServiceCount

        const formattedLawyerRestrictionService = restrictedServiceCount
          ? dayjs(restrictedServiceCount).format('DD/MM/YYYY')
          : null

        // Inadimplência é regra de negócio sobre o advogado (422), não falha
        // da sessão do funcionário
        if (!data) {
          const name = lawyer?.nome

          if (formattedLawyerRestrictionService) {
            throw new UnprocessableEntityError(
              `Prezado(a) ${name}, não é possível prosseguir com o atendimento.
               Para mais informações, entre em contato com o Setor Financeiro.
               Advogado(a) atendido(a) anteriormente em ${formattedLawyerRestrictionService}.`
            )
          }

          throw new UnprocessableEntityError(
            `Prezado(a) ${name}, não podemos prosseguir com o atendimento.
             Para mais informações, entre em contato com o Setor Financeiro.`
          )
        }

        return reply.status(200).send({
          name: lawyer?.nome,
        })
      }
    )
}
