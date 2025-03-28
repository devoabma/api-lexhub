"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetPasswordEmail = void 0;
const components_1 = require("@react-email/components");
const React = __importStar(require("react"));
// @ts-ignore somente para o react-email
React.version;
const ResetPasswordEmail = ({ name, code, link, }) => {
    const currentYear = new Date().getFullYear();
    const sendDate = new Date().toLocaleDateString('pt-BR');
    return (<components_1.Html>
      <components_1.Head />
      <components_1.Preview>
        Recebemos uma solicitação para redefinir a senha da sua conta no OAB
        Atende.
      </components_1.Preview>

      <components_1.Tailwind>
        <components_1.Body className="bg-gray-100 font-sans">
          <components_1.Container className="bg-white border border-gray-200 rounded-lg p-8 mx-auto my-8 max-w-xl">
            <components_1.Heading className="text-2xl font-bold text-center text-blue-700 mb-6">
              Redefinição de Senha - OAB Atende
            </components_1.Heading>
            <components_1.Text className="text-gray-700 mb-6">
              Olá, <b>{name}</b>
            </components_1.Text>
            <components_1.Text className="text-gray-700 mb-6">
              Recebemos uma solicitação para redefinir a senha da sua conta no
              OAB Atende. Use o código abaixo para concluir o processo de
              redefinição:
            </components_1.Text>
            <components_1.Section className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <components_1.Text className="text-2xl font-bold text-center text-blue-700">
                {code}
              </components_1.Text>
            </components_1.Section>
            <components_1.Text className="text-gray-700 mb-6">
              Agora, clique no botão abaixo para ser redirecionado à página de
              redefinição de senha:
            </components_1.Text>
            <components_1.Button href={link} className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-center block">
              Redefinir Senha
            </components_1.Button>
            <components_1.Hr className="border-gray-200 my-6"/>
            <components_1.Text className="text-sm text-gray-500 text-center">
              Se você não solicitou a redefinição de senha, por favor ignore
              este e-mail ou entre em contato com nosso suporte.
            </components_1.Text>
            <components_1.Hr className="border-gray-200 my-6"/>
            <components_1.Text className="text-xs text-gray-400 text-center">
              &copy; {currentYear} OAB Atende. Todos os direitos reservados.
            </components_1.Text>
            <components_1.Text className="text-xs text-gray-400 text-center">
              Este e-mail foi enviado em {sendDate}.
            </components_1.Text>
          </components_1.Container>
        </components_1.Body>
      </components_1.Tailwind>
    </components_1.Html>);
};
exports.ResetPasswordEmail = ResetPasswordEmail;
