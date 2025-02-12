import type { FastifyInstance } from 'fastify'

import { authenticate } from 'http/core/agents/authenticate'
import { getProfile } from 'http/core/agents/get-profile'
import { createAccountService } from '../core/agents/create-account'

export async function routes(app: FastifyInstance) {
  app.register(createAccountService)
  app.register(authenticate)
  app.register(getProfile)
}
