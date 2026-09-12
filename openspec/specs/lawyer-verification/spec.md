# lawyer-verification Specification

## Purpose

Consulta de advogados(as) no ERP TOTVS Protheus antes de um atendimento:
obtenção dos dados cadastrais (nome, registro OAB, e-mail) e verificação de
adimplência financeira, incluindo a regra de "atendimento único" concedido a
advogados inadimplentes e registrado em `lawyers.restrictedServiceCount`.
## Requirements
### Requirement: Integração com a API de dados cadastrais do Protheus
O sistema SHALL consultar os dados cadastrais de um advogado via `GET {API_PROTHEUS_DATA_URL}/?idOrg=10&param=<oab>` e MUST interpretar a resposta no formato `{ lawyer: { nome, registro, email } }`.

#### Scenario: Advogado encontrado
- **WHEN** o Protheus retorna o advogado para a OAB consultada
- **THEN** o sistema usa `nome`, `registro` e `email` retornados

#### Scenario: Falha ou advogado inexistente no Protheus
- **WHEN** a chamada falha com erro HTTP ou de rede
- **THEN** o erro axios é convertido pelo handler global em `404` com a mensagem de consulta indisponível ou advogado não encontrado

### Requirement: Integração com a API financeira do Protheus
O sistema SHALL verificar a adimplência via `GET {API_PROTHEUS_FIN_URL}/<oab>` e MUST considerar o advogado adimplente quando o corpo da resposta for truthy e inadimplente quando for vazio/falsy.

#### Scenario: Resposta vazia
- **WHEN** a API financeira responde com corpo vazio para a OAB
- **THEN** o advogado é tratado como inadimplente

### Requirement: Consulta de advogado antes do atendimento
O sistema SHALL expor `POST /services/consult/lawyer` (autenticado) com `{ oab }`, que consulta a API financeira e a de dados cadastrais e MUST responder `200` com `{ name }` quando o advogado estiver adimplente.

Quando inadimplente, o sistema MUST responder `422` com mensagem dirigida ao advogado pelo nome, orientando contato com o Setor Financeiro. Se o advogado já tiver `restrictedServiceCount` preenchido no banco local, a mensagem MUST informar a data (DD/MM/YYYY) em que foi atendido anteriormente.

#### Scenario: Advogado adimplente
- **WHEN** a API financeira confirma adimplência
- **THEN** o sistema responde `200` com o nome do advogado vindo do Protheus

#### Scenario: Inadimplente sem atendimento excepcional anterior
- **WHEN** o advogado está inadimplente e não possui `restrictedServiceCount`
- **THEN** o sistema responde `422` com `Prezado(a) <nome>, não podemos prosseguir com o atendimento. Para mais informações, entre em contato com o Setor Financeiro.`

#### Scenario: Inadimplente já atendido excepcionalmente
- **WHEN** o advogado está inadimplente e possui `restrictedServiceCount` = 10/03/2025
- **THEN** o sistema responde `422` com mensagem que inclui `Advogado(a) atendido(a) anteriormente em 10/03/2025.`

#### Scenario: Inadimplência não encerra a sessão
- **WHEN** o funcionário consulta um advogado inadimplente
- **THEN** a resposta não usa o status `401` e a sessão do funcionário continua válida

### Requirement: Registro do atendimento único ao inadimplente
O sistema SHALL, ao criar um atendimento via `POST /services/external`, consultar a API financeira e MUST gravar a data/hora atual em `lawyers.restrictedServiceCount` quando o advogado estiver inadimplente.

A API MUST NOT bloquear a criação do atendimento externo quando `restrictedServiceCount` já estiver preenchido; o limite de um atendimento por inadimplente depende do fluxo do frontend, que consulta `POST /services/consult/lawyer` antes.

#### Scenario: Primeiro atendimento a inadimplente
- **WHEN** um atendimento externo é criado para um advogado inadimplente
- **THEN** o atendimento é criado e `restrictedServiceCount` recebe a data/hora atual

#### Scenario: Advogado adimplente
- **WHEN** um atendimento externo é criado para um advogado adimplente
- **THEN** `restrictedServiceCount` não é alterado

#### Scenario: Advogado volta a ficar adimplente
- **WHEN** um advogado com `restrictedServiceCount` preenchido regulariza a situação
- **THEN** o campo permanece preenchido (não há rotina de limpeza)

