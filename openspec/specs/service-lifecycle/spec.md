# service-lifecycle Specification

## Purpose

Ciclo de vida de um atendimento (service) prestado a um advogado: criação
(com cadastro automático do advogado a partir do Protheus ou com dados informados
manualmente), listagem com filtros, finalização e cancelamento.

## Requirements

### Requirement: Criação de atendimento com dados do Protheus
O sistema SHALL criar um atendimento via `POST /services` (autenticado) com `{ oab, serviceTypeId: string[] (CUIDs), observation?, assistance: PERSONALLY|REMOTE }`, vinculado ao funcionário do token, com `status = OPEN`, e MUST responder `201` sem corpo.

Se não houver advogado local com a `oab` informada, o sistema MUST buscá-lo na API de dados cadastrais do Protheus e gravá-lo em `lawyers` (nome, registro como `oab`, e-mail). O campo `status` do corpo é aceito mas ignorado.

Esta rota MUST NOT verificar adimplência; a verificação é feita previamente pelo cliente via `POST /services/consult/lawyer`.

#### Scenario: Advogado já cadastrado localmente
- **WHEN** um funcionário registra atendimento para uma OAB já existente em `lawyers`
- **THEN** o atendimento é criado com status `OPEN` sem consultar o Protheus

#### Scenario: Advogado ainda não cadastrado
- **WHEN** a OAB não existe em `lawyers`
- **THEN** o sistema busca o advogado no Protheus, cria o registro local e então cria o atendimento

#### Scenario: Tipo de serviço inexistente
- **WHEN** algum id de `serviceTypeId` não existe
- **THEN** o sistema responde `401` com `Tipo de serviço não encontrado. Verifique as informações e tente novamente.`
- **AND** nenhum atendimento é criado

#### Scenario: Múltiplos tipos
- **WHEN** o corpo traz três ids de tipos válidos
- **THEN** o atendimento é associado aos três tipos na tabela `service_service_types`

### Requirement: Criação de atendimento externo
O sistema SHALL criar um atendimento via `POST /services/external` (autenticado) com `{ oab, name, email, serviceTypeId: string[], observation?, assistance }`, usando nome e e-mail informados manualmente para cadastrar o advogado quando a OAB ainda não existir localmente, e MUST responder `201` sem corpo.

Esta rota é usada quando o advogado não é localizado no Protheus ou para o atendimento excepcional a inadimplente; ela consulta a API financeira e aplica a regra de `restrictedServiceCount` (ver capacidade `lawyer-verification`).

#### Scenario: Advogado novo informado manualmente
- **WHEN** um funcionário envia OAB, nome e e-mail de um advogado inexistente em `lawyers`
- **THEN** o advogado é criado com esses dados e o atendimento é registrado com status `OPEN`

#### Scenario: Advogado já existente
- **WHEN** a OAB já existe em `lawyers`
- **THEN** nome e e-mail enviados são ignorados e o registro existente é usado

### Requirement: Listagem de atendimentos
O sistema SHALL listar atendimentos via `GET /services/all` (autenticado) com paginação de 10 itens (`pageIndex`, padrão 1) e filtros opcionais `oab`, `lawyerName`, `agentName` (contém, sem diferenciar maiúsculas), `assistance` e `status`, e MUST responder `200` com `{ services, total }`.

Cada item MUST conter `id, assistance, observation, status, createdAt, finishedAt`, `lawyer { id, name, oab, email }`, `agent { id, name, email, role }` e `serviceTypes [{ serviceType { id, name } }]`. A ordenação MUST ser: `status` crescente (OPEN antes de COMPLETED), depois `finishedAt` decrescente, depois `createdAt` decrescente.

Todos os funcionários veem os atendimentos de todos os funcionários.

#### Scenario: Atendimentos em aberto primeiro
- **WHEN** existem atendimentos OPEN e COMPLETED
- **THEN** os OPEN aparecem antes dos COMPLETED na listagem

#### Scenario: Filtro por advogado
- **WHEN** um funcionário consulta `GET /services/all?lawyerName=maria&status=COMPLETED`
- **THEN** o sistema retorna apenas atendimentos finalizados de advogados cujo nome contém "maria"

#### Scenario: Falha na consulta
- **WHEN** a consulta ao banco falha
- **THEN** o sistema responde `400` com mensagem de erro ao recuperar os atendimentos

### Requirement: Finalização de atendimento
O sistema SHALL finalizar um atendimento via `PATCH /services/finished/:id` (autenticado, id UUID), gravando `status = COMPLETED` e `finishedAt` com a data/hora atual, e MUST responder `204`. Qualquer funcionário autenticado pode finalizar qualquer atendimento.

#### Scenario: Finalizar atendimento aberto
- **WHEN** um funcionário finaliza um atendimento com status `OPEN`
- **THEN** o status passa a `COMPLETED`, `finishedAt` é preenchido e o sistema responde `204`

#### Scenario: Atendimento já finalizado
- **WHEN** o atendimento já está `COMPLETED`
- **THEN** o sistema responde `401` com `O atendimento já foi finalizado. Verifique os dados e tente novamente.`

#### Scenario: Atendimento inexistente
- **WHEN** o id não existe
- **THEN** o sistema responde `401` com `O atendimento não foi encontrado. Verifique os dados e tente novamente.`

### Requirement: Cancelamento de atendimento em aberto
O sistema SHALL cancelar um atendimento via `DELETE /services/cancel/:id` (autenticado, id UUID) somente enquanto estiver `OPEN`, MUST excluir fisicamente o registro (e, em cascata, seus vínculos com tipos) e responder `204`. Qualquer funcionário autenticado pode cancelar qualquer atendimento em aberto.

#### Scenario: Cancelar atendimento aberto
- **WHEN** um funcionário cancela um atendimento `OPEN`
- **THEN** o atendimento e seus vínculos em `service_service_types` são removidos e o sistema responde `204`

#### Scenario: Cancelar atendimento finalizado
- **WHEN** o atendimento está `COMPLETED`
- **THEN** o sistema responde `401` com `O serviço solicitado já foi finalizado...` e nada é removido
