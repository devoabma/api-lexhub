import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['DEVELOPMENT', 'PRODUCTION']).default('DEVELOPMENT'),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().url(),
  PASSWORD_ADMIN_FULL: z.string().min(8),
  EMAIL_ADMIN_FULL: z.string().email(),
})

const _env = envSchema.safeParse(process.env)

if (_env.success === false) {
  console.error(
    '> ❌ Variáveis de ambiente inválidas, verifique o arquivo .env',
    _env.error.format()
  )

  throw new Error('❌ Houve um erro ao carregar as variáveis de ambiente.')
}

export const env = _env.data
