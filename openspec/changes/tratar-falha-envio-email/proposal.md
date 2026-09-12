## Why

No SDK `resend` 4.x, `resend.emails.send()` não lança exceção quando o envio
falha: devolve `{ data, error }`. As duas rotas que enviam e-mail ignoram o
`error`, então toda falha passa em silêncio. Isso ficou evidente quando o
remetente usava `oabma.com.br`, domínio não verificado no Resend (já corrigido
para `oabma.org.br`): `POST /agents` respondia `201` e gravava o funcionário sem
que o e-mail com a senha provisória tivesse saído, e `POST /agents/password/recover`
gravava o token de um código que nunca chegou a ninguém. Além disso, o cadastro
envia o e-mail **antes** de gravar, então uma falha de gravação entrega
credenciais que não existem (DT-14).

## What Changes

- **Envio de e-mail**: novo helper em `src/lib/resend.ts` que chama o Resend e
  **lança** um erro quando `error` vem preenchido, para que nenhuma rota consiga
  ignorar a falha.
- **Cadastro de funcionário** (`POST /agents`): gravação do funcionário e envio do
  e-mail de boas-vindas passam a ser uma operação única (transação). Se o Resend
  falhar, o funcionário **não** é gravado e a API responde `502` com mensagem
  própria; se a gravação falhar, nenhum e-mail é enviado. Resolve DT-14.
  **BREAKING (contrato HTTP)**: a falha de envio passa de `400` (quando era
  detectada) para `502`, e a falha de gravação passa de `400` para `500` (handler
  global). O frontend atual não é afetado — o formulário exibe
  `response.data.message`, nunca o status.
- O `try/catch` de `create-account`, que descartava a causa e devolvia um `400`
  genérico, é removido (DT-21, parcial).
- **Recuperação de senha** (`POST /agents/password/recover`): o token só fica
  gravado se o e-mail for aceito pelo Resend. Em caso de falha, o token é
  descartado, o erro é registrado no log do servidor e a resposta continua `200`
  — a rota segue sem revelar quais e-mails estão cadastrados.
- **Erros de domínio**: novo `BadGatewayError` (`502`) para falhas de provedores
  externos, com o erro registrado no log antes da resposta.

Fora do escopo: senha provisória em texto no e-mail (DT-01), expiração e
reutilização do código de recuperação (DT-02), e-mail fixo do desenvolvedor fora
de produção (DT-08), enumeração no login (DT-04), fila ou reenvio automático de
e-mails.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `agent-management`: criação de funcionário atômica com o envio do e-mail;
  falha de envio responde `502` sem gravar; falha de gravação não envia e-mail.
- `password-recovery`: falha no envio do código descarta o token, é registrada
  no log e mantém a resposta `200`.
- `api-platform`: handler global passa a mapear `BadGatewayError` para `502`,
  registrando o erro no log.

## Impact

- **Código**: `src/lib/resend.ts` (helper de envio), `src/http/_errors/`
  (`bad-gateway-error.ts` e handler), `src/http/core/agents/create-account.ts` e
  `src/http/core/agents/request-password-recover.ts`.
- **Banco**: sem mudança de schema e sem migration. O cadastro e a solicitação de
  recuperação passam a usar transação interativa do Prisma, que fica aberta
  durante a chamada ao Resend.
- **Frontend (web-lexhub)**: nenhuma alteração necessária. O cadastro já exibe a
  mensagem da API em toast; a recuperação continua recebendo `200`.
- **Operação**: falhas do Resend passam a aparecer no log do pm2.
- **Documentação**: `docs/api.md`, `docs/fluxos-de-negocio.md`,
  `docs/integracoes.md`, `docs/debitos-tecnicos.md` (DT-14 e DT-21), `CLAUDE.md`
  e o `context` de `openspec/config.yaml` (lista de erros de domínio).
- **Ordem de arquivamento**: as deltas de `agent-management` e `api-platform`
  partem da versão da change `harden-auth-and-error-contract`, ainda não
  arquivada; ela precisa ser arquivada antes desta.
