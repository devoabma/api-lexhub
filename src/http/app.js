"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const cookie_1 = require("@fastify/cookie");
const cors_1 = require("@fastify/cors");
const jwt_1 = require("@fastify/jwt");
const rate_limit_1 = require("@fastify/rate-limit");
const swagger_1 = require("@fastify/swagger");
const swagger_ui_1 = require("@fastify/swagger-ui");
const fastify_1 = require("fastify");
const fastify_type_provider_zod_1 = require("fastify-type-provider-zod");
const _env_1 = require("./_env");
const _errors_1 = require("./_errors");
const routes_1 = require("./routes");
exports.app = (0, fastify_1.fastify)().withTypeProvider();
exports.app.setSerializerCompiler(fastify_type_provider_zod_1.serializerCompiler);
exports.app.setValidatorCompiler(fastify_type_provider_zod_1.validatorCompiler);
// Configura o swagger para documentação da API
exports.app.register(swagger_1.fastifySwagger, {
    openapi: {
        info: {
            title: 'API LexHub',
            description: '📚 API LexHub (OAB Atende) | Sistema de Gestão de Atendimentos da OAB Maranhão',
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
    transform: fastify_type_provider_zod_1.jsonSchemaTransform,
});
exports.app.register(swagger_ui_1.fastifySwaggerUi, {
    routePrefix: '/docs', // rota para acessar a documentação
});
exports.app.register(jwt_1.fastifyJwt, {
    secret: _env_1.env.JWT_SECRET,
    cookie: {
        cookieName: '@lexhub-auth',
        signed: false,
    },
});
exports.app.register(cors_1.fastifyCors, {
    origin: _env_1.env.WEB_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
});
exports.app.register(cookie_1.fastifyCookie);
exports.app.register(rate_limit_1.fastifyRateLimit, {
    max: 100, // Máximo de 100 requisições
    timeWindow: '1 minute', // Por minuto
    cache: 10000, // Cache de requisições para melhor desempenho
});
exports.app.register(routes_1.routes);
// Configura o tratamento de erros globais da API
exports.app.setErrorHandler(_errors_1.errorHandler);
