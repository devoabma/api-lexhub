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

// src/http/routes/index.ts
var routes_exports = {};
__export(routes_exports, {
  routes: () => routes
});
module.exports = __toCommonJS(routes_exports);

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

// src/http/core/agents/active-agent.ts
var import_zod2 = __toESM(require("zod"));
async function activeAgent(app) {
  app.withTypeProvider().register(auth).patch(
    "/agents/active/:id",
    {
      schema: {
        tags: ["agents"],
        summary: "Ativa\xE7\xE3o de um funcion\xE1rio",
        security: [{ bearerAuth: [] }],
        params: import_zod2.default.object({
          id: import_zod2.default.string().uuid()
        }),
        response: {
          204: import_zod2.default.null()
        }
      }
    },
    async (request, reply) => {
      await request.checkIfAgentIsAdmin();
      const { id } = request.params;
      const agent = await prisma.agent.findUnique({
        where: { id }
      });
      if (!agent) {
        throw new UnauthorizedError(
          "O funcion\xE1rio n\xE3o foi encontrado. Verifique os dados informados e tente novamente."
        );
      }
      try {
        await prisma.agent.update({
          where: {
            id
          },
          data: {
            inactive: null,
            updatedAt: /* @__PURE__ */ new Date()
          }
        });
        return reply.status(204).send();
      } catch (err) {
        throw new UnauthorizedError(
          "N\xE3o foi poss\xEDvel inativar o funcion\xE1rio. Tente novamente mais tarde."
        );
      }
    }
  );
}

// src/http/core/agents/authenticate.ts
var import_bcryptjs = require("bcryptjs");

// src/http/_errors/bad-request-error.ts
var BadRequestError = class extends Error {
};

