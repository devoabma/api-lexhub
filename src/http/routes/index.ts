import type { FastifyInstance } from 'fastify'

import { authenticate } from 'http/core/agents/authenticate'
import { getAll } from 'http/core/agents/get-all'
import { getProfile } from 'http/core/agents/get-profile'
import { requestPasswordRecover } from 'http/core/agents/request-password-recover'
import { resetPassword } from 'http/core/agents/reset-password'
import { updateAgent } from 'http/core/agents/update-agent'
import { createAccountService } from '../core/agents/create-account'

export async function routes(app: FastifyInstance) {
  app.register(createAccountService)
  app.register(authenticate)
  app.register(getProfile)
  app.register(requestPasswordRecover)
  app.register(resetPassword)
  app.register(getAll)
  app.register(updateAgent)
}
