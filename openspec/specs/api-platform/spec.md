# api-platform Specification

## Purpose

Comportamentos transversais da API LexHub: inicialização do servidor, configuração
por variáveis de ambiente, documentação OpenAPI, CORS, limitação de taxa e o
tratamento global de erros. Todas as demais capacidades dependem destas regras.
## Requirements
### Requirement: Validação das variáveis de ambiente na inicialização
O sistema SHALL validar as variáveis de ambiente com Zod ao iniciar (`src/http/_env/index.ts`) e MUST abortar a inicialização lançando um erro quando alguma variável obrigatória estiver ausente ou inválida.

Variáveis: `NODE_ENV` (`development`|`production`, padrão `development`), `PORT` (número, padrão `3892`), `DATABASE_URL` (URL), `PASSWORD_ADMIN_FULL` (mín. 8), `EMAIL_ADMIN_FULL` (e-mail), `JWT_SECRET` (mín. 8), `RESEND_API_KEY`, `WEB_URL` (URL), `DOMAIN` (padrão `localhost`), `API_PROTHEUS_DATA_URL` (URL), `API_PROTHEUS_FIN_URL` (URL).

#### Scenario: Variável obrigatória ausente
- **WHEN** o processo é iniciado sem `JWT_SECRET` definido
- **THEN** o sistema registra no console o erro de validação formatado
- **AND** lança `Houve um erro ao carregar as variáveis de ambiente.` sem abrir a porta HTTP

#### Scenario: Valores padrão
- **WHEN** `PORT`, `NODE_ENV` e `DOMAIN` não são definidos
- **THEN** o sistema usa `3892`, `development` e `localhost` respectivamente

### Requirement: Servidor HTTP
O sistema SHALL escutar em `0.0.0.0` na porta `PORT` e MUST registrar todas as rotas na raiz (sem prefixo de versão).

#### Scenario: Inicialização bem-sucedida
- **WHEN** as variáveis de ambiente são válidas
- **THEN** o servidor escuta em `0.0.0.0:<PORT>` e imprime a mensagem de sucesso no console

### Requirement: Documentação OpenAPI
O sistema SHALL gerar a especificação OpenAPI a partir dos schemas Zod das rotas e MUST expor a interface Swagger UI em `/docs`, declarando o esquema de segurança `bearerAuth` (HTTP bearer, JWT).

#### Scenario: Acesso à documentação
- **WHEN** um cliente acessa `GET /docs`
- **THEN** o sistema retorna a Swagger UI com as rotas agrupadas pelas tags `agents`, `services`, `servicesTypes` e `servicesExternal`

### Requirement: CORS
O sistema SHALL aceitar requisições cross-origin apenas da origem `WEB_URL`, com `credentials: true`, métodos `GET, POST, PATCH, PUT, DELETE` e cabeçalhos `Content-Type` e `Authorization`.

#### Scenario: Origem permitida
- **WHEN** o frontend hospedado em `WEB_URL` envia uma requisição com cookies
- **THEN** o sistema responde com os cabeçalhos CORS que permitem a origem e credenciais

### Requirement: Limitação de taxa
O sistema SHALL limitar cada chave de cliente (IP da requisição, padrão do `@fastify/rate-limit`) a 1000 requisições por minuto e MUST responder `429` com a mensagem `Limite de requisições excedido. Tente novamente mais tarde.` quando o limite for excedido.

#### Scenario: Limite excedido
- **WHEN** um mesmo IP realiza a 1001ª requisição dentro de um minuto
- **THEN** o sistema responde `429` com a mensagem de limite excedido

### Requirement: Tratamento global de erros
O sistema SHALL converter erros lançados pelas rotas em respostas JSON `{ message }` segundo a tabela abaixo, avaliada nesta ordem, e MUST registrar no console apenas os erros não mapeados.

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
| `statusCode === 429` | 429 | mensagem de limite excedido |
| `AxiosError` (qualquer falha nas APIs Protheus) | 404 | `Consulta indisponível ou advogado(a) não encontrado...` |
| Qualquer outro | 500 | `Erro interno do servidor. Tente novamente mais tarde.` |

O status `401` MUST significar exclusivamente sessão inválida (token ausente, inválido ou expirado, ou funcionário inexistente ou inativo) e MUST ser produzido apenas pelo middleware de autenticação. Recursos inexistentes, duplicidades, falta de permissão e regras de negócio MUST usar `404`, `409`, `403` e `422`, respectivamente.

#### Scenario: Corpo inválido
- **WHEN** uma rota recebe um corpo que não satisfaz o schema Zod
- **THEN** o sistema responde `400` com a mensagem `Houve um erro na validação, verifique os dados enviados.`, sem detalhar os campos

#### Scenario: Falha na integração Protheus
- **WHEN** uma chamada axios a uma API Protheus falha (timeout, 4xx ou 5xx)
- **THEN** o sistema responde `404` com a mensagem de consulta indisponível ou advogado não encontrado

#### Scenario: Erro de domínio com status específico
- **WHEN** uma rota lança `ConflictError('E-mail já cadastrado para outro funcionário.')`
- **THEN** o sistema responde `409` com `{ message: 'E-mail já cadastrado para outro funcionário.' }`

#### Scenario: Erro de negócio não encerra a sessão
- **WHEN** uma rota autenticada recusa a operação por recurso inexistente, duplicidade, permissão ou regra de negócio
- **THEN** o status da resposta é diferente de `401`

#### Scenario: Erro inesperado
- **WHEN** ocorre um erro não mapeado (ex.: violação de unicidade do Prisma ou falha de escrita no banco)
- **THEN** o sistema imprime o erro no console e responde `500` com a mensagem genérica

### Requirement: Log de queries em desenvolvimento
O sistema SHALL habilitar o log de queries do Prisma somente quando `NODE_ENV` for `development`.

#### Scenario: Ambiente de produção
- **WHEN** `NODE_ENV=production`
- **THEN** o Prisma Client é criado sem logs de query

