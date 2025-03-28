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

// src/http/core/agents/create-account.ts
var create_account_exports = {};
__export(create_account_exports, {
  createAccountService: () => createAccountService
});
module.exports = __toCommonJS(create_account_exports);
var import_bcryptjs = require("bcryptjs");

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

// src/lib/resend.ts
var import_resend = require("resend");
var resend = new import_resend.Resend(env.RESEND_API_KEY);

// src/utils/emails/agent-registration-email.tsx
var import_components = require("@react-email/components");
var React = __toESM(require("react"));
var AgentRegistrationEmail = ({
  name,
  email,
  tempPassword,
  link
}) => {
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  const sendDate = (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR");
  return /* @__PURE__ */ React.createElement(import_components.Html, null, /* @__PURE__ */ React.createElement(import_components.Head, null), /* @__PURE__ */ React.createElement(import_components.Preview, null, "Bem-vindo(a) \xE0 OAB Atende! Confira os detalhes do seu cadastro."), /* @__PURE__ */ React.createElement(import_components.Tailwind, null, /* @__PURE__ */ React.createElement(import_components.Body, { className: "bg-gray-100 font-sans" }, /* @__PURE__ */ React.createElement(import_components.Container, { className: "bg-white border border-gray-200 rounded-lg p-8 mx-auto my-8 max-w-xl" }, /* @__PURE__ */ React.createElement(import_components.Heading, { className: "text-2xl font-bold text-center text-blue-700 mb-6" }, "Bem-vindo(a) \xE0 OAB Atende!"), /* @__PURE__ */ React.createElement(import_components.Text, { className: "text-gray-700 mb-6" }, "Ol\xE1, ", /* @__PURE__ */ React.createElement("b", null, name)), /* @__PURE__ */ React.createElement(import_components.Text, { className: "text-gray-700 mb-6" }, "Estamos muito felizes em t\xEA-lo(a) conosco! Abaixo est\xE3o os detalhes do seu cadastro:"), /* @__PURE__ */ React.createElement(import_components.Section, { className: "bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6" }, /* @__PURE__ */ React.createElement(import_components.Text, { className: "text-gray-700 mb-2" }, /* @__PURE__ */ React.createElement("b", null, "Nome:"), " ", name), /* @__PURE__ */ React.createElement(import_components.Text, { className: "text-gray-700 mb-2" }, /* @__PURE__ */ React.createElement("b", null, "E-mail:"), " ", email), /* @__PURE__ */ React.createElement(import_components.Text, { className: "text-gray-700" }, /* @__PURE__ */ React.createElement("b", null, "Senha provis\xF3ria:"), " ", tempPassword)), /* @__PURE__ */ React.createElement(import_components.Text, { className: "text-gray-700 mb-6" }, "Voc\xEA est\xE1 recebendo uma senha tempor\xE1ria para acessar o sistema da OAB Atende. Por quest\xF5es de seguran\xE7a, \xE9 obrigat\xF3rio que voc\xEA realize a redefini\xE7\xE3o de senha."), /* @__PURE__ */ React.createElement(
    import_components.Button,
    {
      href: link,
      className: "bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-center block"
    },
    "Acessar o Sistema"
  ), /* @__PURE__ */ React.createElement(import_components.Hr, { className: "border-gray-200 my-6" }), /* @__PURE__ */ React.createElement(import_components.Text, { className: "text-sm text-gray-500 text-center" }, "Este \xE9 um e-mail autom\xE1tico. Por favor, n\xE3o responda a esta mensagem."), /* @__PURE__ */ React.createElement(import_components.Hr, { className: "border-gray-200 my-6" }), /* @__PURE__ */ React.createElement(import_components.Text, { className: "text-xs text-gray-400 text-center" }, "\xA9 ", currentYear, " OAB Atende. Todos os direitos reservados."), /* @__PURE__ */ React.createElement(import_components.Text, { className: "text-xs text-gray-400 text-center" }, "Este e-mail foi enviado em ", sendDate, ".")))));
};

// src/http/core/agents/create-account.ts
var import_zod2 = require("zod");
async function createAccountService(app) {
  app.withTypeProvider().register(auth).post(
    "/agents",
    {
      schema: {
        tags: ["agents"],
        summary: "Cria\xE7\xE3o de um novo funcion\xE1rio",
        security: [{ bearerAuth: [] }],
        body: import_zod2.z.object({
          name: import_zod2.z.string(),
          email: import_zod2.z.string().email(),
          password: import_zod2.z.string().min(8)
        }),
        response: {
          201: import_zod2.z.null()
        }
      }
    },
    async (request, reply) => {
      await request.checkIfAgentIsAdmin();
      const { name, email, password } = request.body;
      const userWithSameEmail = await prisma.agent.findUnique({
        where: {
          email
        }
      });
      if (userWithSameEmail) {
        throw new BadRequestError(
          "E-mail j\xE1 cadastrado para outro funcion\xE1rio."
        );
      }
      const passwordHash = await (0, import_bcryptjs.hash)(password, 8);
      await resend.emails.send({
        from: "\u{1F4E7} OAB Atende <oabatende@oabma.com.br>",
        to: email,
        subject: "\u{1F389} Bem-vindo \xE0 equipe! Aqui est\xE3o suas informa\xE7\xF5es.",
        react: AgentRegistrationEmail({
          name,
          email,
          tempPassword: password,
          link: env.WEB_URL
        })
      });
      try {
        await prisma.agent.create({
          data: {
            name,
            email,
            passwordHash
          }
        });
        return reply.status(201).send();
      } catch (err) {
        throw new BadRequestError(
          "Erro ao criar funcion\xE1rio. Por favor, tente novamente."
        );
      }
    }
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createAccountService
});
//# sourceMappingURL=create-account.js.map