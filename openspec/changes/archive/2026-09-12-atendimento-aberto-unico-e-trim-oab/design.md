## Context

O registro de um atendimento passa por três rotas:

- `POST /services/consult/lawyer` — consulta financeiro e cadastro no Protheus;
- `POST /services` — cria o atendimento, cadastrando o advogado a partir do
  Protheus se ele ainda não existir localmente;
- `POST /services/external` — cria o atendimento com nome e e-mail informados e
  marca `restrictedServiceCount` quando o advogado é inadimplente.

As três recebem `oab: z.string()` sem normalização e nenhuma olha os
atendimentos existentes. O frontend exibe `response.data.message` em qualquer
erro da consulta (alerta no diálogo) e da criação (toast).

`services` já tem índices em `lawyer_id` e `status`.

## Goals / Non-Goals

**Goals:**

- Espaços antes/depois da OAB não afetam consulta, busca nem gravação.
- No máximo um atendimento `OPEN` por advogado, garantido pela API.
- O funcionário bloqueado sabe quem abriu o atendimento pendente e quando.

**Non-Goals:**

- Normalização completa da OAB (pontuação, zeros à esquerda) — restante do DT-13.
- Transação na criação do atendimento (DT-12) e regra do inadimplente (DT-10).
- Restrição no banco (índice único parcial) contra duplicidade concorrente.

## Decisions

### 1. Trim no schema Zod das três rotas

`oab: z.string().trim().min(1)`. O `fastify-type-provider-zod` entrega ao
handler o valor já transformado, então o código das rotas não muda.

- *Por quê*: um único ponto por rota, e a `oab` normalizada vale para Protheus,
  busca local e gravação.
- *Alternativa*: `oab.trim()` no handler. Rejeitada — fácil esquecer em algum uso
  e não rejeita a OAB só com espaços.
- O frontend também passa a fazer trim na consulta (correção trivial no
  web-lexhub), mas a API não depende disso.

### 2. Helper `assertLawyerHasNoOpenService(oab)`

Novo `src/utils/services/assert-no-open-service.ts`:

```
services.findFirst({
  where: { status: 'OPEN', lawyer: { oab } },
  orderBy: { createdAt: 'asc' },
  select: { createdAt, lawyer: { name }, agent: { name } },
})
→ se existir: throw ConflictError(mensagem da spec)
```

Chamado no início das três rotas, logo após obter o funcionário da sessão:
antes do Protheus e antes de qualquer gravação. No externo isso garante que a
tentativa bloqueada não cadastra o advogado nem marca `restrictedServiceCount`.

- *Por quê na consulta*: o funcionário descobre o bloqueio no primeiro passo, sem
  preencher o formulário, e o Protheus não é chamado à toa.
- *Por quê também na criação*: a API não pode depender da ordem do frontend
  (lição do DT-10); as rotas podem ser chamadas diretamente.
- Busca pela relação `lawyer.oab`, não pelo id: se o advogado não existe
  localmente, não há atendimento e a checagem passa sem custo extra.
- Data formatada com `dayjs(...).tz(TIMEZONE)` de `lib/dayjs` (fuso
  `America/Fortaleza`), como as métricas.

### 3. Status `409`

Há um atendimento em aberto: é conflito com o estado atual do recurso, o mesmo
critério de "atendimento já finalizado" (`409`). `422` fica para regra sobre o
advogado em si (inadimplência).

### 4. Sem restrição no banco

Um índice único parcial (`UNIQUE (lawyer_id) WHERE status = 'OPEN'`) garantiria
a regra sob concorrência, mas o schema Prisma 6 não representa índices parciais
sem recurso em preview: o índice ficaria fora do schema e um `migrate dev`
futuro tentaria removê-lo. A checagem na aplicação cobre o uso real (um
advogado é atendido por um funcionário por vez).

## Risks / Trade-offs

- [Dois cadastros simultâneos para o mesmo advogado] → ambos passam na checagem
  e dois `OPEN` são criados. Improvável no uso real; o botão do frontend fica
  desabilitado durante o envio. Se ocorrer, o índice parcial pode ser adotado
  numa change futura.
- [Atendimento esquecido em aberto bloqueia o advogado] → a mensagem informa quem
  abriu e quando; o dono ou um `ADMIN` finaliza ou cancela. Um `MEMBER` que não
  é o dono precisa acionar um deles.
- [OAB gravada em formato diferente do digitado] → `POST /services` grava o
  `registro` devolvido pelo Protheus; se ele diferir da OAB digitada, a checagem
  pela OAB digitada não encontra o atendimento. Pré-existente (DT-13); o trim
  reduz, mas não elimina, esse caso.
- [Dados existentes com vários `OPEN` para o mesmo advogado] → nada é alterado;
  a regra só impede novos. A mensagem cita o mais antigo.

## Migration Plan

- Sem migration Prisma e sem variável de ambiente; deploy normal por push em
  `main`.
- Frontend: nenhuma dependência de ordem de deploy — o `409` já é exibido pela
  mensagem, e o trim no web é independente.
- Rollback: reverter o commit.

## Open Questions

Nenhuma.
