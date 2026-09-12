import { z } from 'zod'

// Parâmetros de período aceitos pelas rotas de métricas
export const yearQuerySchema = z.coerce.number().int().min(2000).max(2100)

export const monthQuerySchema = z.coerce.number().int().min(1).max(12)
