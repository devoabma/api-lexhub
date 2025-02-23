import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { UnauthorizedError } from 'http/_errors/unauthorized-error'
import { auth } from 'http/middlewares/auth'
import { API_PROTHEUS_DATA_URL, API_PROTHEUS_FIN_URL } from 'lib/axios'
import { prisma } from 'lib/prisma'
import { z } from 'zod'

interface LawyersProps {
  lawyer: {
    nome: string
    cpf: string
    registro: string
    email: string
  }
}

export async function createService(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/services',
      {
        schema: {
          tags: ['services'],
          summary: 'Criação de um novo atendimento',
          security: [{ bearerAuth: [] }],
          body: z.object({
            oab: z.string(),
            serviceTypeId: z.string().cuid(),
            observation: z.string().optional(),
            assistance: z.enum(['PERSONALLY', 'REMOTE']),
            status: z.enum(['OPEN', 'COMPLETED']),
          }),
          response: {
            201: z.null(),
          },
        },
      },
      async (request, reply) => {
        const agentId = await request.getCurrentAgentId()

        const { oab, serviceTypeId, observation, assistance, status } =
          request.body

        // Busca na API do Protheus se o advogado está adimplente
        const { data } = await API_PROTHEUS_FIN_URL(`/${oab}`)

        if (!data) {
          throw new UnauthorizedError(
            '🚨 Não foi possível prosseguir com o atendimento no momento. Por favor, entre em contato com o setor financeiro para mais informações.'
          )
        }

        // Verifica se o advogado já está cadastrado no banco de dados
        let lawyer = await prisma.lawyer.findUnique({
          where: {
            oab,
          },
        })

        // Cria o advogado no banco de dados se ele ainda não estiver cadastrado
        if (!lawyer) {
          const {
            data: { lawyer: lawyerData },
          } = await API_PROTHEUS_DATA_URL<LawyersProps>('/', {
            params: {
              idOrg: 10,
              param: oab,
            },
          })

          lawyer = await prisma.lawyer.create({
            data: {
              name: lawyerData.nome,
              cpf: lawyerData.cpf,
              oab: lawyerData.registro,
              email: lawyerData.email,
            },
          })
        }

        // Verifica se o tipo de serviço existe
        const serviceType = await prisma.serviceTypes.findUnique({
          where: {
            id: serviceTypeId,
          },
        })

        if (!serviceType) {
          throw new UnauthorizedError(
            '🚨 Tipo de serviço inválido. Verifique as informações e tente novamente.'
          )
        }

        // Cria o atendimento (Service)
        const service = await prisma.services.create({
          data: {
            assistance,
            status,
            observation,
            agentId,
            lawyerId: lawyer.id,
          },
        })

        // Associa o Service ao ServiceType na tabela ServiceServiceTypes
        await prisma.serviceServiceTypes.create({
          data: {
            serviceId: service.id,
            serviceTypeId: serviceType.id,
          },
        })

        return reply.status(201).send()
      }
    )
}
