"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consultLawyer = consultLawyer;
const unauthorized_error_1 = require("http/_errors/unauthorized-error");
const auth_1 = require("http/middlewares/auth");
const axios_1 = require("lib/axios");
const zod_1 = require("zod");
async function consultLawyer(app) {
    app
        .withTypeProvider()
        .register(auth_1.auth)
        .post('/services/consult/lawyer', {
        schema: {
            tags: ['services'],
            summary: 'Consulta inadimplência do advogado',
            security: [{ bearerAuth: [] }],
            body: zod_1.z.object({
                oab: zod_1.z.string(),
            }),
            response: {
                200: zod_1.z.object({
                    name: zod_1.z.string(),
                }),
            },
        },
    }, async (request, reply) => {
        await request.getCurrentAgentId();
        const { oab } = request.body;
        // Busca na API do Protheus se o advogado está adimplente
        const { data } = await (0, axios_1.API_PROTHEUS_FIN_URL)(`/${oab}`);
        const { data: { lawyer }, } = await (0, axios_1.API_PROTHEUS_DATA_URL)('/', {
            params: {
                idOrg: 10,
                param: oab,
            },
        });
        if (!data) {
            const name = lawyer?.nome;
            throw new unauthorized_error_1.UnauthorizedError(`Prezado(a) ${name}, não podemos prosseguir com o atendimento. Para mais informações, entre em contato com o Setor Financeiro.`);
        }
        return reply.status(200).send({
            name: lawyer?.nome,
        });
    });
}
