import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { BadRequestError } from 'http/_errors/bad-request-error'
import { prisma } from 'lib/prisma'
import z from 'zod'

export async function getProfile(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/agents/profile',
    {
      schema: {
        tags: ['agents'],
        summary: 'Busca o perfil de um funcionário logado',
        response: {
          200: z.object({
            agent: z.object({
              id: z.string().uuid(),
              name: z.string(),
              email: z.string().email(),
              role: z.enum(['ADMIN', 'MEMBER']),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      const { sub } = await request.jwtVerify<{ sub: string }>()

      // Retorna o usuário somente com os dados necessários
      const agent = await prisma.agent.findUnique({
        where: {
          id: sub,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      })

      if (!agent) {
        throw new BadRequestError(
          'Funcionário não encontrado, verifique os dados enviados.'
        )
      }

      return reply.status(200).send({ agent })
    }
  )
}
