import type { Role } from '@prisma/client'
import 'fastify'

declare module 'fastify' {
  export interface FastifyRequest {
    getCurrentAgent(): Promise<{ id: string; role: Role }>
    getCurrentAgentId(): Promise<string>
    checkIfAgentIsAdmin(): Promise<void>
  }
}
