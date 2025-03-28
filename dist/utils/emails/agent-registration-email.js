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

// src/utils/emails/agent-registration-email.tsx
var agent_registration_email_exports = {};
__export(agent_registration_email_exports, {
  AgentRegistrationEmail: () => AgentRegistrationEmail
});
module.exports = __toCommonJS(agent_registration_email_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AgentRegistrationEmail
});
//# sourceMappingURL=agent-registration-email.js.map