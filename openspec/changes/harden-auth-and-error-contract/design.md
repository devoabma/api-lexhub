## Context

A autenticação é feita pelo plugin `src/http/middlewares/auth.ts`, registrado em
cada arquivo de rota com `.register(auth)`. Ele não bloqueia nada sozinho: adiciona
à requisição dois helpers "preguiçosos" que a rota chama no início do handler.

- `getCurrentAgentId()` só valida a assinatura e a expiração do JWT (cookie
  `@lexhub-auth` ou `Authorization: Bearer`) e devolve o `sub`. Não consulta o
  banco, então funcionário inativado continua usando a API até o token expirar
  (1 dia).
- `checkIfAgentIsAdmin()` valida o JWT de novo, busca o papel no banco e recusa
  com `401` quando o papel é `MEMBER`. Ignora `inactive`.

O handler global (`src/http/_errors/index.ts`) só conhece `BadRequestError` (400)
e `UnauthorizedError` (401), e as rotas usam o 401 para "não encontrado",
duplicidade, estado inválido e até para o advogado inadimplente.

O frontend (web-lexhub) lê apenas `err.response.data.message` nos toasts e nunca
o status (verificado em set/2026). Na interface, ele só oferece
finalizar/cancelar ao dono do atendimento ou a um administrador (`canManage` em
`service-table-row.tsx`). A fase 2 do plano do frontend (interceptor de `401` →
logout) depende deste contrato.

Não há testes automatizados; a validação é manual (curl/Swagger) com o servidor
local.

## Goals / Non-Goals

**Goals:**

- `401` significa exclusivamente "sessão inválida" e só é lançado pelo middleware.
- Funcionário inativo ou inexistente perde o acesso na requisição seguinte.
- Erros de domínio com status corretos: 403, 404, 409 e 422.
- Logout funciona sempre, inclusive com token expirado.
- Finalizar/cancelar com a mesma regra de autorização que o frontend já exibe.

**Non-Goals:**

- Trocar o JWT stateless por sessões no banco, refresh token ou lista de revogação.
- Mover a checagem para um hook `onRequest` que bloqueie a rota antes da
  validação de schema. Hoje uma requisição sem token e com corpo inválido recebe
  `400` antes do `401`. Isso continua assim.
- DT-02, DT-04, DT-05, DT-10, DT-23 e DT-25 (ver proposal).
- Documentar as respostas de erro nos schemas Swagger das rotas.

## Decisions

### 1. Funcionário da sessão carregado uma vez por requisição

O hook `preHandler` do plugin cria, por requisição, uma função memoizada
`getCurrentAgent()` que:

1. valida o JWT (`request.jwtVerify`) → falha: `UnauthorizedError('Token inválido ou expirado. Faça login novamente.')`;
2. busca `agents` por `id = sub` selecionando `{ id, role, inactive }` →
   inexistente: mesmo `UnauthorizedError` acima;
3. `inactive !== null` → `UnauthorizedError('Seu acesso foi desativado. Procure o administrador do sistema.')`;
4. devolve `{ id, role }`.

A promessa fica guardada numa variável da closure do hook, então chamar
`getCurrentAgentId()`, `getCurrentAgent()` e `checkIfAgentIsAdmin()` na mesma
requisição gera **uma** consulta. Os helpers passam a ser:

- `getCurrentAgent(): Promise<{ id: string; role: Role }>` (novo);
- `getCurrentAgentId(): Promise<string>` → `(await getCurrentAgent()).id`;
- `checkIfAgentIsAdmin(): Promise<void>` → `role !== 'ADMIN'` lança
  `ForbiddenError('Permissão negada. Você precisa ser um administrador para realizar esta ação.')`.

As assinaturas atuais continuam valendo, então as rotas não precisam mudar para
ganhar a checagem de inatividade.

**Alternativas:** manter o JWT sem consulta e reduzir a validade com refresh token
(mais código no front e na API, e o inativo ainda passaria até o refresh); cache
em memória por id (invalidação entre instâncias do pm2, ganho irrelevante — é uma
busca por chave primária).

O `role` continua no JWT só para a interface do frontend. A API ignora esse valor
e usa o papel do banco.

### 2. Novas classes de erro e tabela do handler

Em `src/http/_errors/`, no mesmo padrão de `UnauthorizedError` (mensagem
opcional com padrão em pt-BR):

| Classe | Status | Uso |
|---|---|---|
| `BadRequestError` | 400 | dado enviado inválido (existente) |
| `UnauthorizedError` | 401 | **somente** middleware: sessão inválida |
| `ForbiddenError` | 403 | autenticado, mas sem permissão |
| `NotFoundError` | 404 | recurso do caminho (`:id`) não existe |
| `ConflictError` | 409 | duplicidade ou estado incompatível |
| `UnprocessableEntityError` | 422 | regra de negócio impede a operação |

O handler global mapeia as novas classes antes do ramo `429`. A ordem e o
restante (validação, `ZodError`, `AxiosError` → 404, 500) não mudam. O espaço
inicial da mensagem de validação é removido.

**Por que 422 para o inadimplente e não 403?** O 403 descreve a permissão do
*funcionário*. Aqui o funcionário pode atender, mas uma regra sobre o *advogado*
impede. Usar 403 misturaria os dois casos no tratamento do frontend (fase 2:
403 = "sem permissão"). O 409 não se aplica: não há conflito de estado de recurso.

