# API LexHub (OAB Atende)

Backend Fastify 5 + Prisma 6 + PostgreSQL do sistema de atendimentos da OAB Maranhão.
Toda a comunicação, documentação e mensagens de erro são em português (pt-BR).

## Onde está o conhecimento

- `docs/README.md` — índice da documentação (arquitetura, API, dados, fluxos, integrações, deploy)
- `docs/debitos-tecnicos.md` — problemas conhecidos (DT-xx); consulte antes de mexer em uma área
- `openspec/specs/<capacidade>/spec.md` — comportamento atual, fonte da verdade dos requisitos
- `openspec/config.yaml` — contexto do projeto e regras de escrita dos artefatos

## Fluxo de mudanças (OpenSpec)

Mudanças de comportamento seguem `/opsx:propose` → revisão → `/opsx:apply` → `/opsx:archive`.
Correções triviais (mensagens, typos) podem ir direto ao código. Sempre que o comportamento
mudar, atualize a spec (via change) e o documento correspondente em `docs/`.

## Convenções de código

- Uma rota por arquivo em `src/http/core/{agents,services,metrics}/`, registrada em `src/http/routes/index.ts`
- Métricas: períodos pelos helpers de `utils/metrics/period` (fuso `America/Fortaleza`), nunca `dayjs()` direto;
  agregações em `utils/metrics/queries`
- Schemas Zod no `schema` da rota (validação, serialização e Swagger); `tags`, `summary` e `security`
- Rotas protegidas: `.register(auth)` + `request.getCurrentAgent()` / `getCurrentAgentId()` ou `request.checkIfAgentIsAdmin()`
  (o middleware recusa token inválido/expirado e funcionário inexistente ou inativo com 401)
- Erros de domínio (`src/http/_errors`): `BadRequestError` (400), `ForbiddenError` (403),
  `NotFoundError` (404), `ConflictError` (409), `UnprocessableEntityError` (422),
  `BadGatewayError` (502, falha de provedor externo, ex.: Resend).
  `UnauthorizedError` (401) é **exclusivo** do middleware de auth (sessão inválida) — nunca use em rotas
- Imports resolvidos por `baseUrl: ./src` (ex.: `import { prisma } from 'lib/prisma'`)
- Biome: aspas simples, sem ponto e vírgula, 2 espaços, 80 colunas, `arrowParentheses: asNeeded`

## Comandos

```bash
pnpm dev                      # servidor com reload (porta 3892, Swagger em /docs)
pnpm build                    # tsup → build/ (não faz typecheck)
pnpm tsc --noEmit             # typecheck
pnpm biome check src          # lint/format
pnpm prisma migrate dev       # nova migration local
openspec validate --specs --strict
```

Não há testes automatizados. Push em `main` faz deploy automático em produção.
