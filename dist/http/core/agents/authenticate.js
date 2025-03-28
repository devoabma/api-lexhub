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

// src/http/core/agents/authenticate.ts
var authenticate_exports = {};
__export(authenticate_exports, {
  authenticate: () => authenticate
});
module.exports = __toCommonJS(authenticate_exports);
var import_bcryptjs = require("bcryptjs");

// src/http/_errors/bad-request-error.ts
var BadRequestError = class extends Error {
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

// src/http/core/agents/authenticate.ts
var import_zod2 = require("zod");
async function authenticate(app) {
  app.withTypeProvider().post(
    "/agents/sessions",
    {
      schema: {
        tags: ["agents"],
        summary: "Autentica\xE7\xE3o de um funcion\xE1rio",
        body: import_zod2.z.object({
          email: import_zod2.z.string().email(),
          password: import_zod2.z.string().min(8)
        }),
        response: {
          201: import_zod2.z.object({
            token: import_zod2.z.string()
          })
        }
      }
    },
    async (request, reply) => {
      const { email, password } = request.body;
      const userFromEmail = await prisma.agent.findUnique({
        where: {
          email
        }
      });
      if (userFromEmail && userFromEmail.inactive !== null) {
        throw new BadRequestError(
          "O funcion\xE1rio est\xE1 inativo. Procure com o administrador do sistema."
        );
      }
      if (!userFromEmail) {
        throw new BadRequestError(
          "Credenciais inv\xE1lidas. Verifique suas informa\xE7\xF5es e tente novamente."
        );
      }
      const isPasswordValid = await (0, import_bcryptjs.compare)(
        password,
        userFromEmail.passwordHash
      );
      if (!isPasswordValid) {
        throw new BadRequestError(
          "Credenciais inv\xE1lidas. Verifique suas informa\xE7\xF5es e tente novamente."
        );
      }
      const token = await reply.jwtSign(
        {
          // Envia o id do usuário para o token
          sub: userFromEmail.id,
          role: userFromEmail.role
        },
        {
          sign: {
            expiresIn: "1d"
          }
        }
      );
      return reply.setCookie("@lexhub-auth", token, {
        path: "/",
        httpOnly: true,
        sameSite: true,
        maxAge: 60 * 60 * 24
      }).status(201).send({
        token
      });
    }
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  authenticate
});
//# sourceMappingURL=authenticate.js.map