**Por que 400 (e não 404) para tipo de serviço inexistente no corpo?** O 404 fica
reservado ao recurso identificado no caminho. Um id inválido dentro do corpo é
dado enviado inválido.

### 3. Mapa de status por endpoint

| Endpoint | Situação | Antes | Depois |
|---|---|---|---|
| qualquer rota protegida | funcionário inativo (token válido) | aceito | **401** |
| qualquer rota protegida | `sub` sem funcionário | 401/400 variável | **401** |
| rotas de admin | papel diferente de `ADMIN` | 401 | **403** |
| `POST /agents/logout` | token ausente/expirado | 401 | **200** (limpa cookie) |
| `GET /agents/profile` | funcionário não encontrado | 400 | **401** |
| `POST /agents` | e-mail duplicado | 400 | **409** |
| `PUT /agents/update/:id` | não encontrado / e-mail em uso | 401 / 401 | **404** / **409** |
| `PATCH /agents/{active,inactive}/:id` | não encontrado | 401 | **404** |
| `POST /agents/password/reset` | código inválido / senha igual | 401 / 401 | **400** / **400** |
| `POST /services/types` | nome duplicado | 400 | **409** |
| `PUT /services/types/update/:id` | não encontrado / nome em uso | 401 / 401 | **404** / **409** |
| `POST /services`, `POST /services/external` | tipo de serviço inexistente | 401 | **400** |
| `POST /services/consult/lawyer` | advogado inadimplente | 401 | **422** |
| `PATCH /services/finished/:id` | não encontrado / não é dono nem admin / já finalizado | 401 / — / 401 | **404** / **403** / **409** |
| `DELETE /services/cancel/:id` | não encontrado / não é dono nem admin / já finalizado | 401 / — / 401 | **404** / **403** / **409** |

As mensagens atuais são mantidas, exceto nos casos novos (inativo, 403 de
finalizar/cancelar) e na limpeza de espaços iniciais.

### 4. Logout público e idempotente

`logout-agent.ts` deixa de registrar `auth` e de consultar o funcionário. Ele
sempre responde `200` com
`clearCookie('@lexhub-auth', { path: '/', domain: env.DOMAIN })` — os mesmos
atributos do login, condição para o navegador apagar o cookie. O `security` sai
do schema da rota. Não há risco de CSRF relevante: a rota só remove o cookie.

### 5. Autorização de finalizar/cancelar

Ordem das checagens: existe? (404) → é dono (`service.agentId === agent.id`) ou
`role === 'ADMIN'`? (403) → está `OPEN`? (409). A autorização vem antes do
estado para não revelar o status de atendimentos de terceiros a quem não pode
agir sobre eles. Mensagens:

- finalizar: `Somente o funcionário que registrou o atendimento ou um administrador pode finalizá-lo.`
- cancelar: `Somente o funcionário que registrou o atendimento ou um administrador pode cancelá-lo.`

### 6. Remoção dos `try/catch` que viravam 401

Em `active-agent`, `inactive-agent`, `update-agent`, `update-type-service`,
`finished-service` e `cancel-service`, o `try/catch` em volta do `update`/`delete`
convertia qualquer falha do banco em `401`, o que, com o interceptor da fase 2,
deslogaria o usuário. Esses blocos são removidos: a falha vira `500` com log no
handler global. Os `try/catch` que lançam `BadRequestError` (listagens e
`create-account`) ficam como estão (DT-21 e DT-14, fora do escopo).

## Risks / Trade-offs

- [Outro cliente da API trata `401` de negócio] → Só o web-lexhub consome a API,
  e ele não depende de status (verificado). Mudança marcada como BREAKING no
  proposal.
- [Frontend publicar a fase 2 antes da API] → Com o contrato antigo, o interceptor
  deslogaria o usuário em erros de negócio. Mitigação: a fase 2 só entra depois
  do deploy desta change (combinado no prompt enviado ao frontend).
- [Uma consulta extra por requisição autenticada] → Busca por chave primária em
  `agents`, dezenas de funcionários; custo desprezível.
- [Funcionário inativado no meio do expediente perde o acesso na hora] → É o
  comportamento desejado (DT-03). Até a fase 2, o frontend mostra toasts com
  "Seu acesso foi desativado"; depois dela, volta ao login.
- [Admin rebaixado continua vendo telas de admin no frontend até relogar] → O
  frontend lê o papel do JWT; a API recusa com `403`, então não há exposição de
  dados. Aceito.
- [Falhas de banco nas rotas de escrita passam a mostrar a mensagem genérica de
  500] → São falhas inesperadas; agora ficam registradas no console.

## Migration Plan

1. Sem mudança no `schema.prisma` e sem migration; o `prisma migrate deploy` do CI
   não é afetado.
2. Deploy normal (push em `main` → CI → `pm2 restart api-lexhub`). A fase 1 do
   frontend é compatível com as duas versões da API.
3. Após o deploy, avisar o frontend para seguir com a fase 2.
4. Rollback: `git revert` do commit e novo deploy. Não há dados a desfazer.

## Open Questions

Nenhuma bloqueante. Os textos das mensagens novas podem ser ajustados na revisão.
