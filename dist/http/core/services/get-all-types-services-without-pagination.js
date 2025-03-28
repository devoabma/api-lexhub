"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/http/core/services/get-all-types-services-without-pagination.ts
var get_all_types_services_without_pagination_exports = {};
__export(get_all_types_services_without_pagination_exports, {
  getAllTypesServicesWithoutPagination: () => getAllTypesServicesWithoutPagination
});
module.exports = __toCommonJS(get_all_types_services_without_pagination_exports);

// src/http/_errors/bad-request-error.ts
var BadRequestError = class extends Error {
};

// src/http/middlewares/auth.ts
var import_fastify_plugin = require("fastify-plugin");

// src/http/_errors/unauthorized-error.ts
var UnauthorizedError = class extends Error {
  constructor(message) {
    super(message ?? " Acesso n\xE3o autorizado, tente novamente.");
  }
};

// src/lib/prisma.ts
var import_client = require("@prisma/client");

// src/http/_env/index.ts
var import_config = require("dotenv/config");
var import_zod = require("zod");
var envSchema = import_zod.z.object({
  NODE_ENV: import_zod.z.enum(["development", "production"]).default("development"),
  PORT: import_zod.z.coerce.number().default(3892),
  DATABASE_URL: import_zod.z.string().url(),
  PASSWORD_ADMIN_FULL: import_zod.z.string().min(8),
  EMAIL_ADMIN_FULL: import_zod.z.string().email(),
  JWT_SECRET: import_zod.z.string().min(8),
  RESEND_API_KEY: import_zod.z.string(),
  WEB_URL: import_zod.z.string().url(),
  API_PROTHEUS_DATA_URL: import_zod.z.string().url(),
  API_PROTHEUS_FIN_URL: import_zod.z.string().url()
});
var _env = envSchema.safeParse(process.env);
if (_env.success === false) {
  console.error(
    "> \u274C Vari\xE1veis de ambiente inv\xE1lidas, verifique o arquivo .env",
    _env.error.format()
  );
  throw new Error("\u274C Houve um erro ao carregar as vari\xE1veis de ambiente.");
}
var env = _env.data;

// src/lib/prisma.ts
var prisma = new import_client.PrismaClient({
  // Gera logs de queries apenas em ambiente de desenvolvimento
  log: env.NODE_ENV === "DEVELOPMENT" ? ["query"] : []
});

// src/http/middlewares/auth.ts
var auth = (0, import_fastify_plugin.fastifyPlugin)(async (app) => {
  app.addHook("preHandler", async (request) => {
    request.getCurrentAgentId = async () => {
      try {
        const { sub } = await request.jwtVerify();
        return sub;
      } catch {
        throw new UnauthorizedError(
          "Token inv\xE1lido ou expirado. Fa\xE7a login novamente."
        );
      }
    };
    request.checkIfAgentIsAdmin = async () => {
      const { sub } = await request.jwtVerify().catch(() => {
        throw new UnauthorizedError(
          "Token inv\xE1lido ou expirado. Verifique as informa\xE7\xF5es e tente novamente."
        );
      });
      const agent = await prisma.agent.findUnique({
        where: { id: sub },
        select: { role: true }
      });
      if (!agent) {
        throw new UnauthorizedError(
          "Funcion\xE1rio n\xE3o encontrado. Verifique os dados e tente novamente."
        );
      }
      if (agent.role === "MEMBER") {
        throw new UnauthorizedError(
          "Permiss\xE3o negada. Voc\xEA precisa ser um administrador para realizar esta a\xE7\xE3o."
        );
      }
    };
  });
});

// src/http/core/services/get-all-types-services-without-pagination.ts
var import_zod2 = __toESM(require("zod"));
async function getAllTypesServicesWithoutPagination(app) {
  app.withTypeProvider().register(auth).get(
    "/services/types/all-wp",
    {
      schema: {
        tags: ["servicesTypes"],
        summary: "Busca todos os tipos de servi\xE7os cadastrados sem pagina\xE7\xE3o",
        security: [{ bearerAuth: [] }],
        response: {
          200: import_zod2.default.object({
            servicesTypes: import_zod2.default.array(
              import_zod2.default.object({
                id: import_zod2.default.string().cuid(),
                name: import_zod2.default.string()
              })
            )
          })
        }
      }
    },
    async (request, reply) => {
      await request.getCurrentAgentId();
      const servicesTypes = await prisma.serviceTypes.findMany({
        select: {
          id: true,
          name: true
        },
        orderBy: [
          {
            createdAt: "desc"
            // Mostra os tipos de serviços mais recentes primeiro
          }
        ]
      });
      if (!servicesTypes) {
        throw new BadRequestError(
          "Nenhum tipo de servi\xE7o cadastrado. Cadastre um para continuar."
        );
      }
      return reply.status(200).send({ servicesTypes });
    }
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getAllTypesServicesWithoutPagination
});
//# sourceMappingURL=get-all-types-services-without-pagination.js.map