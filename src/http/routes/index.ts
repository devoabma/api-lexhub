import type { FastifyInstance } from 'fastify'
import { createAccountService } from '../services/create-account'

export async function routes(app: FastifyInstance) {
  app.register(createAccountService)
}
