# Documentação da API LexHub

Documentação técnica do backend do **LexHub / OAB Atende**, sistema de gestão de
atendimentos a advogados(as) da OAB Seccional Maranhão.

## Guias

| Documento | Conteúdo |
|---|---|
| [arquitetura.md](arquitetura.md) | Stack, estrutura de pastas, padrão de rotas, autenticação, tratamento de erros |
| [api.md](api.md) | Referência de todos os endpoints, permissões, payloads e respostas |
| [modelo-de-dados.md](modelo-de-dados.md) | Diagrama ER, tabelas, enums, histórico de migrations |
| [fluxos-de-negocio.md](fluxos-de-negocio.md) | Atendimento, inadimplência, cadastro e inativação de funcionários, recuperação de senha, métricas |
| [integracoes.md](integracoes.md) | TOTVS Protheus (cadastro e financeiro) e Resend (e-mails) |
| [ambiente-e-deploy.md](ambiente-e-deploy.md) | Variáveis de ambiente, execução local, scripts, CI/CD e operação com pm2 |
| [debitos-tecnicos.md](debitos-tecnicos.md) | Problemas conhecidos com IDs (DT-xx) e sugestões — backlog da atualização |

## Especificações (OpenSpec)

O comportamento esperado do sistema está em [`openspec/specs/`](../openspec/specs/),
no formato do [OpenSpec](https://github.com/Fission-AI/OpenSpec): requisitos com
cenários **WHEN/THEN** que descrevem o comportamento **atual** (linha de base).

| Capacidade | O que cobre |
|---|---|
| [`api-platform`](../openspec/specs/api-platform/spec.md) | Env vars, servidor, Swagger, CORS, rate limit, erros globais |
| [`agent-auth`](../openspec/specs/agent-auth/spec.md) | Login, JWT/cookie, middleware, admin, logout, perfil |
| [`password-recovery`](../openspec/specs/password-recovery/spec.md) | Solicitação e uso do código de redefinição |
| [`agent-management`](../openspec/specs/agent-management/spec.md) | Seed do admin, CRUD de funcionários, ativação/inativação |
| [`service-types`](../openspec/specs/service-types/spec.md) | Catálogo de tipos de serviço |
| [`lawyer-verification`](../openspec/specs/lawyer-verification/spec.md) | Consulta ao Protheus, adimplência, atendimento único ao inadimplente |
| [`service-lifecycle`](../openspec/specs/service-lifecycle/spec.md) | Criação, listagem, finalização e cancelamento de atendimentos |
| [`service-metrics`](../openspec/specs/service-metrics/spec.md) | Indicadores, séries, rankings e relatório PDF do dashboard |

Contexto do projeto e regras de escrita para a IA: [`openspec/config.yaml`](../openspec/config.yaml).

### Fluxo para alterar o sistema

1. **Explorar** (opcional) — `/opsx:explore` para discutir a ideia com o assistente.
2. **Propor** — `/opsx:propose <descrição>` cria `openspec/changes/<nome>/` com
   `proposal.md`, deltas de spec, `design.md` e `tasks.md`.
3. **Revisar** — `openspec show <nome>` / `openspec validate <nome> --strict`.
4. **Implementar** — `/opsx:apply` executa as tarefas marcando o checklist.
5. **Arquivar** — `/opsx:archive` move a change para `openspec/changes/archive/` e
   aplica os deltas nas specs principais.

Comandos úteis: `openspec list`, `openspec list --specs`, `openspec view` (dashboard),
`openspec validate --specs --strict`.

Ao mudar comportamento, atualize também o documento correspondente em `docs/`.
