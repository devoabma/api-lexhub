## MODIFIED Requirements

### Requirement: Consulta de advogado antes do atendimento
O sistema SHALL expor `POST /services/consult/lawyer` (autenticado) com `{ oab }`, que consulta a API financeira e a de dados cadastrais e MUST responder `200` com `{ name }` quando o advogado estiver adimplente.

O sistema MUST remover espaços no início e no fim da `oab` antes de qualquer uso e MUST rejeitar com `400` (erro de validação) uma `oab` vazia após a remoção.

Antes de consultar o Protheus, o sistema MUST verificar se o advogado com a `oab` informada já possui atendimento com `status = OPEN`, registrado por qualquer funcionário. Nesse caso, MUST responder `409` com `O(a) advogado(a) <nome> já possui um atendimento em aberto, registrado por <funcionário> em <DD/MM/YYYY> às <HH:mm>. Finalize ou cancele esse atendimento antes de abrir outro.`, com data e hora no fuso `America/Fortaleza`, sem consultar o Protheus.

Quando inadimplente, o sistema MUST responder `422` com mensagem dirigida ao advogado pelo nome, orientando contato com o Setor Financeiro. Se o advogado já tiver `restrictedServiceCount` preenchido no banco local, a mensagem MUST informar a data (DD/MM/YYYY) em que foi atendido anteriormente.

#### Scenario: Advogado adimplente
- **WHEN** a API financeira confirma adimplência
- **THEN** o sistema responde `200` com o nome do advogado vindo do Protheus

#### Scenario: OAB com espaços
- **WHEN** o funcionário consulta a OAB `"  22158 "`
- **THEN** o sistema consulta o Protheus e o banco local com `22158` e responde como responderia para `22158`

#### Scenario: OAB só com espaços
- **WHEN** o funcionário consulta a OAB `"   "`
- **THEN** o sistema responde `400` com a mensagem genérica de validação, sem consultar o Protheus

#### Scenario: Advogado com atendimento em aberto
- **WHEN** o advogado da OAB consultada possui um atendimento `OPEN` registrado por "Maria" em 12/09/2026 às 14:30
- **THEN** o sistema responde `409` com `O(a) advogado(a) <nome> já possui um atendimento em aberto, registrado por Maria em 12/09/2026 às 14:30. Finalize ou cancele esse atendimento antes de abrir outro.`
- **AND** o Protheus não é consultado

#### Scenario: Atendimento anterior finalizado
- **WHEN** todos os atendimentos do advogado estão `COMPLETED` ou foram cancelados
- **THEN** a consulta segue normalmente para a verificação no Protheus

#### Scenario: Inadimplente sem atendimento excepcional anterior
- **WHEN** o advogado está inadimplente e não possui `restrictedServiceCount`
- **THEN** o sistema responde `422` com `Prezado(a) <nome>, não podemos prosseguir com o atendimento. Para mais informações, entre em contato com o Setor Financeiro.`

#### Scenario: Inadimplente já atendido excepcionalmente
- **WHEN** o advogado está inadimplente e possui `restrictedServiceCount` = 10/03/2025
- **THEN** o sistema responde `422` com mensagem que inclui `Advogado(a) atendido(a) anteriormente em 10/03/2025.`

#### Scenario: Inadimplência não encerra a sessão
- **WHEN** o funcionário consulta um advogado inadimplente
- **THEN** a resposta não usa o status `401` e a sessão do funcionário continua válida
