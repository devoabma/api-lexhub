"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const axios_1 = require("axios");
const zod_1 = require("zod");
const bad_request_error_1 = require("./bad-request-error");
const unauthorized_error_1 = require("./unauthorized-error");
const errorHandler = (error, request, reply) => {
    if (error.validation) {
        return reply.status(400).send({
            message: ' Houve um erro na validação, verifique os dados enviados.',
        });
    }
    if (error instanceof zod_1.ZodError) {
        return reply.status(400).send({
            message: 'Houve um erro na validação, verifique os dados enviados.',
            errors: error.flatten().fieldErrors,
        });
    }
    if (error instanceof bad_request_error_1.BadRequestError) {
        return reply.status(400).send({
            message: error.message,
        });
    }
    if (error instanceof unauthorized_error_1.UnauthorizedError) {
        return reply.status(401).send({
            message: error.message,
        });
    }
    // TODO: Adicionar funcionalidade do RateLimit.
    if (error.statusCode === 429) {
        return reply.status(429).send({
            message: 'Limite de requisições excedido. Tente novamente mais tarde.',
        });
    }
    // Erro global disparado se não houver advogado
    if (error instanceof axios_1.AxiosError) {
        return reply.status(404).send({
            message: 'Consulta indisponível ou advogado(a) não encontrado. Verifique os dados e tente novamente mais tarde.',
        });
    }
    console.error(error);
    // Enviar erro para alguma plataforma de observabilidade
    return reply.status(500).send({
        message: 'Erro interno do servidor. Tente novamente mais tarde.',
    });
};
exports.errorHandler = errorHandler;
