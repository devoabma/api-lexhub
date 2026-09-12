## Context

O envio de e-mail usa o SDK `resend` 4.x (`src/lib/resend.ts`). Nessa versão,
`resend.emails.send()` resolve com `{ data, error }` e só rejeita em falhas
inesperadas do próprio SDK; erros da API do Resend (domínio não verificado,
`validation_error`, `rate_limit_exceeded`, chave inválida etc.) chegam em `error`.

Hoje:

- `create-account.ts` envia o e-mail e depois grava o funcionário, dentro de um
  `try/catch` que troca qualquer exceção por `BadRequestError` genérico. Como o
  Resend não lança, a falha de envio nunca chega ao `catch`: o funcionário é
  gravado e a rota responde `201`. Uma falha de gravação, por outro lado, ocorre
  depois de o e-mail já ter saído (DT-14).
- `request-password-recover.ts` grava o token, envia o e-mail sem olhar `error`,
  agenda a exclusão em 2 minutos e responde `200`.

Não há testes automatizados; a verificação é manual.

## Goals / Non-Goals

**Goals:**

- Nenhuma rota consegue ignorar uma falha de envio do Resend.
- Cadastro de funcionário sem estado inconsistente: ou o funcionário existe e
  recebeu o e-mail, ou nenhum dos dois.
- Recuperação de senha sem token de um código que ninguém recebeu, mantendo a
  proteção contra enumeração de e-mails.
- Falhas do Resend visíveis no log do servidor (pm2).

**Non-Goals:**

- Fila, outbox ou reenvio automático de e-mails.
- Mudar o conteúdo dos e-mails, a senha provisória em texto (DT-01) ou o
  redirecionamento para o e-mail do desenvolvedor fora de produção (DT-08).
- Corrigir expiração/reutilização do código de recuperação (DT-02).
- Plataforma de observabilidade; o log continua sendo `console.error`.

## Decisions

### 1. Helper `sendEmail` que lança em caso de erro

`src/lib/resend.ts` passa a exportar `sendEmail(options)` e a classe
`EmailDeliveryError`. O helper chama `resend.emails.send()` e, se `error` vier
preenchido, lança `EmailDeliveryError` com `name` e `message` do Resend; caso
contrário devolve `data`. As rotas deixam de chamar `resend.emails.send()`
diretamente.

- *Por quê*: converte o contrato `{ data, error }` para exceção num único ponto;
  um e-mail novo não pode esquecer a checagem.
- *Alternativa*: checar `error` em cada rota. Rejeitada — é exatamente o
  descuido que causou o problema.
- `EmailDeliveryError` fica em `lib/` (não é erro HTTP); cada rota decide o que
  a falha significa para ela.

### 2. Cadastro: transação interativa englobando gravação e envio

```
prisma.$transaction(async tx => {
  await tx.agent.create(...)      // falhou → nada foi enviado
  await sendEmail(...)            // lançou → rollback do create
}, { timeout: 15_000 })
```

`EmailDeliveryError` é capturado fora da transação e convertido em
`BadGatewayError` (`502`) com a mensagem da spec. Qualquer outro erro segue para
o handler global (`500`, com log). O `try/catch` genérico atual é removido
(DT-21, parcial).

- *Por quê*: a atomicidade vem do banco; a gravação acontece primeiro (DT-14) e
  o rollback desfaz o cadastro quando o envio falha.
- *Alternativa*: gravar, enviar e, se falhar, apagar o funcionário
  (compensação). Rejeitada — se o `delete` falhar, sobra um funcionário sem
  e-mail, e há uma janela em que ele existe e pode fazer login.
- *Alternativa*: outbox/fila com reenvio. Rejeitada por ora — exige tabela,
  worker e monitoramento, desproporcional ao volume (cadastros esporádicos).
- `timeout: 15_000`: o padrão do Prisma (5 s) é curto para uma chamada HTTP
  externa em dia ruim; 15 s cobre a latência normal do Resend (< 1 s) com folga.

### 3. Recuperação: mesma transação, falha engolida com log

```
try {
  code = await prisma.$transaction(async tx => {
    const { code } = await tx.token.create(...)
    await sendEmail(...)
    return code
  }, { timeout: 15_000 })
} catch (err) {
  if (!(err instanceof EmailDeliveryError)) throw err
  console.error(...)              // token já foi desfeito pelo rollback
  return reply.status(200).send()
}
// agenda o setTimeout só após o commit
```

- *Por quê* `200`: a spec exige resposta idêntica para e-mail cadastrado ou não.
  Responder `502` apenas quando o e-mail existe criaria um oráculo de enumeração
  sempre que o Resend falhasse (e um atacante consegue provocar
  `rate_limit_exceeded`). Decisão confirmada com o responsável.
- *Custo*: o funcionário não é avisado da falha; vê a tela "e-mail enviado",
  não recebe nada e tenta de novo. A TI enxerga a falha no log.
- Erros que não são de envio (ex.: colisão do código, falha de banco) continuam
  indo para o handler global (`500`), como hoje.

### 4. `BadGatewayError` (502) no contrato de erros

Novo `src/http/_errors/bad-gateway-error.ts`, mapeado no `errorHandler` para
`502` com `{ message }`. Como a causa não chega ao cliente, o handler registra o
erro com `console.error` antes de responder (o mesmo tratamento dado ao `500`).

- *Por quê* `502`: a requisição do cliente era válida; quem falhou foi o
  provedor externo. `400` (atual) culpa o cliente; `500` esconde que é uma falha
  de dependência e usa mensagem genérica.
- *Alternativa*: `503`. Descartada — `503` indica indisponibilidade do próprio
  serviço; `502` descreve resposta inválida de um upstream, que é o caso.

## Risks / Trade-offs

- [Transação aberta durante a chamada HTTP ao Resend] → mantém uma conexão do
  pool e a linha inserida bloqueada por até 15 s. Aceitável: os dois fluxos são
  raros e o pool atende o resto da API. Se virar problema, migrar para outbox.
- [Resend demora mais que o timeout] → a transação é desfeita e a rota responde
  `500`, mas o e-mail ainda pode sair depois → o funcionário recebe credenciais
  inexistentes (mesmo efeito do DT-14, agora só em caso extremo). Mitigação: o
  admin repete o cadastro; o e-mail duplicado não bloqueia porque o registro não
  foi gravado.
- [E-mail aceito e commit falha] → mesmo efeito do item anterior; improvável,
  pois o `insert` já passou nas restrições dentro da transação.
- [Corrida entre dois cadastros com o mesmo e-mail] → a segunda transação falha
  na restrição única (`P2002`) e responde `500` em vez de `409`. Pré-existente;
  a checagem prévia cobre o caso normal.
- [Recuperação silenciosa para o usuário] → decisão consciente (seção 3); a
  observabilidade depende de alguém olhar o log do pm2.

## Migration Plan

- Sem migration Prisma e sem variável de ambiente nova; o deploy por push em
  `main` (CI → pm2 restart) basta.
- Arquivar `harden-auth-and-error-contract` **antes** desta change: as deltas de
  `agent-management` e `api-platform` aqui partem da versão dela.
- Rollback: reverter o commit; não há dado a desfazer.

## Open Questions

Nenhuma.
