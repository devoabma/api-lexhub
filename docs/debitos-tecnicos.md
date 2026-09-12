# Débitos técnicos e riscos conhecidos

Levantamento feito na leitura completa do código em set/2026 (último commit
funcional: `4b3deb4`, mai/2025). Serve de backlog para a atualização do sistema.
Ao propor uma mudança no OpenSpec, cite o ID (ex.: "resolve DT-02").

**Severidade:** 🔴 alta · 🟠 média · 🟡 baixa · ✅ resolvido · ◐ parcial

| ID | Sev. | Tema | Resumo |
|---|:-:|---|---|
| [DT-01](#dt-01) | 🔴 | Segurança | Senha provisória em texto no e-mail e sem troca obrigatória |
| [DT-02](#dt-02) | 🔴 | Segurança | Código de recuperação: expiração em memória, reutilizável, pode derrubar o processo |
| [DT-03](#dt-03) | ✅ | Segurança | ~~Inativação e logout não revogam o JWT~~ (change `harden-auth-and-error-contract`) |
| [DT-04](#dt-04) | 🟠 | Segurança | Login revela que um e-mail existe (mensagem de inativo) |
| [DT-05](#dt-05) | 🟠 | Segurança | Rate limit por IP sem `trustProxy` e sem limite específico em login/recuperação |
| [DT-06](#dt-06) | 🟡 | Segurança | Swagger público em produção |
| [DT-07](#dt-07) | 🟡 | Segurança | bcrypt com custo 8 |
| [DT-08](#dt-08) | 🟠 | Segurança | E-mail pessoal do desenvolvedor fixo no código |
| [DT-10](#dt-10) | 🔴 | Negócio | "Atendimento único" ao inadimplente não é garantido pela API |
| [DT-11](#dt-11) | ✅ | Negócio | ~~Gráfico mensal soma todos os anos e carrega a tabela inteira~~ (change `dashboard-metrics-report`) |
| [DT-12](#dt-12) | 🟠 | Negócio | Criação de atendimento sem transação |
| [DT-13](#dt-13) | ◐ | Negócio | `lawyers.email` único quebra com dados do Protheus; OAB sem normalização completa |
| [DT-14](#dt-14) | ✅ | Negócio | ~~E-mail de boas-vindas enviado antes de gravar o funcionário~~ (change `tratar-falha-envio-email`) |
| [DT-15](#dt-15) | ◐ | Negócio | ~~Qualquer funcionário finaliza/cancela atendimento de outro~~; cancelamento sem auditoria |
| [DT-16](#dt-16) | ✅ | Negócio | ~~Métricas dependem do fuso horário do servidor~~ (change `dashboard-metrics-report`) |
| [DT-17](#dt-17) | 🟡 | Negócio | Admin pode rebaixar/inativar a si mesmo (ou o último admin) |
| [DT-20](#dt-20) | ✅ | API | ~~Status HTTP inconsistentes (401 para "não encontrado" e regras de negócio)~~ |
| [DT-21](#dt-21) | ◐ | API | `try/catch` que engolem a causa; checagens sem efeito |
| [DT-22](#dt-22) | 🟡 | API | Erro de validação sem detalhes dos campos |
| [DT-23](#dt-23) | 🟠 | API | Protheus: sem timeout, e toda falha vira 404 |
| [DT-24](#dt-24) | ◐ | API | Mensagens com erros de cópia, espaços iniciais e `console.log` esquecido |
| [DT-25](#dt-25) | 🟡 | API | Rotas fora do padrão REST e sem versionamento |
| [DT-30](#dt-30) | 🔴 | Engenharia | Nenhum teste automatizado |
| [DT-31](#dt-31) | 🟠 | Engenharia | CI faz deploy em PR; sem lint/typecheck; actions antigas |
| [DT-32](#dt-32) | 🟡 | Engenharia | `tsconfig` com alias quebrado e `baseUrl` deprecado; alterações não commitadas |
| [DT-33](#dt-33) | 🟡 | Engenharia | Dependências e scripts de qualidade |
| [DT-34](#dt-34) | 🟠 | Engenharia | Sem healthcheck, sem logs estruturados, sem observabilidade |
| [DT-35](#dt-35) | 🟡 | Engenharia | Arquivos soltos na raiz |
| [DT-36](#dt-36) | 🟡 | Dados | Nomes inconsistentes no schema Prisma |
| [DT-37](#dt-37) | ✅ | Dados | ~~Falta índice em `services.created_at`~~ (change `dashboard-metrics-report`) |
| [DT-38](#dt-38) | ◐ | Dados | Consultas N+1 ~~e sequenciais~~ |

---

## Segurança

<a id="dt-01"></a>
### DT-01 🔴 Senha provisória em texto e sem troca obrigatória

`create-account.ts` envia a senha escolhida pelo admin em texto no e-mail de boas-vindas.
O e-mail afirma que a redefinição é obrigatória, mas nada força isso (não existe flag
`mustChangePassword`).
**Sugestão:** enviar link de definição de senha (reaproveitando o fluxo de token) em vez
da senha; ou adicionar `mustChangePassword` e bloquear rotas até a troca.

<a id="dt-02"></a>
### DT-02 🔴 Código de recuperação de senha

Em `request-password-recover.ts` / `reset-password.ts`:
- a expiração de 2 min é um `setTimeout` em memória — se o processo reiniciar (deploy, pm2)
  nesse intervalo, o token **nunca expira**;
- o token **não é apagado após o uso**; o mesmo código redefine a senha várias vezes até expirar;
- `setTimeout(async () => prisma.token.delete(...))` sem `catch`: se o token já não existir,
  a rejeição não tratada pode **derrubar o processo** (comportamento padrão do Node ≥ 15);
- o código usa `Math.random` (não criptográfico); colisão com código existente gera 500;
- tokens antigos do mesmo funcionário não são invalidados ao pedir um novo.
**Sugestão:** validar expiração por `createdAt` no reset, apagar o token (e os demais do agent)
ao usar, gerar com `crypto.randomInt`, limpar expirados em job/consulta.

<a id="dt-03"></a>
### DT-03 ✅ Inativação e logout não revogam sessão

**Resolvido** pela change `harden-auth-and-error-contract`:
- o middleware busca o funcionário a cada requisição (uma consulta, memoizada) e recusa
  com `401` quem não existe mais ou está inativo. A inativação vale na próxima requisição;
- o papel usado na autorização vem do banco;
- `POST /agents/logout` é público e idempotente: sempre limpa o cookie, mesmo com o token
  expirado.

Continua valendo: o JWT é stateless. Um token de funcionário **ativo** segue válido até
expirar (1 dia), mesmo após o logout, se tiver sido copiado.

<a id="dt-04"></a>
### DT-04 🟠 Enumeração de usuários no login

`authenticate.ts` verifica `inactive` antes da senha e responde "O funcionário está inativo",
revelando que o e-mail existe mesmo com senha errada.
**Sugestão:** conferir a senha primeiro e só então informar a inatividade.

<a id="dt-05"></a>
### DT-05 🟠 Rate limit

`fastify()` é criado sem `trustProxy`; atrás do NGINX `request.ip` tende a ser o IP do proxy,
então o limite de 1000 req/min pode ser **compartilhado por todos os usuários**. Não há limite
mais rígido para `/agents/sessions` e `/agents/password/*` (força bruta).
**Sugestão:** `fastify({ trustProxy: true })` (confirmando a configuração do NGINX) e
`config.rateLimit` por rota nas rotas públicas.

<a id="dt-06"></a>
### DT-06 🟡 Swagger público em produção

`/docs` expõe todas as rotas e schemas. A rota pública `/agents/password/recover` também está
marcada com `security: bearerAuth` no schema (só documentação).
**Sugestão:** registrar o Swagger apenas fora de produção ou protegê-lo.

<a id="dt-07"></a>
### DT-07 🟡 bcrypt com custo 8

`hash(password, 8)` em criação e reset. **Sugestão:** custo 10–12 (hashes antigos seguem válidos).

<a id="dt-08"></a>
### DT-08 🟠 E-mail do desenvolvedor fixo

`request-password-recover.ts` envia para `hilquiasfmelo@hotmail.com` quando `NODE_ENV !== 'production'`
(marcado com `FIXME`). Se produção subir com `NODE_ENV` errado, códigos de redefinição de
funcionários reais vão para um e-mail pessoal.
**Sugestão:** variável `MAIL_DEV_REDIRECT` opcional ou só logar o código em dev.

## Regras de negócio

<a id="dt-10"></a>
### DT-10 🔴 Regra do "atendimento único" ao inadimplente

- `POST /services` não consulta adimplência — depende de o frontend chamar `/services/consult/lawyer` antes;
- `POST /services/external` marca `restrictedServiceCount` mas **não bloqueia** se já estiver marcado;
- o campo nunca é limpo quando o advogado regulariza a situação (um futuro débito já nasce bloqueado com data antiga);
- o nome `restrictedServiceCount` sugere contador, mas guarda uma data (e a coluna não segue snake_case).
**Sugestão:** mover a regra para o servidor (checar adimplência e restrição em ambas as rotas de criação),
definir com o negócio a política de "reset" e renomear para algo como `exceptional_service_at`.
Confirmar a regra com a área de negócio antes de implementar.

<a id="dt-11"></a>
### DT-11 ✅ Gráfico mensal

**Resolvido** pela change `dashboard-metrics-report`: `GET /services/monthly` conta só o ano
de `?year=` (padrão: ano atual) e agrega no banco (`extract(month ...)` + `GROUP BY`), sem
trazer linhas para o Node. A rota ficou depreciada em favor de `GET /metrics/services/monthly`.

Antes: `groupBy(['createdAt'])` devolvia uma linha por atendimento (a tabela inteira em
memória) e a soma por `getMonth()` misturava os anos (Jan/2025 + Jan/2026).

<a id="dt-12"></a>
### DT-12 🟠 Criação de atendimento sem transação

`create-service.ts` e `create-service-external.ts` criam o advogado, o atendimento e os
vínculos em operações separadas. Falha no meio deixa atendimento sem tipos ou advogado criado
sem atendimento (no externo, o advogado é criado antes mesmo de validar os tipos).
**Sugestão:** `prisma.$transaction` + `services.create({ data: { serviceTypes: { createMany } } })`.

<a id="dt-13"></a>
### DT-13 ◐ Unicidade de e-mail de advogado e formato da OAB

`lawyers.email` é `UNIQUE`. Se o Protheus devolver e-mail vazio ou compartilhado, o segundo
advogado não pode ser cadastrado (erro Prisma P2002 → 500). A OAB passou a ser usada sem
espaços no início e no fim (change `atendimento-aberto-unico-e-trim-oab`), mas segue sem
outra normalização, permitindo duplicatas lógicas ("12345" × "12.345").
Dados do advogado local nunca são atualizados a partir do Protheus.
**Sugestão:** remover unicidade do e-mail, normalizar OAB, atualizar nome/e-mail no atendimento.

<a id="dt-14"></a>
### DT-14 ✅ Ordem e-mail × gravação no cadastro de funcionário

**Resolvido** pela change `tratar-falha-envio-email`: gravação e envio do e-mail de boas-vindas
ficam na mesma transação, com o `create` primeiro. Se o Resend recusar o envio, o cadastro é
desfeito e a API responde `502`; se a gravação falhar, nenhum e-mail sai.

Antes: o e-mail saía antes do `prisma.agent.create` (credenciais de um funcionário inexistente
se a gravação falhasse) e, como o SDK do Resend não lança, uma falha de envio passava em
silêncio com `201`.

<a id="dt-15"></a>
### DT-15 ◐ Autorização e auditoria de atendimentos

**Parcial** (change `harden-auth-and-error-contract`): finalizar e cancelar ficam restritos ao
funcionário que registrou o atendimento ou a um `ADMIN` (`403` para os demais), a mesma regra
que o frontend usa nos botões.
Resta: o cancelamento é `DELETE` físico, sem registro de quem cancelou, e as métricas de
qualquer funcionário são visíveis a todos.
**Sugestão:** definir a política com o negócio; considerar status `CANCELED` + `canceledBy`.

<a id="dt-16"></a>
### DT-16 ✅ Fuso horário das métricas

**Resolvido** pela change `dashboard-metrics-report`: todas as métricas usam o fuso
`America/Fortaleza` (`src/lib/dayjs.ts` + `src/utils/metrics/period.ts`), qualquer que seja o
fuso do processo ou da sessão do banco. Antes, com o servidor em UTC, "hoje" virava às 21h no
Maranhão.

Resta: `consult-lawyer.ts` formata a data do atendimento excepcional com `dayjs()` no fuso do
processo (com o servidor em UTC, um registro feito após as 21h aparece com o dia seguinte).

<a id="dt-17"></a>
### DT-17 🟡 Autogestão de administradores

Um admin pode trocar o próprio papel para `MEMBER` ou se inativar, inclusive sendo o último admin.
O campo `status` no corpo de `POST /services` é aceito e ignorado.

## Contrato da API

<a id="dt-20"></a>
### DT-20 ✅ Status HTTP inconsistentes

**Resolvido** pela change `harden-auth-and-error-contract` (**BREAKING** no contrato HTTP; o
frontend atual só lê `response.data.message` e não é afetado):
- `401` passou a ser exclusivo do middleware (sessão inválida, funcionário inexistente ou
  inativo);
- novas classes `ForbiddenError` (403), `NotFoundError` (404), `ConflictError` (409) e
  `UnprocessableEntityError` (422). O inadimplente responde `422`; perfil sem funcionário
  responde `401`.

Mapa completo por endpoint no `design.md` da change e em [api.md](api.md).

<a id="dt-21"></a>
### DT-21 ◐ Tratamento de erros nas rotas

**Parcial**: os `try/catch` que convertiam falhas de escrita em `401` foram removidos
(`active-agent`, `inactive-agent`, `update-agent`, `update-type-service`, `finished-service` e
`cancel-service`), assim como o de `create-account` (change `tratar-falha-envio-email`); a
falha segue para o handler global (`500`, com log).
Restam os `try/catch` das listagens, que descartam o erro original e lançam `BadRequestError`
genérico, e checagens como `if (!agents)` sobre arrays, que nunca são verdadeiras.

<a id="dt-22"></a>
### DT-22 🟡 Erros de validação sem detalhes

Com `validatorCompiler` do `fastify-type-provider-zod`, erros de schema caem no ramo
`error.validation`, que responde só a mensagem genérica; o ramo `ZodError` (com `fieldErrors`)
praticamente não é atingido. **Sugestão:** incluir `error.validation` na resposta.

<a id="dt-23"></a>
### DT-23 🟠 Integração Protheus frágil

Clientes axios sem `timeout` (uma API lenta prende a requisição), e qualquer `AxiosError`
vira 404 "advogado não encontrado" — inclusive indisponibilidade (deveria ser 502/503).
`consult-lawyer` faz duas chamadas sequenciais que poderiam ser paralelas. `idOrg=10` fixo no código.

<a id="dt-24"></a>
### DT-24 ◐ Mensagens e resíduos

- ~~`active-agent.ts`: erro diz "Não foi possível **inativar**"~~ (o `try/catch` foi removido);
- `get-all.ts` (funcionários): erro fala em "atendimentos";
- várias mensagens começam com espaço (já corrigido na mensagem de validação e no padrão de
  `UnauthorizedError`);
- ~~`console.log({ formattedLawyerRestrictionService })` em `consult-lawyer.ts`~~ (removido);
- summary "Inactivação" em `inactive-agent.ts`; comentários copiados incorretos.

<a id="dt-25"></a>
### DT-25 🟡 Desenho das rotas

Verbos no caminho (`/agents/update/:id`, `/services/finished/:id`, `/services/cancel/:id`),
`/services/general/agent/day` convive com `/services/general/agent/:id` (funciona pela
precedência de rotas estáticas, mas é frágil e o nome engana: conta todos os funcionários),
e não há prefixo de versão. Qualquer mudança é **BREAKING** para o frontend.

## Engenharia

<a id="dt-30"></a>
### DT-30 🔴 Sem testes

Não há testes unitários, de integração ou e2e. **Sugestão:** Vitest + `app.inject()` do Fastify
com banco PostgreSQL de teste e mocks de Protheus/Resend. As specs em `openspec/specs/`
já descrevem cenários prontos para virar casos de teste.

<a id="dt-31"></a>
### DT-31 🟠 Pipeline de CI/CD

- roda também em `pull_request` e o job inclui os passos de deploy → um PR pode ir para produção;
- sem lint, typecheck (tsup não checa tipos) ou testes antes do deploy;
- `actions/checkout@v3`, `setup-node@v3`, `scp-action@v0.1.7`, `ssh-action@v1.0.3` desatualizadas;
- build feito no CI **e** `pnpm install` completo no servidor;
- sem rollback automatizado.

<a id="dt-32"></a>
### DT-32 🟡 TypeScript

- `paths: { "@/*": ["./src/*"] }` combinado com `baseUrl: ./src` resolve para `src/src/*` (alias inútil);
- o projeto depende de `baseUrl` para imports como `'lib/prisma'`, opção deprecada no TypeScript 6;
- **alterações locais não commitadas** (no início desta documentação): `ignoreDeprecations: "6.0"` no
  `tsconfig.json` e import relativo no `prisma/seed/index.ts` — sinal de que o ambiente local já está
  em TS 6 e o seed não resolvia o `baseUrl`. Com o TypeScript 5.8 do projeto, esse valor faz o
  `pnpm tsc --noEmit` falhar com `TS5103` antes de checar o código (use
  `pnpm tsc --noEmit --ignoreDeprecations 5.0` até resolver);
- `include` aponta para `@types/*.d.ts`, que não existe (o augment está em `src/http/_types`).
**Sugestão:** migrar para `paths` explícitos (`"@/*": ["./*"]`) ou subpath imports (`#lib/*`) do Node.

<a id="dt-33"></a>
### DT-33 🟡 Dependências e scripts

- `@biomejs/biome` está em `dependencies` (deveria ser `devDependencies`); Biome 1.9 com série 2.x disponível;
- `biome.json` ignora o VCS; sem scripts `lint`, `format`, `typecheck`, `test`;
- versões de mar–mai/2025 (Prisma 6, Zod 3, `fastify-type-provider-zod` 4, React Email 0.0.x) — avaliar upgrades em conjunto;
- sem `engines`/`.nvmrc` fixando a versão do Node.

<a id="dt-34"></a>
### DT-34 🟠 Observabilidade

Logger do Fastify desabilitado; erros 500 só vão para `console.error` (comentário "Enviar erro para
alguma plataforma de observabilidade" pendente). Sem rota `/health` para o pm2/NGINX/monitoramento.

<a id="dt-35"></a>
### DT-35 🟡 Arquivos soltos

`preview-email.ts` e `preview.html` na raiz (não versionados); `docker-compose.yml` está no
`.gitignore` enquanto `docker-compose-example.yml` usa outra imagem (bitnami) e nomes genéricos.

## Dados

<a id="dt-36"></a>
### DT-36 🟡 Nomenclatura no schema Prisma

Model `Services` no plural (demais no singular), campo `ServiceTypes.updateAt` (typo de `updatedAt`),
`restrictedServiceCount` sem `@map` (coluna camelCase entre colunas snake_case), ids `cuid` em
`service_types` e `uuid` nas demais tabelas. Renomear models/campos Prisma sem alterar colunas é
seguro (via `@map`); alterar colunas exige migration.

<a id="dt-37"></a>
### DT-37 ✅ Índice em `services.created_at`

**Resolvido** pela change `dashboard-metrics-report`: `@@index([createdAt])`, migration
`20260911180000_adicionado_indice_created_at_em_services`.

<a id="dt-38"></a>
### DT-38 ◐ Consultas N+1 e sequenciais

**Parcial**: as rotas de métricas passaram a fazer os `count`s em paralelo (change
`dashboard-metrics-report`). Resta a validação de tipos com um `findUnique` por id (use
`findMany({ where: { id: { in } } })`) e os vínculos criados um a um.
