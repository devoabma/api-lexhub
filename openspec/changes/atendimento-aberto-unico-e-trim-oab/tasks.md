## 1. Base

- [x] 1.1 Criar `src/utils/services/assert-no-open-service.ts` com `assertLawyerHasNoOpenService(oab)`: busca o atendimento `OPEN` mais antigo do advogado pela relação `lawyer.oab` e lança `ConflictError` com a mensagem da spec (data e hora via `lib/dayjs` no fuso `TIMEZONE`)

## 2. Rotas

- [x] 2.1 `consult-lawyer.ts`: `oab: z.string().trim().min(1)` e chamada ao helper antes das consultas ao Protheus
- [x] 2.2 `create-service.ts`: `oab: z.string().trim().min(1)` e chamada ao helper antes da busca/cadastro do advogado
- [x] 2.3 `create-service-external.ts`: `oab: z.string().trim().min(1)` e chamada ao helper antes de cadastrar o advogado, consultar a API financeira e marcar `restrictedServiceCount`

## 3. Verificação

- [x] 3.1 `pnpm tsc --noEmit` e `pnpm biome check src` sem erros
- [x] 3.2 Manual (banco local): com um atendimento `OPEN` gravado para um advogado, `POST /services/consult/lawyer`, `POST /services` e `POST /services/external` com a OAB entre espaços respondem `409` com a mensagem da spec, sem criar atendimento nem alterar `restrictedServiceCount`
- [x] 3.3 Manual: com a OAB só com espaços, as três rotas respondem `400`
- [x] 3.4 Manual: após finalizar o atendimento em aberto, a consulta passa da checagem (segue para o Protheus)

## 4. Documentação e specs

- [x] 4.1 `docs/api.md`: `409` (atendimento em aberto) e trim da OAB em `POST /services/consult/lawyer`, `POST /services` e `POST /services/external`
- [x] 4.2 `docs/fluxos-de-negocio.md`: checagem de atendimento em aberto no diagrama do fluxo 1 e parágrafo sobre a regra
- [x] 4.3 `docs/debitos-tecnicos.md`: DT-13 passa a parcial (◐) — trim da OAB feito; resta pontuação/formato e o e-mail único
- [x] 4.4 `openspec validate atendimento-aberto-unico-e-trim-oab --strict` e `openspec validate --specs --strict` sem erros
