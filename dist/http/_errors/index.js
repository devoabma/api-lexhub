"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/http/_errors/index.ts
var errors_exports = {};
__export(errors_exports, {
  errorHandler: () => errorHandler
});
module.exports = __toCommonJS(errors_exports);
var import_axios = require("axios");
var import_zod = require("zod");

// src/http/_errors/bad-request-error.ts
var BadRequestError = class extends Error {
};

// src/http/_errors/unauthorized-error.ts
var UnauthorizedError = class extends Error {
  constructor(message) {
    super(message ?? " Acesso n\xE3o autorizado, tente novamente.");
  }
};

// src/http/_errors/index.ts
var errorHandler = (error, request, reply) => {
  if (error.validation) {
    return reply.status(400).send({
      message: " Houve um erro na valida\xE7\xE3o, verifique os dados enviados."
    });
  }
  if (error instanceof import_zod.ZodError) {
    return reply.status(400).send({
      message: "Houve um erro na valida\xE7\xE3o, verifique os dados enviados.",
      errors: error.flatten().fieldErrors
    });
  }
  if (error instanceof BadRequestError) {
    return reply.status(400).send({
      message: error.message
    });
  }
  if (error instanceof UnauthorizedError) {
    return reply.status(401).send({
      message: error.message
    });
  }
  if (error.statusCode === 429) {
    return reply.status(429).send({
      message: "Limite de requisi\xE7\xF5es excedido. Tente novamente mais tarde."
    });
  }
  if (error instanceof import_axios.AxiosError) {
    return reply.status(404).send({
      message: "Consulta indispon\xEDvel ou advogado(a) n\xE3o encontrado. Verifique os dados e tente novamente mais tarde."
    });
  }
  console.error(error);
  return reply.status(500).send({
    message: "Erro interno do servidor. Tente novamente mais tarde."
  });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  errorHandler
});
//# sourceMappingURL=index.js.map