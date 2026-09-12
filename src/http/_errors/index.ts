import { AxiosError } from 'axios'
import type { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { BadRequestError } from './bad-request-error'
import { ConflictError } from './conflict-error'
import { ForbiddenError } from './forbidden-error'
import { NotFoundError } from './not-found-error'
import { UnauthorizedError } from './unauthorized-error'
import { UnprocessableEntityError } from './unprocessable-entity-error'

type FastifyErrorHandler = FastifyInstance['errorHandler']

export const errorHandler: FastifyErrorHandler = (error, request, reply) => {
  if (error.validation) {
    return reply.status(400).send({
      message: 'Houve um erro na validação, verifique os dados enviados.',
    })
  }

  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: 'Houve um erro na validação, verifique os dados enviados.',
      errors: error.flatten().fieldErrors,
    })
  }

  if (error instanceof BadRequestError) {
    return reply.status(400).send({
      message: error.message,
    })
  }

  // 401 é exclusivo de sessão inválida e só é lançado pelo middleware de auth
  if (error instanceof UnauthorizedError) {
    return reply.status(401).send({
      message: error.message,
    })
  }

  if (error instanceof ForbiddenError) {
    return reply.status(403).send({
      message: error.message,
    })
  }

  if (error instanceof NotFoundError) {
    return reply.status(404).send({
      message: error.message,
    })
  }

  if (error instanceof ConflictError) {
    return reply.status(409).send({
      message: error.message,
    })
  }

  if (error instanceof UnprocessableEntityError) {
    return reply.status(422).send({
      message: error.message,
    })
  }

  // TODO: Adicionar funcionalidade do RateLimit.
  if (error.statusCode === 429) {
    return reply.status(429).send({
      message: 'Limite de requisições excedido. Tente novamente mais tarde.',
    })
  }

  // Erro global disparado se não houver advogado
  if (error instanceof AxiosError) {
    return reply.status(404).send({
      message:
        'Consulta indisponível ou advogado(a) não encontrado. Verifique os dados e tente novamente mais tarde.',
    })
  }

  console.error(error)
  // Enviar erro para alguma plataforma de observabilidade
  return reply.status(500).send({
    message: 'Erro interno do servidor. Tente novamente mais tarde.',
  })
}
