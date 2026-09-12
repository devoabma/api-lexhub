## Why

Dois problemas no registro de atendimentos:

- A OAB é usada exatamente como digitada. Um espaço antes ou depois do número
  (`" 22158 "`) vai para o Protheus e para as buscas locais, e a consulta falha
  como se o advogado não existisse (DT-13, parcial).
- Nada impede abrir um segundo atendimento para um advogado que já está sendo
  atendido. O mesmo advogado pode acumular vários atendimentos `OPEN`, abertos
  por funcionários diferentes, o que distorce as métricas e deixa atendimentos
  esquecidos em aberto.

## What Changes

- **Normalização da OAB**: `POST /services/consult/lawyer`, `POST /services` e
  `POST /services/external` passam a remover espaços no início e no fim da `oab`
  antes de qualquer uso (Protheus, busca e gravação). OAB vazia após a remoção é
  rejeitada com `400` (validação).
- **Um atendimento em aberto por advogado**: se o advogado já tiver um
  atendimento `OPEN` (de qualquer funcionário), a consulta e as duas rotas de
  criação respondem `409` com uma mensagem que identifica o advogado, quem abriu
  o atendimento e quando, orientando a finalizar ou cancelar antes de abrir
  outro. A verificação acontece antes de consultar o Protheus e antes de qualquer
  gravação — no atendimento externo, uma tentativa bloqueada não marca
  `restrictedServiceCount`.
- A regra fica na API, não no frontend: as rotas de criação também verificam,
  mesmo que o cliente pule a consulta.

**BREAKING (contrato HTTP)**: as três rotas ganham a resposta `409`. O frontend
atual não quebra — exibe `response.data.message` na consulta (alerta) e na
criação (toast).

Fora do escopo: normalização completa da OAB (pontuação, zeros à esquerda —
restante do DT-13), regra do atendimento único ao inadimplente (DT-10),
transação na criação do atendimento (DT-12) e restrição no banco contra
atendimentos em aberto duplicados.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `lawyer-verification`: a consulta remove espaços da OAB e responde `409`
  quando o advogado já tem atendimento em aberto.
- `service-lifecycle`: as rotas de criação (com dados do Protheus e externa)
  removem espaços da OAB e recusam com `409` a abertura de um segundo
  atendimento em aberto para o mesmo advogado.

## Impact

- **Código**: `src/http/core/services/{consult-lawyer,create-service,create-service-external}.ts`
  e um helper novo em `src/utils/services/`.
- **Banco**: sem mudança de schema e sem migration. Uma consulta a mais por
  requisição nas três rotas (`services` filtrado por `status` e advogado, ambos
  indexados).
- **Frontend (web-lexhub)**: nenhuma alteração obrigatória. Como correção trivial,
  o formulário de consulta ganha `.trim()` na OAB (os formulários de criação já
  tinham), feita diretamente no repositório do frontend.
- **Operação**: um atendimento esquecido em aberto passa a bloquear novos
  atendimentos do mesmo advogado até que o dono ou um administrador o finalize
  ou cancele.
- **Documentação**: `docs/api.md`, `docs/fluxos-de-negocio.md` e
  `docs/debitos-tecnicos.md` (DT-13).
