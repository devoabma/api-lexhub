## MODIFIED Requirements

### Requirement: Tratamento global de erros
O sistema SHALL converter erros lançados pelas rotas em respostas JSON `{ message }` segundo a tabela abaixo, avaliada nesta ordem, e MUST registrar no console os erros não mapeados e os `BadGatewayError`.

| Origem do erro | Status | Corpo |
|---|---|---|
| Falha de validação do Fastify (`error.validation`) | 400 | mensagem genérica de validação |
| `ZodError` | 400 | mensagem genérica + `errors` (fieldErrors) |
| `BadRequestError` | 400 | mensagem do erro |
| `UnauthorizedError` | 401 | mensagem do erro (padrão: `Acesso não autorizado, tente novamente.`) |
| `ForbiddenError` | 403 | mensagem do erro |
| `NotFoundError` | 404 | mensagem do erro |
| `ConflictError` | 409 | mensagem do erro |
| `UnprocessableEntityError` | 422 | mensagem do erro |
| `BadGatewayError` | 502 | mensagem do erro (o erro é registrado no console) |
| `statusCode === 429` | 429 | mensagem de limite excedido |
| `AxiosError` (qualquer falha nas APIs Protheus) | 404 | `Consulta indisponível ou advogado(a) não encontrado...` |
| Qualquer outro | 500 | `Erro interno do servidor. Tente novamente mais tarde.` |

O status `401` MUST significar exclusivamente sessão inválida (token ausente, inválido ou expirado, ou funcionário inexistente ou inativo) e MUST ser produzido apenas pelo middleware de autenticação. Recursos inexistentes, duplicidades, falta de permissão e regras de negócio MUST usar `404`, `409`, `403` e `422`, respectivamente. Falhas de um provedor externo que impedem concluir a operação (ex.: envio de e-mail pelo Resend) MUST usar `502`.

#### Scenario: Corpo inválido
- **WHEN** uma rota recebe um corpo que não satisfaz o schema Zod
- **THEN** o sistema responde `400` com a mensagem `Houve um erro na validação, verifique os dados enviados.`, sem detalhar os campos

#### Scenario: Falha na integração Protheus
- **WHEN** uma chamada axios a uma API Protheus falha (timeout, 4xx ou 5xx)
- **THEN** o sistema responde `404` com a mensagem de consulta indisponível ou advogado não encontrado

#### Scenario: Erro de domínio com status específico
- **WHEN** uma rota lança `ConflictError('E-mail já cadastrado para outro funcionário.')`
- **THEN** o sistema responde `409` com `{ message: 'E-mail já cadastrado para outro funcionário.' }`

#### Scenario: Falha de provedor externo
- **WHEN** uma rota lança `BadGatewayError` porque o Resend recusou o envio de um e-mail
- **THEN** o sistema imprime o erro no console e responde `502` com `{ message }` contendo a mensagem do erro

#### Scenario: Erro de negócio não encerra a sessão
- **WHEN** uma rota autenticada recusa a operação por recurso inexistente, duplicidade, permissão ou regra de negócio
- **THEN** o status da resposta é diferente de `401`

#### Scenario: Erro inesperado
- **WHEN** ocorre um erro não mapeado (ex.: violação de unicidade do Prisma ou falha de escrita no banco)
- **THEN** o sistema imprime o erro no console e responde `500` com a mensagem genérica
