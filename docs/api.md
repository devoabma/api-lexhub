# Referência da API

Base: `http://<host>:<PORT>` (sem prefixo de versão). A documentação interativa
gerada a partir dos schemas Zod fica em **`GET /docs`** (Swagger UI).

**Convenções**

- Corpo das requisições e respostas em JSON.
- Autenticação: cookie `@lexhub-auth` **ou** header `Authorization: Bearer <token>`.
- Erros: `{ "message": string }` (ver [arquitetura.md](arquitetura.md#tratamento-de-erros)).
- Status de erro:
  - **401** — somente sessão inválida: sem token, token inválido ou expirado,
    funcionário inexistente ou **inativo**. O cliente deve tratar como
    sessão encerrada;
  - **403** — autenticado, mas sem permissão;
  - **404** — o recurso do caminho (`:id`) não existe;
  - **409** — duplicidade ou estado incompatível;
  - **422** — regra de negócio impede a operação;
  - **400** — dado enviado inválido.
- Toda rota 🔑/👑 pode responder `401`. As rotas 👑 respondem `403` a quem não é `ADMIN`.
- Paginação: `pageIndex` começa em **1**, tamanho fixo de **10** itens, resposta inclui `total`.
- Legenda de acesso: 🌐 público · 🔑 qualquer funcionário autenticado · 👑 somente `ADMIN`.

## Índice de endpoints

| Método | Rota | Acesso | Descrição | Arquivo |
|---|---|---|---|---|
| POST | `/agents/sessions` | 🌐 | Login | `core/agents/authenticate.ts` |
| POST | `/agents/logout` | 🌐 | Logout (limpa o cookie; idempotente) | `core/agents/logout-agent.ts` |
| GET | `/agents/profile` | 🔑 | Perfil do funcionário logado | `core/agents/get-profile.ts` |
| POST | `/agents/password/recover` | 🌐 | Solicita código de redefinição | `core/agents/request-password-recover.ts` |
| POST | `/agents/password/reset` | 🌐 | Redefine senha com código | `core/agents/reset-password.ts` |
| POST | `/agents` | 👑 | Cria funcionário | `core/agents/create-account.ts` |
| GET | `/agents/all` | 👑 | Lista funcionários (paginado) | `core/agents/get-all.ts` |
| PUT | `/agents/update/:id` | 👑 | Atualiza funcionário | `core/agents/update-agent.ts` |
| PATCH | `/agents/inactive/:id` | 👑 | Inativa funcionário | `core/agents/inactive-agent.ts` |
| PATCH | `/agents/active/:id` | 👑 | Reativa funcionário | `core/agents/active-agent.ts` |
| POST | `/services/types` | 👑 | Cria tipo de serviço | `core/services/create-type-service.ts` |
| GET | `/services/types/all` | 👑 | Lista tipos (paginado) | `core/services/get-all-types-services.ts` |
| GET | `/services/types/all-wp` | 🔑 | Lista todos os tipos (sem paginação) | `core/services/get-all-types-services-without-pagination.ts` |
| PUT | `/services/types/update/:id` | 👑 | Renomeia tipo | `core/services/update-type-service.ts` |
| POST | `/services/consult/lawyer` | 🔑 | Consulta advogado/adimplência no Protheus | `core/services/consult-lawyer.ts` |
| POST | `/services` | 🔑 | Cria atendimento (advogado do Protheus) | `core/services/create-service.ts` |
| POST | `/services/external` | 🔑 | Cria atendimento com dados manuais | `core/services/create-service-external.ts` |
| GET | `/services/all` | 🔑 | Lista atendimentos (paginado, filtros) | `core/services/get-all-services.ts` |
| PATCH | `/services/finished/:id` | 🔑 | Finaliza atendimento (dono ou admin) | `core/services/finished-service.ts` |
| DELETE | `/services/cancel/:id` | 🔑 | Cancela (exclui) atendimento em aberto (dono ou admin) | `core/services/cancel-service.ts` |
| GET | `/services/general` | 🔑 | Total geral de atendimentos | `core/services/get-all-quantity-services.ts` |
| GET | `/services/general/agent/day` | 🔑 | Totais de hoje e ontem | `core/services/get-all-quantity-per-day.ts` |
| GET | `/services/general/month` | 🔑 | Totais do mês atual e anterior | `core/services/get-all-quantity-services-in-month.ts` |
| GET | `/services/general/year` | 🔑 | Totais do ano atual e anterior | `core/services/get-all-quantity-services-in-year.ts` |
| GET | `/services/general/agent/:id` | 🔑 | Totais de um funcionário | `core/services/get-all-quantity-services-by-agent.ts` |
| GET | `/services/monthly` | 🔑 | Série Jan–Dez de um ano (depreciada) | `core/services/get-services-by-month-for-chart.ts` |
| GET | `/metrics/services/yearly` | 🔑 | Série anual de atendimentos | `core/metrics/get-services-yearly.ts` |
| GET | `/metrics/services/monthly` | 🔑 | Série mensal de um ano | `core/metrics/get-services-monthly.ts` |
| GET | `/metrics/services/daily` | 🔑 | Série diária de um mês | `core/metrics/get-services-daily.ts` |
| GET | `/metrics/lawyers/top` | 🔑 | Advogados(as) mais atendidos(as) | `core/metrics/get-top-lawyers.ts` |
| GET | `/metrics/agents/top` | 🔑 | Funcionários(as) que mais atenderam | `core/metrics/get-top-agents.ts` |
| GET | `/metrics/report` | 🔑 | Relatório de atendimentos em PDF | `core/metrics/get-services-report.ts` |

Todos os caminhos de arquivo são relativos a `src/http/`.

## Matriz de permissões

| Ação | Público | MEMBER | ADMIN |
|---|:-:|:-:|:-:|
| Login, logout, recuperar/redefinir senha | ✅ | ✅ | ✅ |
| Ver perfil | | ✅ | ✅ |
| Consultar advogado, criar/listar atendimentos | | ✅ | ✅ |
| Finalizar/cancelar atendimento | | só os próprios | ✅ |
| Ver métricas (inclusive de outros funcionários) | | ✅ | ✅ |
| Listar tipos sem paginação | | ✅ | ✅ |
| Criar/listar (paginado)/editar tipos de serviço | | | ✅ |
| Criar/listar/editar/ativar/inativar funcionários | | | ✅ |

Funcionário **inativo** não acessa nenhuma rota 🔑/👑: recebe `401`, mesmo com um
token emitido antes da inativação.

---

## Funcionários e autenticação

### `POST /agents/sessions` 🌐

```json
// body
{ "email": "fulano@oabma.org.br", "password": "min8chars" }
```

| Status | Quando |
|---|---|
| 201 | `{ "token": "<jwt>" }` + `Set-Cookie: @lexhub-auth=<jwt>` (1 dia) |
| 400 | Credenciais inválidas **ou** funcionário inativo |

### `POST /agents/logout` 🌐

Sem corpo. Rota pública e idempotente: responde **sempre** `200` e remove o
cookie (`path=/`, `domain=DOMAIN`), com token válido, expirado ou ausente.
O JWT continua válido até expirar (não há blacklist).

### `GET /agents/profile` 🔑

```json
// 200
{ "agent": { "id": "uuid", "name": "…", "email": "…", "role": "ADMIN" } }
```

`401` se o funcionário do token não existir mais ou estiver inativo.

### `POST /agents/password/recover` 🌐

Body `{ "email": "…" }`. Sempre `200` sem corpo (não revela se o e-mail existe).
Se existir, envia e-mail com código de 6 caracteres válido por ~2 minutos.
Se o Resend recusar o envio, o token é descartado, o erro vai para o log e a
resposta continua `200`.

### `POST /agents/password/reset` 🌐

```json
{ "code": "A1B2C3", "password": "novaSenha123" }
```

| Status | Quando |
|---|---|
| 204 | Senha alterada |
| 400 | Código inválido/expirado, ou nova senha igual à atual |

### `POST /agents` 👑

```json
{ "name": "Fulano", "email": "fulano@oabma.org.br", "password": "senhaProvisoria" }
```

Grava como `MEMBER` e envia e-mail de boas-vindas com a senha provisória, na mesma
transação. `201` · `409` (e-mail duplicado) · `502` (Resend recusou o envio; nada é
gravado) · `500` (falha na gravação; nenhum e-mail sai) · `403` (não admin).

### `GET /agents/all` 👑

Query: `pageIndex` (padrão 1), `name` (contém), `role` (`ADMIN`|`MEMBER`).

```json
// 200
{
  "agents": [
    { "id": "uuid", "name": "…", "email": "…", "role": "MEMBER", "inactive": null }
  ],
  "total": 42
}
```

### `PUT /agents/update/:id` 👑

Body (todos opcionais): `{ "name"?, "email"?, "role"?: "ADMIN"|"MEMBER" }`.
`204` · `404` (não encontrado) · `409` (e-mail em uso) · `403` (não admin).

### `PATCH /agents/inactive/:id` · `PATCH /agents/active/:id` 👑

Sem corpo. Define `inactive = now()` ou `inactive = null`. `204` · `404` (não encontrado) · `403` (não admin).
A inativação vale na hora: a próxima requisição do funcionário recebe `401`.

---

## Tipos de serviço

### `POST /services/types` 👑

Body `{ "name": "Emissão de certidão" }`. `201` · `409` (nome duplicado).

### `GET /services/types/all` 👑

Query: `pageIndex`, `id` (CUID), `name` (contém).

```json
{ "servicesTypes": [{ "id": "cuid", "name": "…" }], "total": 12 }
```

### `GET /services/types/all-wp` 🔑

Todos os tipos em ordem de criação: `{ "servicesTypes": [{ "id", "name" }] }`.

### `PUT /services/types/update/:id` 👑

Body `{ "name": "mín. 6 caracteres" }`. `204` · `400` (nome igual ao atual) · `404` (não encontrado) · `409` (nome em uso).

---

## Advogados e atendimentos

### `POST /services/consult/lawyer` 🔑

Body `{ "oab": "12345" }` (espaços no início e no fim são removidos). Consulta Protheus
(financeiro + cadastro).

| Status | Quando |
|---|---|
| 200 | `{ "name": "Nome do Advogado" }` — adimplente |
| 400 | OAB vazia (ou só com espaços) |
| 409 | Advogado já tem atendimento em aberto (mensagem com quem abriu e quando); o Protheus não é consultado |
| 422 | Inadimplente (mensagem com o nome; inclui data do atendimento excepcional anterior, se houver) |
| 404 | Protheus indisponível ou advogado não encontrado |

### `POST /services` 🔑

```json
{
  "oab": "12345",
  "serviceTypeId": ["cuid1", "cuid2"],
  "observation": "opcional",
  "assistance": "PERSONALLY",   // ou "REMOTE"
  "status": "OPEN"              // aceito, porém ignorado
}
```

Cadastra o advogado a partir do Protheus se ainda não existir localmente. A `oab` é usada
sem espaços no início e no fim.
`201` · `400` (tipo de serviço inexistente ou OAB vazia) · `409` (advogado já tem atendimento
em aberto) · `404` (falha Protheus).
**Não verifica adimplência** — o frontend deve chamar `/services/consult/lawyer` antes.

### `POST /services/external` 🔑

Igual a `POST /services`, mais `name` e `email` do advogado (usados só se a OAB não existir localmente).
Consulta a API financeira e, se inadimplente, grava `lawyers.restrictedServiceCount = now()`.
Também responde `409` se o advogado já tiver atendimento em aberto — antes de cadastrar o
advogado ou marcar `restrictedServiceCount`.

### `GET /services/all` 🔑

Query: `pageIndex`, `oab`, `lawyerName`, `agentName` (contém, case-insensitive), `assistance`, `status`.
Ordem: OPEN primeiro → `finishedAt` desc → `createdAt` desc.

```json
{
  "services": [
    {
      "id": "uuid",
      "assistance": "PERSONALLY",
      "observation": null,
      "status": "OPEN",
      "createdAt": "2025-05-22T13:00:00.000Z",
      "finishedAt": null,
      "lawyer": { "id": "uuid", "name": "…", "oab": "12345", "email": "…" },
      "agent": { "id": "uuid", "name": "…", "email": "…", "role": "MEMBER" },
      "serviceTypes": [{ "serviceType": { "id": "cuid", "name": "…" } }]
    }
  ],
  "total": 230
}
```

### `PATCH /services/finished/:id` 🔑

Somente o funcionário que registrou o atendimento ou um `ADMIN`. As checagens
seguem esta ordem:

| Status | Quando |
|---|---|
| 204 | status → `COMPLETED`, `finishedAt = now()` |
| 404 | atendimento não encontrado |
| 403 | não é o dono nem `ADMIN` |
| 409 | atendimento já finalizado |

### `DELETE /services/cancel/:id` 🔑

Exclui fisicamente um atendimento `OPEN`. Mesma regra e ordem de
`PATCH /services/finished/:id`: `204` · `404` · `403` · `409` (já finalizado).

---

## Métricas (dashboard)

Todas 🔑, contam por `createdAt` (qualquer status). Dias, meses e anos seguem o
fuso `America/Fortaleza` (UTC-3, horário do Maranhão), qualquer que seja o fuso
do servidor.

### Totais (cards atuais do dashboard)

| Rota | Resposta `200` |
|---|---|
| `GET /services/general` | `{ "total": 1234 }` |
| `GET /services/general/agent/day` | `{ "totalTheDay": 12, "totalLastDay": 20 }` |
| `GET /services/general/month` | `{ "totalCurrentMonth": 310, "totalPreviousMonth": 295 }` |
| `GET /services/general/year` | `{ "totalCurrentYear": 2900, "totalPreviousYear": 3100 }` |
| `GET /services/general/agent/:id` | `{ "totalGeneral": 400, "totalOnMonth": 35, "totalOnPreviousMonth": 41 }` |
| `GET /services/monthly?year=` | `[{ "data": "Jan", "services": 80 }, … { "data": "Dez", "services": 0 }]`, meses do ano informado (padrão: atual). **Depreciada**: use `GET /metrics/services/monthly` |

### Parâmetros de período (`/metrics/*`)

| Query | Tipo | Regra |
|---|---|---|
| `year` | inteiro de 2000 a 2100 | opcional |
| `month` | inteiro de 1 a 12 | opcional; sem `year`, usa o ano atual |

Valor fora da faixa → `400`. Nos rankings, sem `year` e `month` vale todo o histórico.

### `GET /metrics/services/yearly` 🔑

```json
{ "years": [{ "year": 2025, "total": 1061 }, { "year": 2026, "total": 840 }] }
```

Do primeiro ano com atendimentos até o atual; anos sem registro vêm com `0`.

### `GET /metrics/services/monthly?year=2026` 🔑

```json
{ "year": 2026, "total": 840, "months": [{ "month": 1, "label": "Jan", "total": 92 }] }
```

Sempre 12 itens (`Jan` a `Dez`). Sem `year`, usa o ano atual.

### `GET /metrics/services/daily?year=2026&month=8` 🔑

```json
{ "year": 2026, "month": 8, "total": 105, "days": [{ "day": 1, "date": "2026-08-01", "total": 3 }] }
```

Um item por dia do mês (28 a 31). Sem `year`/`month`, usa o ano/mês atual.

### `GET /metrics/lawyers/top?year=&month=&limit=` 🔑

```json
{
  "servicesInPeriod": 840,
  "lawyers": [{ "id": "uuid", "name": "…", "oab": "12345", "total": 166 }]
}
```

`limit` de 1 a 50 (padrão 10). Ordem: `total` decrescente e, no empate, nome.
`servicesInPeriod` é o total de atendimentos do período (para a participação %).

### `GET /metrics/agents/top?year=&month=&limit=` 🔑

```json
{ "servicesInPeriod": 840, "agents": [{ "id": "uuid", "name": "…", "total": 282 }] }
```

`limit` de 1 a 20 (padrão 3). Mesma ordem do ranking de advogados; inclui
funcionários inativos.

### `GET /metrics/report?year=&month=` 🔑

Responde `200` com `Content-Type: application/pdf` e
`Content-Disposition: attachment; filename="relatorio-atendimentos-2026-08.pdf"`
(o CORS expõe esse cabeçalho). Sem `month`, é o relatório do ano (padrão: ano
atual). No frontend, baixe com `responseType: 'blob'`.

Conteúdo (A4): cabeçalho com a logo, o período, a data/hora e quem gerou;
indicadores (total do período com variação, período anterior, presencial ×
remoto, total geral); gráfico de barras por dia (mensal) ou por mês (anual); top
10 advogados(as) e top 3 funcionários(as) com a % do período; histórico anual;
notas de metodologia. Com o período em andamento, a comparação usa o mesmo trecho
do período anterior (ex.: 01/01 a 11/09 de 2025).