// src/http/core/agents/authenticate.ts
var import_zod3 = require("zod");
async function authenticate(app) {
  app.withTypeProvider().post(
    "/agents/sessions",
    {
      schema: {
        tags: ["agents"],
        summary: "Autentica\xE7\xE3o de um funcion\xE1rio",
        body: import_zod3.z.object({
          email: import_zod3.z.string().email(),
          password: import_zod3.z.string().min(8)
        }),
        response: {
          201: import_zod3.z.object({
            token: import_zod3.z.string()
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

// src/http/core/agents/get-all.ts
var import_zod4 = __toESM(require("zod"));
async function getAll(app) {
  app.withTypeProvider().register(auth).get(
    "/agents/all",
    {
      schema: {
        tags: ["agents"],
        summary: "Busca todos os funcion\xE1rios cadastrados",
        security: [{ bearerAuth: [] }],
        querystring: import_zod4.default.object({
          pageIndex: import_zod4.default.coerce.number().default(1),
          name: import_zod4.default.string().optional(),
          role: import_zod4.default.enum(["ADMIN", "MEMBER"]).optional()
        }),
        response: {
          200: import_zod4.default.object({
            agents: import_zod4.default.array(
              import_zod4.default.object({
                id: import_zod4.default.string().uuid(),
                name: import_zod4.default.string(),
                email: import_zod4.default.string().email(),
                role: import_zod4.default.enum(["ADMIN", "MEMBER"]),
                inactive: import_zod4.default.date().nullable()
              })
            ),
            total: import_zod4.default.number()
          })
        }
      }
    },
    async (request, reply) => {
      await request.checkIfAgentIsAdmin();
      const { pageIndex, name, role } = request.query;
      try {
        const [agents, total] = await Promise.all([
          prisma.agent.findMany({
            where: {
              name: name ? { contains: name, mode: "insensitive" } : void 0,
              role: role ? role : void 0
            },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              inactive: true
            },
            orderBy: {
              createdAt: "desc"
            },
            skip: (pageIndex - 1) * 10,
            take: 10
          }),
          prisma.agent.count({
            where: {
              name: name ? { contains: name, mode: "insensitive" } : void 0,
              role: role ? role : void 0
            }
          })
        ]);
        if (!agents) {
          throw new BadRequestError(
            "Nenhum funcion\xE1rio cadastrado. Cadastre um para continuar."
          );
        }
        return reply.status(200).send({
          agents,
          total
        });
      } catch (err) {
        throw new BadRequestError(
          "N\xE3o foi poss\xEDvel recuperar os atendimentos. Tente novamente mais tarde."
        );
      }
    }
  );
}

// src/http/core/agents/get-profile.ts
var import_zod5 = __toESM(require("zod"));
async function getProfile(app) {
  app.withTypeProvider().register(auth).get(
    "/agents/profile",
    {
      schema: {
        tags: ["agents"],
        summary: "Busca o perfil de um funcion\xE1rio logado",
        security: [{ bearerAuth: [] }],
        response: {
          200: import_zod5.default.object({
            agent: import_zod5.default.object({
              id: import_zod5.default.string().uuid(),
              name: import_zod5.default.string(),
              email: import_zod5.default.string().email(),
              role: import_zod5.default.enum(["ADMIN", "MEMBER"])
            })
          })
        }
      }
    },
    async (request, reply) => {
      const agentId = await request.getCurrentAgentId();
      const agent = await prisma.agent.findUnique({
        where: {
          id: agentId
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });
      if (!agent) {
        throw new BadRequestError(
          "Funcion\xE1rio n\xE3o encontrado. Verifique os dados e tente novamente."
        );
      }
      return reply.status(200).send({ agent });
    }
  );
}

// src/http/core/agents/inactive-agent.ts
var import_zod6 = __toESM(require("zod"));
async function inactiveAgent(app) {
  app.withTypeProvider().register(auth).patch(
    "/agents/inactive/:id",
    {
      schema: {
        tags: ["agents"],
        summary: "Inactiva\xE7\xE3o de um funcion\xE1rio",
        security: [{ bearerAuth: [] }],
        params: import_zod6.default.object({
          id: import_zod6.default.string().uuid()
        }),
        response: {
          204: import_zod6.default.null()
        }
      }
    },
    async (request, reply) => {
      await request.checkIfAgentIsAdmin();
      const { id } = request.params;
      const agent = await prisma.agent.findUnique({
        where: { id }
      });
      if (!agent) {
        throw new UnauthorizedError(
          "O funcion\xE1rio n\xE3o foi encontrado. Verifique os dados informados e tente novamente."
        );
      }
      try {
        await prisma.agent.update({
          where: {
            id
          },
          data: {
            inactive: /* @__PURE__ */ new Date(),
            updatedAt: /* @__PURE__ */ new Date()
          }
        });
        return reply.status(204).send();
      } catch (err) {
        throw new UnauthorizedError(
          "N\xE3o foi poss\xEDvel inativar o funcion\xE1rio. Tente novamente mais tarde."
        );
      }
    }
  );
}

// src/http/core/agents/logout-agent.ts
var import_zod7 = __toESM(require("zod"));
async function logoutAgent(app) {
  app.withTypeProvider().register(auth).post(
    "/agents/logout",
    {
      schema: {
        tags: ["agents"],
        summary: "Desloga o funcion\xE1rio logado",
        security: [{ bearerAuth: [] }],
        response: {
          200: import_zod7.default.null()
        }
      }
    },
    async (request, reply) => {
      const agentId = await request.getCurrentAgentId();
      const agent = await prisma.agent.findUnique({
        where: {
          id: agentId
        }
      });
      if (!agent) {
        throw new BadRequestError(
          " O funcion\xE1rio solicitado n\xE3o foi localizado em nossa base de dados. Por favor, verifique os dados informados e tente novamente."
        );
      }
      return reply.clearCookie("@lexhub-auth", {
        path: "/"
      }).status(200).send();
    }
  );
}

// src/lib/resend.ts
var import_resend = require("resend");
var resend = new import_resend.Resend(env.RESEND_API_KEY);

// src/utils/emails/reset-password-email.tsx
var import_components = require("@react-email/components");
var React = __toESM(require("react"));
var ResetPasswordEmail = ({
  name,
  code,
  link
}) => {
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  const sendDate = (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR");
  return /* @__PURE__ */ React.createElement(import_components.Html, null, /* @__PURE__ */ React.createElement(import_components.Head, null), /* @__PURE__ */ React.createElement(import_components.Preview, null, "Recebemos uma solicita\xE7\xE3o para redefinir a senha da sua conta no OAB Atende."), /* @__PURE__ */ React.createElement(import_components.Tailwind, null, /* @__PURE__ */ React.createElement(import_components.Body, { className: "bg-gray-100 font-sans" }, /* @__PURE__ */ React.createElement(import_components.Container, { className: "bg-white border border-gray-200 rounded-lg p-8 mx-auto my-8 max-w-xl" }, /* @__PURE__ */ React.createElement(import_components.Heading, { className: "text-2xl font-bold text-center text-blue-700 mb-6" }, "Redefini\xE7\xE3o de Senha - OAB Atende"), /* @__PURE__ */ React.createElement(import_components.Text, { className: "text-gray-700 mb-6" }, "Ol\xE1, ", /* @__PURE__ */ React.createElement("b", null, name)), /* @__PURE__ */ React.createElement(import_components.Text, { className: "text-gray-700 mb-6" }, "Recebemos uma solicita\xE7\xE3o para redefinir a senha da sua conta no OAB Atende. Use o c\xF3digo abaixo para concluir o processo de redefini\xE7\xE3o:"), /* @__PURE__ */ React.createElement(import_components.Section, { className: "bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6" }, /* @__PURE__ */ React.createElement(import_components.Text, { className: "text-2xl font-bold text-center text-blue-700" }, code)), /* @__PURE__ */ React.createElement(import_components.Text, { className: "text-gray-700 mb-6" }, "Agora, clique no bot\xE3o abaixo para ser redirecionado \xE0 p\xE1gina de redefini\xE7\xE3o de senha:"), /* @__PURE__ */ React.createElement(
    import_components.Button,
    {
      href: link,
      className: "bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-center block"
    },
    "Redefinir Senha"
  ), /* @__PURE__ */ React.createElement(import_components.Hr, { className: "border-gray-200 my-6" }), /* @__PURE__ */ React.createElement(import_components.Text, { className: "text-sm text-gray-500 text-center" }, "Se voc\xEA n\xE3o solicitou a redefini\xE7\xE3o de senha, por favor ignore este e-mail ou entre em contato com nosso suporte."), /* @__PURE__ */ React.createElement(import_components.Hr, { className: "border-gray-200 my-6" }), /* @__PURE__ */ React.createElement(import_components.Text, { className: "text-xs text-gray-400 text-center" }, "\xA9 ", currentYear, " OAB Atende. Todos os direitos reservados."), /* @__PURE__ */ React.createElement(import_components.Text, { className: "text-xs text-gray-400 text-center" }, "Este e-mail foi enviado em ", sendDate, ".")))));
};

// src/utils/generate-recovery-code.ts
function generateRecoveryCode(length = 6) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }
  return code;
}

// src/http/core/agents/request-password-recover.ts
var import_zod8 = require("zod");
async function requestPasswordRecover(app) {
  app.withTypeProvider().post(
    "/agents/password/recover",
    {
      schema: {
        tags: ["agents"],
        summary: "Requisi\xE7\xE3o de redefini\xE7\xE3o de senha",
        security: [{ bearerAuth: [] }],
        body: import_zod8.z.object({
          email: import_zod8.z.string().email()
        }),
        response: {
          200: import_zod8.z.null()
        }
      }
    },
    async (request, reply) => {
      const { email } = request.body;
      const agentFromEmail = await prisma.agent.findUnique({
        where: {
          email
        }
      });
      if (!agentFromEmail) {
        return reply.status(200).send();
      }
      const { code } = await prisma.token.create({
        data: {
          type: "PASSWORD_RECOVER",
          agentId: agentFromEmail.id,
          code: generateRecoveryCode()
        }
      });
      await resend.emails.send({
        from: "\u{1F4E7} OAB Atende <oabatende@oabma.com.br>",
        // FIXME: Em ambiente de desenvolvimento envia para o email do desenvolvedor
        to: env.NODE_ENV === "PRODUCTION" ? email : "hilquiasfmelo@hotmail.com",
        subject: "\u{1F504} Redefini\xE7\xE3o de Senha - OAB Atende",
        react: ResetPasswordEmail({
          name: agentFromEmail.name,
          code,
          link: `${env.WEB_URL}/reset-password?code=${code}`
        })
      });
      setTimeout(async () => {
        await prisma.token.delete({
          where: { code }
        });
      }, 12e4);
      if (env.NODE_ENV === "DEVELOPMENT") {
        console.log(
          "> \u2705 Email de redefini\xE7\xE3o de senha enviado com sucesso.",
          code
        );
      }
      return reply.status(200).send();
    }
  );
}

// src/http/core/agents/reset-password.ts
var import_bcryptjs2 = require("bcryptjs");
var import_zod9 = require("zod");
async function resetPassword(app) {
  app.withTypeProvider().post(
    "/agents/password/reset",
    {
      schema: {
        tags: ["agents"],
        summary: "Reset de senha de um funcion\xE1rio",
        body: import_zod9.z.object({
          code: import_zod9.z.string(),
          password: import_zod9.z.string().min(8)
        }),
        response: {
          204: import_zod9.z.null()
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
      const isSamePassword = await (0, import_bcryptjs2.compare)(password, agent.passwordHash);
      if (isSamePassword) {
        throw new UnauthorizedError(
          "A nova senha deve ser diferente da atual. Escolha outra senha e tente novamente."
        );
      }
      const passwordHash = await (0, import_bcryptjs2.hash)(password, 8);
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

// src/http/core/agents/update-agent.ts
var import_zod10 = __toESM(require("zod"));
async function updateAgent(app) {
  app.withTypeProvider().register(auth).put(
    "/agents/update/:id",
    {
      schema: {
        tags: ["agents"],
        summary: "Atualiza\xE7\xE3o de um funcion\xE1rio",
        security: [{ bearerAuth: [] }],
        params: import_zod10.default.object({
          id: import_zod10.default.string().uuid()
        }),
        body: import_zod10.default.object({
          name: import_zod10.default.string().optional(),
          email: import_zod10.default.string().email().optional(),
          role: import_zod10.default.enum(["ADMIN", "MEMBER"]).optional()
        }),
        response: {
          204: import_zod10.default.null()
        }
      }
    },
    async (request, reply) => {
      await request.checkIfAgentIsAdmin();
      const { id } = request.params;
      const { name, email, role } = request.body;
      const agent = await prisma.agent.findUnique({
        where: { id }
      });
      if (!agent) {
        throw new UnauthorizedError(
          "Funcion\xE1rio n\xE3o encontrado. Verifique os dados e tente novamente."
        );
      }
      if (email && email !== agent.email) {
        const emailExists = await prisma.agent.findUnique({
          where: { email }
        });
        if (emailExists) {
          throw new UnauthorizedError(
            "E-mail j\xE1 cadastrado. Verifique as informa\xE7\xF5es e tente novamente."
          );
        }
      }
      try {
        await prisma.agent.update({
          where: {
            id
          },
          data: {
            name,
            email,
            role,
            updatedAt: /* @__PURE__ */ new Date()
          }
        });
        return reply.status(204).send();
      } catch (err) {
        throw new UnauthorizedError(
          "Falha na atualiza\xE7\xE3o. Verifique os dados e tente novamente."
        );
      }
    }
  );
}

// src/http/core/services/cancel-service.ts
var import_zod11 = __toESM(require("zod"));
async function cancelService(app) {
  app.withTypeProvider().register(auth).delete(
    "/services/cancel/:id",
    {
      schema: {
        tags: ["services"],
        summary: "Cancelar um atendimento enquanto em aberto",
        security: [{ bearerAuth: [] }],
        params: import_zod11.default.object({
          id: import_zod11.default.string().uuid()
        }),
        response: {
          204: import_zod11.default.null()
        }
      }
    },
    async (request, reply) => {
      await request.getCurrentAgentId();
      const { id } = request.params;
      const service = await prisma.services.findUnique({
        where: { id }
      });
      if (!service) {
        throw new UnauthorizedError(
          "O servi\xE7o solicitado n\xE3o foi localizado em nossa base de dados. Por favor, verifique as informa\xE7\xF5es e tente novamente."
        );
      }
      if (service.status !== "OPEN") {
        throw new UnauthorizedError(
          "O servi\xE7o solicitado j\xE1 foi finalizado. Por favor, verifique as informa\xE7\xF5es e tente novamente."
        );
      }
      try {
        await prisma.services.delete({
          where: { id }
        });
        return reply.status(204).send();
      } catch (err) {
        throw new UnauthorizedError(
          "Ocorreu um erro para cancelar o atendimento. Por favor, verifique os dados informados e tente novamente."
        );
      }
    }
  );
}

// src/lib/axios.ts
var import_axios = __toESM(require("axios"));
var API_PROTHEUS_FIN_URL = import_axios.default.create({
  baseURL: env.API_PROTHEUS_FIN_URL
});
var API_PROTHEUS_DATA_URL = import_axios.default.create({
  baseURL: env.API_PROTHEUS_DATA_URL
});

// src/http/core/services/consult-lawyer.ts
var import_zod12 = require("zod");
async function consultLawyer(app) {
  app.withTypeProvider().register(auth).post(
    "/services/consult/lawyer",
    {
      schema: {
        tags: ["services"],
        summary: "Consulta inadimpl\xEAncia do advogado",
        security: [{ bearerAuth: [] }],
        body: import_zod12.z.object({
          oab: import_zod12.z.string()
        }),
        response: {
          200: import_zod12.z.object({
            name: import_zod12.z.string()
          })
        }
      }
    },
    async (request, reply) => {
      await request.getCurrentAgentId();
      const { oab } = request.body;
      const { data } = await API_PROTHEUS_FIN_URL(`/${oab}`);
      const {
        data: { lawyer }
      } = await API_PROTHEUS_DATA_URL("/", {
        params: {
          idOrg: 10,
          param: oab
        }
      });
      if (!data) {
        const name = lawyer?.nome;
        throw new UnauthorizedError(
          `Prezado(a) ${name}, n\xE3o podemos prosseguir com o atendimento. Para mais informa\xE7\xF5es, entre em contato com o Setor Financeiro.`
        );
      }
      return reply.status(200).send({
        name: lawyer?.nome
      });
    }
  );
}

// src/http/core/services/create-service.ts
var import_zod13 = require("zod");
async function createService(app) {
  app.withTypeProvider().register(auth).post(
    "/services",
    {
      schema: {
        tags: ["services"],
        summary: "Cria\xE7\xE3o de um novo atendimento",
        security: [{ bearerAuth: [] }],
        body: import_zod13.z.object({
          oab: import_zod13.z.string(),
          serviceTypeId: import_zod13.z.array(import_zod13.z.string().cuid()),
          observation: import_zod13.z.string().optional(),
          assistance: import_zod13.z.enum(["PERSONALLY", "REMOTE"]),
          status: import_zod13.z.enum(["OPEN", "COMPLETED"]).default("OPEN")
        }),
        response: {
          201: import_zod13.z.null()
        }
      }
    },
    async (request, reply) => {
      const agentId = await request.getCurrentAgentId();
      const { oab, serviceTypeId, observation, assistance } = request.body;
      let lawyer = await prisma.lawyer.findUnique({
        where: {
          oab
        }
      });
      if (!lawyer) {
        const {
          data: { lawyer: lawyerData }
        } = await API_PROTHEUS_DATA_URL("/", {
          params: {
            idOrg: 10,
            param: oab
          }
        });
        lawyer = await prisma.lawyer.create({
          data: {
            name: lawyerData.nome,
            oab: lawyerData.registro,
            email: lawyerData.email
          }
        });
      }
      const serviceTypes = await Promise.all(
        serviceTypeId.map(async (serviceType) => {
          const type = await prisma.serviceTypes.findUnique({
            where: {
              id: serviceType
            }
          });
          if (!type) {
            throw new UnauthorizedError(
              "Tipo de servi\xE7o n\xE3o encontrado. Verifique as informa\xE7\xF5es e tente novamente."
            );
          }
          return type;
        })
      );
      const service = await prisma.services.create({
        data: {
          assistance,
          observation,
          agentId,
          lawyerId: lawyer.id
        }
      });
      await Promise.all(
        serviceTypes.map(async (serviceType) => {
          await prisma.serviceServiceTypes.create({
            data: {
              serviceId: service.id,
              serviceTypeId: serviceType.id
            }
          });
        })
      );
      return reply.status(201).send();
    }
  );
}

// src/http/core/services/create-service-external.ts
var import_zod14 = __toESM(require("zod"));
async function createServiceExternal(app) {
  app.withTypeProvider().register(auth).post(
    "/services/external",
    {
      schema: {
        tags: ["servicesExternal"],
        summary: "Cria\xE7\xE3o de um novo servi\xE7o externo",
        security: [{ bearerAuth: [] }],
        body: import_zod14.default.object({
          oab: import_zod14.default.string(),
          name: import_zod14.default.string(),
          email: import_zod14.default.string().email(),
          serviceTypeId: import_zod14.default.array(import_zod14.default.string().cuid()),
          observation: import_zod14.default.string().optional(),
          assistance: import_zod14.default.enum(["PERSONALLY", "REMOTE"]),
          status: import_zod14.default.enum(["OPEN", "COMPLETED"]).default("OPEN")
        }),
        response: {
          201: import_zod14.default.null()
        }
      }
    },
    async (request, reply) => {
      const agentId = await request.getCurrentAgentId();
      const { oab, name, email, serviceTypeId, observation, assistance } = request.body;
      let lawyer = await prisma.lawyer.findUnique({
        where: {
          oab
        }
      });
      if (!lawyer) {
        lawyer = await prisma.lawyer.create({
          data: {
            oab,
            name,
            email
          }
        });
      }
      const serviceTypes = await Promise.all(
        serviceTypeId.map(async (serviceType) => {
          const type = await prisma.serviceTypes.findUnique({
            where: {
              id: serviceType
            }
          });
          if (!type) {
            throw new UnauthorizedError(
              "Tipo de servi\xE7o n\xE3o encontrado. Verifique os dados e tente novamente."
            );
          }
          return type;
        })
      );
      const service = await prisma.services.create({
        data: {
          assistance,
          observation,
          agentId,
          lawyerId: lawyer.id
        }
      });
      await Promise.all(
        serviceTypes.map(async (serviceType) => {
          await prisma.serviceServiceTypes.create({
            data: {
              serviceId: service.id,
              serviceTypeId: serviceType.id
            }
          });
        })
      );
      return reply.status(201).send();
    }
  );
}

// src/http/core/services/create-type-service.ts
var import_zod15 = require("zod");
async function createTypeService(app) {
  app.withTypeProvider().register(auth).post(
    "/services/types",
    {
      schema: {
        tags: ["servicesTypes"],
        summary: "Cria\xE7\xE3o de um novo tipo de servi\xE7o",
        security: [{ bearerAuth: [] }],
        body: import_zod15.z.object({
          name: import_zod15.z.string()
        }),
        response: {
          201: import_zod15.z.null()
        }
      }
    },
    async (request, reply) => {
      await request.checkIfAgentIsAdmin();
      const { name } = request.body;
      const serviceType = await prisma.serviceTypes.findUnique({
        where: {
          name
        }
      });
      if (serviceType) {
        throw new BadRequestError(
          "Tipo de servi\xE7o j\xE1 cadastrado. Insira um nome \xFAnico."
        );
      }
      await prisma.serviceTypes.create({
        data: {
          name
        }
      });
      return reply.status(201).send();
    }
  );
}

// src/http/core/services/finished-service.ts
var import_zod16 = __toESM(require("zod"));
async function finishedService(app) {
  app.withTypeProvider().register(auth).patch(
    "/services/finished/:id",
    {
      schema: {
        tags: ["services"],
        summary: "Finalizar um atendimento",
        security: [{ bearerAuth: [] }],
        params: import_zod16.default.object({
          id: import_zod16.default.string().uuid()
        }),
        response: {
          204: import_zod16.default.null()
        }
      }
    },
    async (request, reply) => {
      await request.getCurrentAgentId();
      const { id } = request.params;
      const service = await prisma.services.findUnique({
        where: { id }
      });
      if (!service) {
        throw new UnauthorizedError(
          "O atendimento n\xE3o foi encontrado. Verifique os dados e tente novamente."
        );
      }
      if (service.status === "COMPLETED") {
        throw new UnauthorizedError(
          "O atendimento j\xE1 foi finalizado. Verifique os dados e tente novamente."
        );
      }
      try {
        await prisma.services.update({
          where: {
            id
          },
          data: {
            finishedAt: /* @__PURE__ */ new Date(),
            status: "COMPLETED"
          }
        });
        return reply.status(204).send();
      } catch (err) {
        throw new UnauthorizedError(
          " Ocorreu um erro ao finalizar o atendimento. Por favor, tente novamente mais tarde."
        );
      }
    }
  );
}

// src/http/core/services/get-all-quantity-services.ts
var import_zod17 = __toESM(require("zod"));
async function getAllQuantityServices(app) {
  app.withTypeProvider().register(auth).get(
    "/services/general",
    {
      schema: {
        tags: ["services"],
        summary: "Busca todos os atendimentos cadastrados geral",
        security: [{ bearerAuth: [] }],
        response: {
          200: import_zod17.default.object({
            total: import_zod17.default.number()
          })
        }
      }
    },
    async (request, reply) => {
      await request.getCurrentAgentId();
      const services = await prisma.services.count();
      return reply.status(200).send({ total: services });
    }
  );
}

// src/http/core/services/get-all-quantity-services-by-agent.ts
var import_dayjs = __toESM(require("dayjs"));
var import_zod18 = require("zod");
async function getAllQuantityServicesByAgent(app) {
  app.withTypeProvider().register(auth).get(
    "/services/general/agent/:id",
    {
      schema: {
        tags: ["services"],
        summary: "Busca todos os atendimentos cadastrados de um funcion\xE1rio",
        security: [{ bearerAuth: [] }],
        params: import_zod18.z.object({
          id: import_zod18.z.string().uuid()
        }),
        response: {
          200: import_zod18.z.object({
            totalGeneral: import_zod18.z.number(),
            totalOnMonth: import_zod18.z.number(),
            totalOnPreviousMonth: import_zod18.z.number()
          })
        }
      }
    },
    async (request, reply) => {
      await request.getCurrentAgentId();
      const { id } = request.params;
      const servicesByAgent = await prisma.services.count({
        where: {
          agentId: id
        }
      });
      const now = (0, import_dayjs.default)();
      const startOfMonth = now.startOf("month").toDate();
      const endOfMonth = now.endOf("month").toDate();
      const servicesInMonth = await prisma.services.count({
        where: {
          agentId: id,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });
      const startOfPreviousMonth = now.subtract(1, "month").startOf("month").toDate();
      const endOfPreviousMonth = now.subtract(1, "month").endOf("month").toDate();
      const servicesInPreviousMonth = await prisma.services.count({
        where: {
          agentId: id,
          createdAt: {
            gte: startOfPreviousMonth,
            lte: endOfPreviousMonth
          }
        }
      });
      return reply.status(200).send({
        totalGeneral: servicesByAgent,
        totalOnMonth: servicesInMonth,
        totalOnPreviousMonth: servicesInPreviousMonth
      });
    }
  );
}

// src/http/core/services/get-all-quantity-services-in-month.ts
var import_dayjs2 = __toESM(require("dayjs"));
var import_zod19 = __toESM(require("zod"));
async function getAllQuantityServicesInMonth(app) {
  app.withTypeProvider().register(auth).get(
    "/services/general/month",
    {
      schema: {
        tags: ["services"],
        summary: "Busca todos os atendimentos cadastrados no m\xEAs atual",
        security: [{ bearerAuth: [] }],
        response: {
          200: import_zod19.default.object({
            totalCurrentMonth: import_zod19.default.number(),
            totalPreviousMonth: import_zod19.default.number()
          })
        }
      }
    },
    async (request, reply) => {
      await request.getCurrentAgentId();
      const now = (0, import_dayjs2.default)();
      const startOfMonth = now.startOf("month").toDate();
      const endOfMonth = now.endOf("month").toDate();
      const servicesInMonth = await prisma.services.count({
        where: {
          createdAt: {
            gte: startOfMonth,
            // maior ou igual ao primeiro dia do mês
            lte: endOfMonth
            // menor ou igual ao último dia do mês
          }
        }
      });
      const startOfPreviousMonth = now.subtract(1, "month").startOf("month").toDate();
      const endOfPreviousMonth = now.subtract(1, "month").endOf("month").toDate();
      const previousMonthServices = await prisma.services.count({
        where: {
          createdAt: {
            gte: startOfPreviousMonth,
            lte: endOfPreviousMonth
          }
        }
      });
      return reply.status(200).send({
        totalCurrentMonth: servicesInMonth,
        totalPreviousMonth: previousMonthServices
      });
    }
  );
}

// src/http/core/services/get-all-quantity-services-in-year.ts
var import_dayjs3 = __toESM(require("dayjs"));
var import_zod20 = __toESM(require("zod"));
async function getAllQuantityServicesInYear(app) {
  app.withTypeProvider().register(auth).get(
    "/services/general/year",
    {
      schema: {
        tags: ["services"],
        summary: "Busca todos os atendimentos cadastrados no ano atual",
        security: [{ bearerAuth: [] }],
        response: {
          200: import_zod20.default.object({
            totalCurrentYear: import_zod20.default.number(),
            totalPreviousYear: import_zod20.default.number()
          })
        }
      }
    },
    async (request, reply) => {
      await request.getCurrentAgentId();
      const now = (0, import_dayjs3.default)();
      const startOfYear = now.startOf("year").toDate();
      const endOfYear = now.endOf("year").toDate();
      const servicesInYear = await prisma.services.count({
        where: {
          createdAt: {
            gte: startOfYear,
            lte: endOfYear
          }
        }
      });
      const startOfPreviousYear = now.subtract(1, "year").startOf("year").toDate();
      const endOfPreviousYear = now.subtract(1, "year").endOf("year").toDate();
      const previousYearServices = await prisma.services.count({
        where: {
          createdAt: {
            gte: startOfPreviousYear,
            lte: endOfPreviousYear
          }
        }
      });
      return reply.status(200).send({
        totalCurrentYear: servicesInYear,
        totalPreviousYear: previousYearServices
      });
    }
  );
}

// src/http/core/services/get-all-services.ts
var import_zod21 = __toESM(require("zod"));
async function getAllServices(app) {
  app.withTypeProvider().register(auth).get(
    "/services/all",
    {
      schema: {
        tags: ["services"],
        summary: "Busca todos os atendimentos cadastrados",
        security: [{ bearerAuth: [] }],
        querystring: import_zod21.default.object({
          pageIndex: import_zod21.default.coerce.number().default(1),
          oab: import_zod21.default.string().optional(),
          lawyerName: import_zod21.default.string().optional(),
          agentName: import_zod21.default.string().optional(),
          assistance: import_zod21.default.enum(["PERSONALLY", "REMOTE"]).optional(),
          // Filtro por tipo de assistance
          status: import_zod21.default.enum(["OPEN", "COMPLETED"]).optional()
          // Filtro por status
        }),
        response: {
          200: import_zod21.default.object({
            services: import_zod21.default.array(
              import_zod21.default.object({
                id: import_zod21.default.string().uuid(),
                assistance: import_zod21.default.enum(["PERSONALLY", "REMOTE"]),
                observation: import_zod21.default.string().nullable(),
                status: import_zod21.default.enum(["OPEN", "COMPLETED"]),
                createdAt: import_zod21.default.date(),
                finishedAt: import_zod21.default.date().nullable(),
                lawyer: import_zod21.default.object({
                  id: import_zod21.default.string().uuid(),
                  name: import_zod21.default.string(),
                  oab: import_zod21.default.string(),
                  email: import_zod21.default.string()
                }),
                agent: import_zod21.default.object({
                  id: import_zod21.default.string().uuid(),
                  name: import_zod21.default.string(),
                  email: import_zod21.default.string(),
                  role: import_zod21.default.enum(["ADMIN", "MEMBER"])
                }),
                serviceTypes: import_zod21.default.array(
                  import_zod21.default.object({
                    serviceType: import_zod21.default.object({
                      id: import_zod21.default.string().cuid(),
                      name: import_zod21.default.string()
                    })
                  })
                )
              })
            ),
            total: import_zod21.default.number()
          })
        }
      }
    },
    async (request, reply) => {
      await request.getCurrentAgentId();
      const { pageIndex, oab, lawyerName, agentName, assistance, status } = request.query;
      try {
        const [services, total] = await Promise.all([
          prisma.services.findMany({
            where: {
              assistance: assistance ? assistance : void 0,
              // Filtro por assistance
              status: status ? status : void 0,
              // Filtro por status
              lawyer: {
                oab: oab ? { contains: oab, mode: "insensitive" } : void 0,
                name: lawyerName ? { contains: lawyerName, mode: "insensitive" } : void 0
              },
              agent: {
                name: agentName ? { contains: agentName, mode: "insensitive" } : void 0
              }
            },
            select: {
              id: true,
              assistance: true,
              observation: true,
              status: true,
              createdAt: true,
              finishedAt: true,
              lawyer: {
                select: {
                  id: true,
                  name: true,
                  oab: true,
                  email: true
                }
              },
              agent: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true
                }
              },
              serviceTypes: {
                select: {
                  serviceType: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            },
            orderBy: [
              { status: "asc" },
              // OPEN antes de COMPLETED
              { finishedAt: "desc" },
              // Mais recentes primeiro
              { createdAt: "desc" }
              // Mais recentes primeiro
            ],
            skip: (pageIndex - 1) * 10,
            // Pular os primeiros 10 atendimentos
            take: 10
            // Recuperar apenas 10 atendimentos
          }),
          prisma.services.count({
            where: {
              assistance: assistance ? assistance : void 0,
              // Filtro por assistance
              status: status ? status : void 0,
              // Filtro por status
              lawyer: {
                oab: oab ? { contains: oab, mode: "insensitive" } : void 0,
                name: lawyerName ? { contains: lawyerName, mode: "insensitive" } : void 0
              },
              agent: {
                name: agentName ? { contains: agentName, mode: "insensitive" } : void 0
              }
            }
          })
        ]);
        if (!services) {
          throw new BadRequestError(
            " Ainda n\xE3o existem atendimentos cadastrados."
          );
        }
        return reply.status(200).send({ services, total });
      } catch (err) {
        throw new BadRequestError(
          " Ocorreu um erro ao tentar recuperar os atendimentos. Por favor, tente novamente mais tarde. Caso o problema persista, entre em contato com o suporte t\xE9cnico para assist\xEAncia."
        );
      }
    }
  );
}

// src/http/core/services/get-all-types-services.ts
var import_zod22 = __toESM(require("zod"));
async function getAllTypesServices(app) {
  app.withTypeProvider().register(auth).get(
    "/services/types/all",
    {
      schema: {
        tags: ["servicesTypes"],
        summary: "Busca todos os tipos de servi\xE7os cadastrados",
        security: [{ bearerAuth: [] }],
        querystring: import_zod22.default.object({
          pageIndex: import_zod22.default.coerce.number().default(1),
          id: import_zod22.default.string().cuid().optional(),
          name: import_zod22.default.string().optional()
        }),
        response: {
          200: import_zod22.default.object({
            servicesTypes: import_zod22.default.array(
              import_zod22.default.object({
                id: import_zod22.default.string().cuid(),
                name: import_zod22.default.string()
              })
            ),
            total: import_zod22.default.number()
          })
        }
      }
    },
    async (request, reply) => {
      await request.checkIfAgentIsAdmin();
      const { pageIndex, id, name } = request.query;
      try {
        const [servicesTypes, total] = await Promise.all([
          prisma.serviceTypes.findMany({
            where: {
              id: id && { equals: id },
              name: name ? { contains: name, mode: "insensitive" } : void 0
            },
            select: {
              id: true,
              name: true
            },
            orderBy: [
              {
                createdAt: "desc"
                // Mostra os tipos de serviços mais recentes primeiro
              }
            ],
            skip: (pageIndex - 1) * 10,
            take: 10
          }),
          prisma.serviceTypes.count({
            where: {
              id: id && { equals: id },
              name: name ? { contains: name, mode: "insensitive" } : void 0
            }
          })
        ]);
        if (!servicesTypes) {
          throw new BadRequestError(
            "Nenhum tipo de servi\xE7o cadastrado. Cadastre um para continuar."
          );
        }
        return reply.status(200).send({ servicesTypes, total });
      } catch (err) {
        throw new BadRequestError(
          "N\xE3o foi poss\xEDvel recuperar os tipos de servi\xE7os. Tente novamente mais tarde."
        );
      }
    }
  );
}

// src/http/core/services/get-all-types-services-without-pagination.ts
var import_zod23 = __toESM(require("zod"));
async function getAllTypesServicesWithoutPagination(app) {
  app.withTypeProvider().register(auth).get(
    "/services/types/all-wp",
    {
      schema: {
        tags: ["servicesTypes"],
        summary: "Busca todos os tipos de servi\xE7os cadastrados sem pagina\xE7\xE3o",
        security: [{ bearerAuth: [] }],
        response: {
          200: import_zod23.default.object({
            servicesTypes: import_zod23.default.array(
              import_zod23.default.object({
                id: import_zod23.default.string().cuid(),
                name: import_zod23.default.string()
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

// src/http/core/services/update-type-service.ts
var import_zod24 = __toESM(require("zod"));
async function updateTypeService(app) {
  app.withTypeProvider().register(auth).put(
    "/services/types/update/:id",
    {
      schema: {
        tags: ["servicesTypes"],
        summary: "Atualiza\xE7\xE3o de um tipo de servi\xE7o",
        security: [{ bearerAuth: [] }],
        params: import_zod24.default.object({
          id: import_zod24.default.string().cuid()
        }),
        body: import_zod24.default.object({
          name: import_zod24.default.string().min(6)
        }),
        response: {
          204: import_zod24.default.null()
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

// src/http/core/agents/create-account.ts
var import_bcryptjs3 = require("bcryptjs");

// src/utils/emails/agent-registration-email.tsx
var import_components2 = require("@react-email/components");
var React2 = __toESM(require("react"));
var AgentRegistrationEmail = ({
  name,
  email,
  tempPassword,
  link
}) => {
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  const sendDate = (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR");
  return /* @__PURE__ */ React2.createElement(import_components2.Html, null, /* @__PURE__ */ React2.createElement(import_components2.Head, null), /* @__PURE__ */ React2.createElement(import_components2.Preview, null, "Bem-vindo(a) \xE0 OAB Atende! Confira os detalhes do seu cadastro."), /* @__PURE__ */ React2.createElement(import_components2.Tailwind, null, /* @__PURE__ */ React2.createElement(import_components2.Body, { className: "bg-gray-100 font-sans" }, /* @__PURE__ */ React2.createElement(import_components2.Container, { className: "bg-white border border-gray-200 rounded-lg p-8 mx-auto my-8 max-w-xl" }, /* @__PURE__ */ React2.createElement(import_components2.Heading, { className: "text-2xl font-bold text-center text-blue-700 mb-6" }, "Bem-vindo(a) \xE0 OAB Atende!"), /* @__PURE__ */ React2.createElement(import_components2.Text, { className: "text-gray-700 mb-6" }, "Ol\xE1, ", /* @__PURE__ */ React2.createElement("b", null, name)), /* @__PURE__ */ React2.createElement(import_components2.Text, { className: "text-gray-700 mb-6" }, "Estamos muito felizes em t\xEA-lo(a) conosco! Abaixo est\xE3o os detalhes do seu cadastro:"), /* @__PURE__ */ React2.createElement(import_components2.Section, { className: "bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6" }, /* @__PURE__ */ React2.createElement(import_components2.Text, { className: "text-gray-700 mb-2" }, /* @__PURE__ */ React2.createElement("b", null, "Nome:"), " ", name), /* @__PURE__ */ React2.createElement(import_components2.Text, { className: "text-gray-700 mb-2" }, /* @__PURE__ */ React2.createElement("b", null, "E-mail:"), " ", email), /* @__PURE__ */ React2.createElement(import_components2.Text, { className: "text-gray-700" }, /* @__PURE__ */ React2.createElement("b", null, "Senha provis\xF3ria:"), " ", tempPassword)), /* @__PURE__ */ React2.createElement(import_components2.Text, { className: "text-gray-700 mb-6" }, "Voc\xEA est\xE1 recebendo uma senha tempor\xE1ria para acessar o sistema da OAB Atende. Por quest\xF5es de seguran\xE7a, \xE9 obrigat\xF3rio que voc\xEA realize a redefini\xE7\xE3o de senha."), /* @__PURE__ */ React2.createElement(
    import_components2.Button,
    {
      href: link,
      className: "bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-center block"
    },
    "Acessar o Sistema"
  ), /* @__PURE__ */ React2.createElement(import_components2.Hr, { className: "border-gray-200 my-6" }), /* @__PURE__ */ React2.createElement(import_components2.Text, { className: "text-sm text-gray-500 text-center" }, "Este \xE9 um e-mail autom\xE1tico. Por favor, n\xE3o responda a esta mensagem."), /* @__PURE__ */ React2.createElement(import_components2.Hr, { className: "border-gray-200 my-6" }), /* @__PURE__ */ React2.createElement(import_components2.Text, { className: "text-xs text-gray-400 text-center" }, "\xA9 ", currentYear, " OAB Atende. Todos os direitos reservados."), /* @__PURE__ */ React2.createElement(import_components2.Text, { className: "text-xs text-gray-400 text-center" }, "Este e-mail foi enviado em ", sendDate, ".")))));
};

// src/http/core/agents/create-account.ts
var import_zod25 = require("zod");
async function createAccountService(app) {
  app.withTypeProvider().register(auth).post(
    "/agents",
    {
      schema: {
        tags: ["agents"],
        summary: "Cria\xE7\xE3o de um novo funcion\xE1rio",
        security: [{ bearerAuth: [] }],
        body: import_zod25.z.object({
          name: import_zod25.z.string(),
          email: import_zod25.z.string().email(),
          password: import_zod25.z.string().min(8)
        }),
        response: {
          201: import_zod25.z.null()
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
      const passwordHash = await (0, import_bcryptjs3.hash)(password, 8);
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

// src/http/core/services/get-services-by-month-for-chart.ts
var import_zod26 = __toESM(require("zod"));
async function getServicesByMonthForChart(app) {
  app.withTypeProvider().register(auth).get(
    "/services/monthly",
    {
      schema: {
        tags: ["services"],
        summary: "Busca a quantidade de atendimentos por m\xEAs",
        security: [{ bearerAuth: [] }],
        response: {
          200: import_zod26.default.array(
            import_zod26.default.object({
              data: import_zod26.default.string(),
              services: import_zod26.default.number()
            })
          )
        }
      }
    },
    async (request, reply) => {
      await request.getCurrentAgentId();
      try {
        const services = await prisma.services.groupBy({
          by: ["createdAt"],
          _count: {
            id: true
          },
          orderBy: {
            createdAt: "asc"
          }
        });
        const months = [
          "Jan",
          "Fev",
          "Mar",
          "Abr",
          "Mai",
          "Jun",
          "Jul",
          "Ago",
          "Set",
          "Out",
          "Nov",
          "Dez"
        ];
        const formattedData = months.map((month, index) => {
          const monthData = services.filter(
            (service) => new Date(service.createdAt).getMonth() === index
          );
          return {
            data: month,
            services: monthData.reduce(
              (sum, service) => sum + service._count.id,
              0
            )
          };
        });
        return reply.status(200).send(formattedData);
      } catch (err) {
        throw new BadRequestError(
          "Ocorreu um erro ao tentar recuperar os atendimentos mensais. Por favor, tente novamente mais tarde."
        );
      }
    }
  );
}

// src/http/routes/index.ts
async function routes(app) {
  app.register(createAccountService);
  app.register(authenticate);
  app.register(getProfile);
  app.register(requestPasswordRecover);
  app.register(resetPassword);
  app.register(getAll);
  app.register(updateAgent);
  app.register(inactiveAgent);
  app.register(activeAgent);
  app.register(logoutAgent);
  app.register(createTypeService);
  app.register(getAllTypesServices);
  app.register(updateTypeService);
  app.register(createService);
  app.register(createServiceExternal);
  app.register(consultLawyer);
  app.register(getAllServices);
  app.register(finishedService);
  app.register(cancelService);
  app.register(getAllQuantityServices);
  app.register(getAllTypesServicesWithoutPagination);
  app.register(getAllQuantityServicesInMonth);
  app.register(getAllQuantityServicesInYear);
  app.register(getAllQuantityServicesByAgent);
  app.register(getServicesByMonthForChart);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  routes
});
//# sourceMappingURL=index.js.map