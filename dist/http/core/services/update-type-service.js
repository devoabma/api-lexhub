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

// src/http/core/services/update-type-service.ts
var update_type_service_exports = {};
__export(update_type_service_exports, {
  updateTypeService: () => updateTypeService
});
module.exports = __toCommonJS(update_type_service_exports);

// src/http/_errors/bad-request-error.ts
var BadRequestError = class extends Error {
};

// src/http/_errors/unauthorized-error.ts
var UnauthorizedError = class extends Error {
  constructor(message) {
    super(message ?? " Acesso n\xE3o autorizado, tente novamente.");
  }
};

// src/http/middlewares/auth.ts
var import_fastify_plugin = require("fastify-plugin");

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

// src/http/core/services/update-type-service.ts
var import_zod2 = __toESM(require("zod"));
async function updateTypeService(app) {
  app.withTypeProvider().register(auth).put(
    "/services/types/update/:id",
    {
      schema: {
        tags: ["servicesTypes"],
        summary: "Atualiza\xE7\xE3o de um tipo de servi\xE7o",
        security: [{ bearerAuth: [] }],
        params: import_zod2.default.object({
          id: import_zod2.default.string().cuid()
        }),
        body: import_zod2.default.object({
          name: import_zod2.default.string().min(6)
        }),
        response: {
          204: import_zod2.default.null()
        }
      }
    },
    async (request, reply) => {
      await request.checkIfAgentIsAdmin();
      const { id } = request.params;
      const { name } = request.body;
      const serviceType = await prisma.serviceTypes.findUnique({
        where: { id }
      });
      if (!serviceType) {
        throw new UnauthorizedError(
          "Servi\xE7o n\xE3o encontrado. Verifique as informa\xE7\xF5es e tente novamente."
        );
      }
      if (name === serviceType.name) {
        throw new BadRequestError(
          "O nome inserido j\xE1 est\xE1 registrado para este servi\xE7o. Revise e insira uma nova op\xE7\xE3o."
        );
      }
      if (serviceType && name !== serviceType.name) {
        const serviceTypeExists = await prisma.serviceTypes.findUnique({
          where: { name }
        });
        if (serviceTypeExists) {
          throw new UnauthorizedError(
            "O tipo de servi\xE7o informado j\xE1 existe. Insira um nome \xFAnico para prosseguir."
          );
        }
      }
      try {
        await prisma.serviceTypes.update({
          where: {
            id
          },
          data: {
            name,
            updateAt: /* @__PURE__ */ new Date()
          }
        });
        return reply.status(204).send();
      } catch (err) {
        throw new UnauthorizedError(
          "Erro na atualiza\xE7\xE3o. Verifique os dados e tente novamente."
        );
      }
    }
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  updateTypeService
});
//# sourceMappingURL=update-type-service.js.map