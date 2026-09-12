## Why

A API usa `401` para quase tudo — sessão expirada, mas também "não encontrado",
e-mail duplicado, atendimento já finalizado e advogado inadimplente —, o que
impede o frontend de tratar "sessão expirada" de forma global (um interceptor de
401 deslogaria o usuário a cada erro de negócio). Além disso, o middleware de
autenticação não revoga o acesso de funcionários inativados (DT-03), o logout
falha quando o token já expirou (o cookie fica e o usuário vê "erro ao se
deslogar") e qualquer funcionário finaliza ou cancela atendimentos de outros,
embora o frontend só ofereça essas ações ao dono do atendimento ou a um
administrador (DT-15). O frontend já recebeu o plano de adaptação e aguarda este
contrato para a fase 2.

## What Changes

- **Middleware de autenticação** (`src/http/middlewares/auth.ts`): toda rota
  protegida passa a carregar o funcionário da sessão no banco (uma consulta por
  requisição, memoizada) e recusa com `401` quando ele não existe ou está
  inativo. Novo helper `request.getCurrentAgent()` (`{ id, role }`).
  `checkIfAgentIsAdmin()` passa a exigir `role === 'ADMIN'` (em vez de recusar
  apenas `MEMBER`) e responde `403`. Resolve DT-03.
- **Semântica de status HTTP** (DT-20): `UnauthorizedError` (401) passa a ser
  lançado **somente** pelo middleware (sessão ausente, inválida, expirada, ou
  funcionário inexistente/inativo). Novos erros de domínio: `ForbiddenError`
  (403), `NotFoundError` (404), `ConflictError` (409) e
  `UnprocessableEntityError` (422). O corpo continua `{ message }`.
  **BREAKING (contrato HTTP)**: vários endpoints mudam de status (tabela no
  design). O frontend atual não é afetado — ele só lê `response.data.message`,
  nunca o status —, mas qualquer outro cliente que dependa de `401` precisa se
  ajustar.
- **Consulta de advogado inadimplente**: `POST /services/consult/lawyer` passa de
  `401` para `422`, com a mesma mensagem.
- **Redefinição de senha**: código inválido e senha igual à atual passam de `401`
  para `400`.
- **Logout** (`POST /agents/logout`): passa a ser **pública e idempotente** —
  sempre `200` e sempre limpa o cookie `@lexhub-auth`, com ou sem token válido.
- **Finalizar/cancelar atendimento** (DT-15, parcial): só o funcionário que
  registrou o atendimento ou um administrador; demais recebem `403`.
- Blocos `try/catch` que convertiam falhas de banco em `401` nas rotas de
  escrita são removidos; a falha segue para o handler global (`500`, com log),
  como qualquer erro inesperado (DT-21, parcial).

Fora do escopo: regra do atendimento único ao inadimplente (DT-10), código de
recuperação de senha (DT-02), enumeração no login (DT-04), rate limit (DT-05),
renomeação de rotas (DT-25) e o `404` genérico das falhas do Protheus (DT-23).

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `agent-auth`: middleware passa a checar existência e inatividade do funcionário
  (remove o requisito "Sessão não revogável por inativação"); não-admin recebe
  `403`; logout público e idempotente; perfil sem funcionário responde `401`.
- `api-platform`: tabela do handler global ganha `403`, `404`, `409` e `422`, e
  passa a restringir `401` a falhas de sessão.
- `agent-management`: e-mail duplicado `409`, funcionário inexistente `404`,
  não-admin `403`; inativação revoga o acesso imediatamente.
- `service-types`: nome duplicado `409`, tipo inexistente `404`, não-admin `403`.
- `service-lifecycle`: tipo de serviço inexistente `400`; finalizar/cancelar
  restritos ao dono ou admin (`403`), atendimento inexistente `404`, já
  finalizado `409`.
- `lawyer-verification`: inadimplente responde `422`.
- `password-recovery`: código inválido e senha igual à atual respondem `400`.

## Impact

- **Código**: `src/http/middlewares/auth.ts`, `src/http/_types/fastify.d.ts`,
  `src/http/_errors/*` (quatro classes novas e handler), e as rotas
  `agents/{active-agent,inactive-agent,update-agent,create-account,get-profile,logout-agent,reset-password}.ts`
  e `services/{cancel-service,finished-service,consult-lawyer,create-service,create-service-external,create-type-service,update-type-service}.ts`.
- **Banco**: sem mudança de schema e sem migration. Uma consulta extra por
  requisição autenticada (busca por chave primária em `agents`).
- **Frontend (web-lexhub)**: nenhuma quebra no código atual. Esta change
  habilita a fase 2 já combinada: interceptor global de `401` → limpar cache e
  voltar ao login; `403` → toast com a mensagem.
- **Operação**: um funcionário inativado perde o acesso na próxima requisição,
  não mais em até 24h.
- **Documentação**: `docs/api.md`, `docs/arquitetura.md`,
  `docs/fluxos-de-negocio.md`, `docs/debitos-tecnicos.md`, `CLAUDE.md` e o
  `context` de `openspec/config.yaml`, que citam apenas `BadRequestError` e
  `UnauthorizedError`.
