"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production']).default('development'),
    PORT: zod_1.z.coerce.number().default(3892),
    DATABASE_URL: zod_1.z.string().url(),
    PASSWORD_ADMIN_FULL: zod_1.z.string().min(8),
    EMAIL_ADMIN_FULL: zod_1.z.string().email(),
    JWT_SECRET: zod_1.z.string().min(8),
    RESEND_API_KEY: zod_1.z.string(),
    WEB_URL: zod_1.z.string().url(),
    API_PROTHEUS_DATA_URL: zod_1.z.string().url(),
    API_PROTHEUS_FIN_URL: zod_1.z.string().url(),
});
const _env = envSchema.safeParse(process.env);
if (_env.success === false) {
    console.error('> ❌ Variáveis de ambiente inválidas, verifique o arquivo .env', _env.error.format());
    throw new Error('❌ Houve um erro ao carregar as variáveis de ambiente.');
}
exports.env = _env.data;
