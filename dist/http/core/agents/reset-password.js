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

// src/http/core/agents/reset-password.ts
var reset_password_exports = {};
__export(reset_password_exports, {
  resetPassword: () => resetPassword
});
module.exports = __toCommonJS(reset_password_exports);
var import_bcryptjs = require("bcryptjs");

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

// src/http/core/agents/reset-password.ts
var import_zod2 = require("zod");
async function resetPassword(app) {
  app.withTypeProvider().post(
    "/agents/password/reset",
    {
      schema: {
        tags: ["agents"],
        summary: "Reset de senha de um funcion\xE1rio",
        body: import_zod2.z.object({
          code: import_zod2.z.string(),
          password: import_zod2.z.string().min(8)
        }),
        response: {
          204: import_zod2.z.null()
        }
      }
    },
    async (request, reply) => {
      const { code, password } = request.body;
      const tokenFromCode = await prisma.token.findUnique({
        where: {
          code
        }
      });
      if (!tokenFromCode || tokenFromCode.code !== code) {
        throw new UnauthorizedError(
          "C\xF3digo de redefini\xE7\xE3o de senha inv\xE1lido. Verifique e tente novamente."
        );
      }
      const agent = await prisma.agent.findUnique({
        where: {
          id: tokenFromCode.agentId
        }
      });
      if (!agent) {
        throw new UnauthorizedError(
          "Nenhum funcion\xE1rio encontrado. Verifique as informa\xE7\xF5es e tente novamente."
        );
      }
      const isSamePassword = await (0, import_bcryptjs.compare)(password, agent.passwordHash);
      if (isSamePassword) {
        throw new UnauthorizedError(
          "A nova senha deve ser diferente da atual. Escolha outra senha e tente novamente."
        );
      }
      const passwordHash = await (0, import_bcryptjs.hash)(password, 8);
      await prisma.agent.update({
        where: {
          id: tokenFromCode.agentId
        },
        data: {
          passwordHash
        }
      });
      return reply.status(204).send();
    }
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  resetPassword
});
//# sourceMappingURL=reset-password.js.map