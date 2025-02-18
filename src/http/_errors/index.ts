import type { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { BadRequestError } from './bad-request-error'
import { UnauthorizedError } from './unauthorized-error'

type FastifyErrorHandler = FastifyInstance['errorHandler']

export const errorHandler: FastifyErrorHandler = (error, request, reply) => {
  if (error instanceof ZodError) {
    reply.status(400).send({
      message: 'Houve um erro na validação, verifique os dados enviados.',
      errors: error.flatten().fieldErrors,
    })
  }

  if (error instanceof BadRequestError) {
    reply.status(400).send({
      message: error.message,
    })
  }

  if (error instanceof UnauthorizedError) {
    reply.status(401).send({
      message: error.message,
    })
  }

  // TODO: Adicionar funcionalidade do RateLimit.
  if (error.statusCode === 429) {
    return reply.status(429).send({
      message: 'Limite de requisições excedido. Tente novamente mais tarde.',
    })
  }

  console.error(error)
  // Enviar erro para alguma plataforma de observabilidade
  reply.status(500).send({
    message: '🚨 Erro interno do servidor. Tente novamente mais tarde.',
  })
}
