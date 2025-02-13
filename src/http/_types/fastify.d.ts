import 'fastify'

declare module 'fastify' {
  export interface FastifyRequest {
    getCurrentAgentId(): Promise<string>
    checkIfAgentIsAdmin(): Promise<void>
  }
}
