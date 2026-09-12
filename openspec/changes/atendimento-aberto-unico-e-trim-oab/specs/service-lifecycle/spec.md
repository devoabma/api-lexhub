## MODIFIED Requirements

### Requirement: Criação de atendimento com dados do Protheus
O sistema SHALL criar um atendimento via `POST /services` (autenticado) com `{ oab, serviceTypeId: string[] (CUIDs), observation?, assistance: PERSONALLY|REMOTE }`, vinculado ao funcionário do token, com `status = OPEN`, e MUST responder `201` sem corpo.

O sistema MUST remover espaços no início e no fim da `oab` antes de qualquer uso e MUST rejeitar com `400` (erro de validação) uma `oab` vazia após a remoção.

Se o advogado com a `oab` informada já possuir atendimento com `status = OPEN`, registrado por qualquer funcionário, o sistema MUST NOT criar o atendimento e MUST responder `409` com a mesma mensagem da consulta de advogado (`O(a) advogado(a) <nome> já possui um atendimento em aberto, registrado por <funcionário> em <DD/MM/YYYY> às <HH:mm>. Finalize ou cancele esse atendimento antes de abrir outro.`). Essa verificação MUST ocorrer antes de consultar o Protheus e antes de qualquer gravação.

Se não houver advogado local com a `oab` informada, o sistema MUST buscá-lo na API de dados cadastrais do Protheus e gravá-lo em `lawyers` (nome, registro como `oab`, e-mail). O campo `status` do corpo é aceito mas ignorado.

Esta rota MUST NOT verificar adimplência; a verificação é feita previamente pelo cliente via `POST /services/consult/lawyer`.

#### Scenario: Advogado já cadastrado localmente
- **WHEN** um funcionário registra atendimento para uma OAB já existente em `lawyers`, sem atendimento em aberto
- **THEN** o atendimento é criado com status `OPEN` sem consultar o Protheus

#### Scenario: Advogado ainda não cadastrado
- **WHEN** a OAB não existe em `lawyers`
- **THEN** o sistema busca o advogado no Protheus, cria o registro local e então cria o atendimento

#### Scenario: OAB com espaços
- **WHEN** o corpo traz `oab = " 22158  "`
- **THEN** o sistema busca, cadastra e vincula o advogado usando `22158`

#### Scenario: Advogado com atendimento em aberto
- **WHEN** o advogado da OAB informada já possui um atendimento `OPEN`, registrado pelo mesmo ou por outro funcionário
- **THEN** o sistema responde `409` com a mensagem de atendimento em aberto
- **AND** nenhum atendimento é criado e o Protheus não é consultado

#### Scenario: Novo atendimento após finalizar ou cancelar
- **WHEN** o atendimento em aberto do advogado é finalizado (`COMPLETED`) ou cancelado
- **THEN** um novo atendimento para o mesmo advogado pode ser criado

#### Scenario: Tipo de serviço inexistente
- **WHEN** algum id de `serviceTypeId` não existe
- **THEN** o sistema responde `400` com `Tipo de serviço não encontrado. Verifique as informações e tente novamente.`
- **AND** nenhum atendimento é criado

#### Scenario: Múltiplos tipos
- **WHEN** o corpo traz três ids de tipos válidos
- **THEN** o atendimento é associado aos três tipos na tabela `service_service_types`

### Requirement: Criação de atendimento externo
O sistema SHALL criar um atendimento via `POST /services/external` (autenticado) com `{ oab, name, email, serviceTypeId: string[], observation?, assistance }`, usando nome e e-mail informados manualmente para cadastrar o advogado quando a OAB ainda não existir localmente, e MUST responder `201` sem corpo.

O sistema MUST remover espaços no início e no fim da `oab` antes de qualquer uso e MUST rejeitar com `400` (erro de validação) uma `oab` vazia após a remoção.

Se o advogado com a `oab` informada já possuir atendimento com `status = OPEN`, o sistema MUST NOT criar o atendimento e MUST responder `409` com a mensagem de atendimento em aberto, antes de cadastrar o advogado, de consultar a API financeira e de alterar `restrictedServiceCount`.

Esta rota é usada quando o advogado não é localizado no Protheus ou para o atendimento excepcional a inadimplente; ela consulta a API financeira e aplica a regra de `restrictedServiceCount` (ver capacidade `lawyer-verification`).

#### Scenario: Advogado novo informado manualmente
- **WHEN** um funcionário envia OAB, nome e e-mail de um advogado inexistente em `lawyers`
- **THEN** o advogado é criado com esses dados e o atendimento é registrado com status `OPEN`

#### Scenario: Advogado já existente
- **WHEN** a OAB já existe em `lawyers` e o advogado não tem atendimento em aberto
- **THEN** nome e e-mail enviados são ignorados e o registro existente é usado

#### Scenario: Advogado com atendimento em aberto
- **WHEN** o advogado da OAB informada já possui um atendimento `OPEN`
- **THEN** o sistema responde `409` com a mensagem de atendimento em aberto
- **AND** nenhum atendimento é criado e `restrictedServiceCount` não é alterado

#### Scenario: Tipo de serviço inexistente
- **WHEN** algum id de `serviceTypeId` não existe
- **THEN** o sistema responde `400` com `Tipo de serviço não encontrado. Verifique os dados e tente novamente.`
