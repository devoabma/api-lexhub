## 1. Pré-requisito

- [x] 1.1 Arquivar a change `harden-auth-and-error-contract` (`/opsx:archive`) e confirmar que `openspec/specs/agent-management/spec.md` e `openspec/specs/api-platform/spec.md` já trazem `409`/`403` e a tabela com `ForbiddenError`…`UnprocessableEntityError`

## 2. Base: erro 502 e envio de e-mail

- [x] 2.1 Criar `src/http/_errors/bad-gateway-error.ts` (`BadGatewayError`), no mesmo padrão de `conflict-error.ts`
- [x] 2.2 Mapear `BadGatewayError` no `errorHandler` (`src/http/_errors/index.ts`) para `502` com `{ message }`, registrando o erro com `console.error` antes de responder
- [x] 2.3 Em `src/lib/resend.ts`, exportar `EmailDeliveryError` e `sendEmail(options)`, que chama `resend.emails.send()` e lança `EmailDeliveryError` (com `name` e `message` do Resend) quando `error` vier preenchido

## 3. Cadastro de funcionário (`POST /agents`)

- [x] 3.1 Em `create-account.ts`, gravar o funcionário e enviar o e-mail via `sendEmail` dentro de `prisma.$transaction(async tx => …, { timeout: 15_000 })`, com o `create` antes do envio
- [x] 3.2 Capturar `EmailDeliveryError` fora da transação e lançar `BadGatewayError('Não foi possível enviar o e-mail de boas-vindas. O funcionário não foi cadastrado, tente novamente mais tarde.')`; remover o `try/catch` genérico e o import de `BadRequestError`

## 4. Recuperação de senha (`POST /agents/password/recover`)

- [x] 4.1 Em `request-password-recover.ts`, criar o token e enviar o e-mail via `sendEmail` dentro de `prisma.$transaction(async tx => …, { timeout: 15_000 })`, devolvendo o código
- [x] 4.2 Capturar apenas `EmailDeliveryError`: registrar com `console.error` e responder `200`; demais erros seguem para o handler global
- [x] 4.3 Agendar o `setTimeout` de exclusão e o log de desenvolvimento somente após o commit da transação

## 5. Verificação

- [x] 5.1 `pnpm tsc --noEmit` e `pnpm biome check src` sem erros
- [x] 5.2 Confirmar que não restou chamada a `resend.emails.send` fora de `src/lib/resend.ts`
- [x] 5.3 Manual, caminho feliz: `POST /agents` com e-mail `delivered@resend.dev` responde `201`, grava o funcionário e o envio aparece no painel do Resend
- [x] 5.4 Manual, falha: com `RESEND_API_KEY` inválida no `.env` local, `POST /agents` responde `502` com a mensagem da spec, o funcionário não é gravado e o erro aparece no console
- [x] 5.5 Manual, falha: com a chave inválida, `POST /agents/password/recover` para um e-mail cadastrado responde `200`, nenhuma linha nova em `tokens` e o erro aparece no console
- [ ] 5.6 Manual: com a chave válida, `POST /agents/password/recover` grava o token, imprime o código no console e o token some após 2 minutos

## 6. Documentação e specs

- [x] 6.1 `docs/api.md`: `POST /agents` com `201` · `409` · `502` (falha no envio, nada gravado) · `500` · `403`; em `POST /agents/password/recover`, registrar que falha de envio não altera a resposta `200`
- [x] 6.2 `docs/fluxos-de-negocio.md`: diagrama 3 (transação: grava, envia, rollback + `502` na falha) e diagrama 5 (falha de envio descarta o token e responde `200`)
- [x] 6.3 `docs/integracoes.md`: seção Resend descrevendo `sendEmail`, `EmailDeliveryError` e onde as falhas aparecem (log do pm2)
- [x] 6.4 `docs/arquitetura.md`: incluir `BadGatewayError` (`502`) na tabela de erros
- [x] 6.5 `CLAUDE.md` e `context` de `openspec/config.yaml`: incluir `BadGatewayError` (502) na lista de erros de domínio
- [x] 6.6 `docs/debitos-tecnicos.md`: marcar DT-14 como resolvido (✅) e atualizar DT-21 (o `try/catch` de `create-account` foi removido)
- [x] 6.7 `openspec validate tratar-falha-envio-email --strict` e `openspec validate --specs --strict` sem erros
