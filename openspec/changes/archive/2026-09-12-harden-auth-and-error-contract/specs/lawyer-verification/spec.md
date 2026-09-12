## MODIFIED Requirements

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
