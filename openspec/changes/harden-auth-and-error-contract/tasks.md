## 1. Classes de erro e handler global

- [x] 1.1 Criar `ForbiddenError`, `NotFoundError`, `ConflictError` e `UnprocessableEntityError` em `src/http/_errors/`, no padrão de `unauthorized-error.ts` (mensagem opcional com padrão em pt-BR)
- [x] 1.2 Mapear as quatro classes no `errorHandler` (`src/http/_errors/index.ts`) para 403, 404, 409 e 422, antes do ramo 429, e remover o espaço inicial da mensagem de validação e do padrão de `UnauthorizedError`

## 2. Middleware de autenticação

- [x] 2.1 Reescrever `src/http/middlewares/auth.ts` com `getCurrentAgent()` memoizado por requisição: valida o JWT, busca `{ id, role, inactive }` pelo `sub`, lança `UnauthorizedError` para token inválido, funcionário inexistente ou inativo (mensagens do design)
- [x] 2.2 Reimplementar `getCurrentAgentId()` sobre `getCurrentAgent()` e `checkIfAgentIsAdmin()` com `role !== 'ADMIN'` → `ForbiddenError`
- [x] 2.3 Declarar `getCurrentAgent(): Promise<{ id: string; role: Role }>` em `src/http/_types/fastify.d.ts`

## 3. Rotas de funcionários

- [x] 3.1 `logout-agent.ts`: remover `.register(auth)`, a busca do funcionário e o `security` do schema; sempre `clearCookie('@lexhub-auth', { path: '/', domain: env.DOMAIN })` e `200`
- [x] 3.2 `get-profile.ts`: funcionário não encontrado → `UnauthorizedError('Token inválido ou expirado. Faça login novamente.')`
- [x] 3.3 `create-account.ts`: e-mail duplicado → `ConflictError`
- [x] 3.4 `update-agent.ts`: não encontrado → `NotFoundError`, e-mail em uso → `ConflictError`, remover o `try/catch` do `update`
- [x] 3.5 `active-agent.ts` e `inactive-agent.ts`: não encontrado → `NotFoundError`, remover o `try/catch` do `update`
- [x] 3.6 `reset-password.ts`: código inválido e senha igual à atual → `BadRequestError` (o terceiro caso, token apontando para funcionário inexistente, também passou a `BadRequestError`, para a rota não lançar mais `UnauthorizedError`)

## 4. Rotas de atendimentos e tipos

- [x] 4.1 `finished-service.ts`: usar `getCurrentAgent()`; ordem 404 (`NotFoundError`) → 403 (`ForbiddenError` se não for dono nem admin) → 409 (`ConflictError` se `COMPLETED`); remover o `try/catch`
- [x] 4.2 `cancel-service.ts`: mesma ordem e regras do 4.1, com a mensagem de cancelamento; remover o `try/catch`
- [x] 4.3 `consult-lawyer.ts`: inadimplente → `UnprocessableEntityError` (mesmas mensagens) e remover o `console.log` esquecido
- [x] 4.4 `create-service.ts` e `create-service-external.ts`: tipo de serviço inexistente → `BadRequestError`
- [x] 4.5 `create-type-service.ts`: nome duplicado → `ConflictError`
- [x] 4.6 `update-type-service.ts`: não encontrado → `NotFoundError`, nome em uso → `ConflictError`, remover o `try/catch`
- [x] 4.7 Conferir com `grep -rn UnauthorizedError src/http/core` que nenhuma rota lança mais `UnauthorizedError` (só o middleware e o `get-profile`)

## 5. Verificação

- [x] 5.1 `pnpm tsc --noEmit` e `pnpm biome check src` sem erros. O `tsc` só roda com `--ignoreDeprecations 5.0`, por causa do `ignoreDeprecations: "6.0"` não commitado no `tsconfig.json` (DT-32). O Biome aponta só a ordem de imports de `routes/index.ts`, que já existia.
- [x] 5.2 Validar manualmente com `pnpm dev` (curl/Swagger): sem token → 401; MEMBER em rota de admin → 403; funcionário inativado com token antigo → 401 com a mensagem de acesso desativado; reativado → volta a funcionar
- [x] 5.3 Validar manualmente: logout sem cookie e com JWT expirado → 200 com `Set-Cookie` limpando `@lexhub-auth`
- [x] 5.4 Validar manualmente finalizar/cancelar: dono → 204; ADMIN em atendimento de outro → 204; MEMBER em atendimento de outro → 403; id inexistente → 404; já finalizado → 409
- [x] 5.5 Validar manualmente: e-mail duplicado ao criar funcionário → 409; tipo duplicado → 409; código de reset inválido → 400
- [x] 5.6 `openspec validate harden-auth-and-error-contract --strict`

## 6. Documentação

- [x] 6.1 `docs/api.md`: atualizar os status de cada endpoint conforme o mapa do design, marcar o logout como público e registrar a regra de dono/admin em finalizar/cancelar
- [x] 6.2 `docs/arquitetura.md`: seção do middleware (`getCurrentAgent`, checagem de inatividade, 403) e tabela de erros com as novas classes
- [x] 6.3 `docs/fluxos-de-negocio.md`: inadimplente → 422 no fluxo de atendimento e inativação com efeito imediato
- [x] 6.4 `docs/debitos-tecnicos.md`: marcar DT-03 e DT-20 como resolvidos e DT-15/DT-21 como parciais, citando a change
- [x] 6.5 `CLAUDE.md` e `context` de `openspec/config.yaml`: listar as novas classes de erro e a regra "401 só no middleware"
