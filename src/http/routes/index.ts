import type { FastifyInstance } from 'fastify'

import { activeAgent } from 'http/core/agents/active-agent'
import { authenticate } from 'http/core/agents/authenticate'
import { getAll } from 'http/core/agents/get-all'
import { getProfile } from 'http/core/agents/get-profile'
import { inactiveAgent } from 'http/core/agents/inactive-agent'
import { requestPasswordRecover } from 'http/core/agents/request-password-recover'
import { resetPassword } from 'http/core/agents/reset-password'
import { updateAgent } from 'http/core/agents/update-agent'
import { createService } from 'http/core/services/create-service'
import { createTypeService } from 'http/core/services/create-type-service'
import { finishedService } from 'http/core/services/finished-service'
import { getAllServices } from 'http/core/services/get-all-services'
import { getAllTypesServices } from 'http/core/services/get-all-types-services'
import { updateTypeService } from 'http/core/services/update-type-service'
import { createAccountService } from '../core/agents/create-account'
import { cancelService } from 'http/core/services/cancel-service'
import { getAllQuantityServices } from 'http/core/services/get-all-quantity-services'
import { getAllQuantityServicesInMonth } from 'http/core/services/get-all-quantity-services-in-month'
import { getAllQuantityServicesInYear } from 'http/core/services/get-all-quantity-services-in-year'

export async function routes(app: FastifyInstance) {
  // Rotas de agents
  app.register(createAccountService)
  app.register(authenticate)
  app.register(getProfile)
  app.register(requestPasswordRecover)
  app.register(resetPassword)
  app.register(getAll)
  app.register(updateAgent)
  app.register(inactiveAgent)
  app.register(activeAgent)

  // Rotas de services types
  app.register(createTypeService)
  app.register(getAllTypesServices)
  app.register(updateTypeService)

  // Rotas de services
  app.register(createService)
  app.register(getAllServices)
  app.register(finishedService)
  app.register(cancelService)
  app.register(getAllQuantityServices)
  app.register(getAllQuantityServicesInMonth)
  app.register(getAllQuantityServicesInYear)
}
