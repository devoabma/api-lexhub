import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { BadRequestError } from 'http/_errors/bad-request-error'
import { auth } from 'http/middlewares/auth'
import { prisma } from 'lib/prisma'
import z from 'zod'

export async function getAll(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/agents/all',
      {
        schema: {
          tags: ['agents'],
          summary: 'Busca todos os funcionários cadastrados',
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              agents: z.array(
                z.object({
                  id: z.string().uuid(),
                  name: z.string(),
                  email: z.string().email(),
                  role: z.enum(['ADMIN', 'MEMBER']),
                  inactive: z.date().nullable(),
                })
              ),
            }),
          },
        },
      },
      async (request, reply) => {
        // Somente administradores podem listar todos os funcionários
        await request.checkIfAgentIsAdmin()

        const agents = await prisma.agent.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            inactive: true,
          },
          orderBy: [
            {
              createdAt: 'desc', // Mostra os funcionários mais recentes primeiro
            },
          ],
        })

        if (!agents) {
          throw new BadRequestError(
            ' Ainda não há funcionários cadastrados no sistema. Por favor, cadastre um funcionário antes de prosseguir.'
          )
        }

        return reply.status(200).send({
          agents,
        })
      }
    )
}
