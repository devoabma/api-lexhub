import { fastifyCookie } from '@fastify/cookie'
import { fastifyCors } from '@fastify/cors'
import { fastifyJwt } from '@fastify/jwt'
import { fastifyRateLimit } from '@fastify/rate-limit'
import { fastifySwagger } from '@fastify/swagger'
import { fastifySwaggerUi } from '@fastify/swagger-ui'
import { fastify } from 'fastify'
import {
  type ZodTypeProvider,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { env } from './_env'
import { errorHandler } from './_errors'
import { routes } from './routes'

export const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

// Configura o tratamento de erros globais da API
app.setErrorHandler(errorHandler)

// Configura o swagger para documentação da API
app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'API LexHub',
      description:
        '📚 API LexHub (OAB Atende) | Sistema de Gestão de Atendimentos da OAB Maranhão',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        // bearerAuth nome definido para o securitySchemes no swagger
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    servers: [],
  },
  transform: jsonSchemaTransform,
})

app.register(fastifySwaggerUi, {
  routePrefix: '/docs', // rota para acessar a documentação
})

app.register(fastifyCookie)

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
  cookie: {
    cookieName: '@lexhub-auth',
    signed: false,
  },
})

app.register(fastifyCors, {
  origin: env.WEB_URL, // domínio permitido
  methods: ['PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // permite cookies
})

app.register(fastifyRateLimit, {
  max: 100, // Máximo de 100 requisições
  timeWindow: '1 minute', // Por minuto
  cache: 10000, // Cache de requisições para melhor desempenho
})

app.register(routes)
