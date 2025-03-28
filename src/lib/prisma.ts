import { PrismaClient } from '@prisma/client'
import { env } from 'http/_env'

export const prisma = new PrismaClient({
  // Gera logs de queries apenas em ambiente de desenvolvimento
  log: env.NODE_ENV === 'development' ? ['query'] : [],
})
