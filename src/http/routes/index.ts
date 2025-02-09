import type { FastifyInstance } from 'fastify'
import { createAccount } from './create-account'

export async function routes(app: FastifyInstance) {
  app.register(createAccount)
}
