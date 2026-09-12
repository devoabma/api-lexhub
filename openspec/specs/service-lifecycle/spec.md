# service-lifecycle Specification

## Purpose

Ciclo de vida de um atendimento (service) prestado a um advogado: criação
(com cadastro automático do advogado a partir do Protheus ou com dados informados
manualmente), listagem com filtros, finalização e cancelamento.
## Requirements
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
O sistema SHALL finalizar um atendimento via `PATCH /services/finished/:id` (autenticado, id UUID), gravando `status = COMPLETED` e `finishedAt` com a data/hora atual, e MUST responder `204`.

Somente o funcionário que registrou o atendimento (`services.agent_id`) ou um funcionário com `role = ADMIN` MUST poder finalizá-lo. As verificações MUST seguir a ordem: existência (`404`), autorização (`403`), status (`409`).

#### Scenario: Finalizar atendimento aberto próprio
- **WHEN** o funcionário que registrou o atendimento o finaliza com status `OPEN`
- **THEN** o status passa a `COMPLETED`, `finishedAt` é preenchido e o sistema responde `204`

#### Scenario: Administrador finaliza atendimento de outro funcionário
- **WHEN** um `ADMIN` finaliza um atendimento `OPEN` registrado por outro funcionário
- **THEN** o atendimento é finalizado e o sistema responde `204`

#### Scenario: Membro tenta finalizar atendimento de outro funcionário
- **WHEN** um `MEMBER` tenta finalizar um atendimento registrado por outro funcionário
- **THEN** o sistema responde `403` com `Somente o funcionário que registrou o atendimento ou um administrador pode finalizá-lo.`
- **AND** o atendimento não é alterado

#### Scenario: Atendimento já finalizado
- **WHEN** o dono ou um administrador tenta finalizar um atendimento já `COMPLETED`
- **THEN** o sistema responde `409` com `O atendimento já foi finalizado. Verifique os dados e tente novamente.`

#### Scenario: Atendimento inexistente
- **WHEN** o id não existe
- **THEN** o sistema responde `404` com `O atendimento não foi encontrado. Verifique os dados e tente novamente.`

### Requirement: Cancelamento de atendimento em aberto
O sistema SHALL cancelar um atendimento via `DELETE /services/cancel/:id` (autenticado, id UUID) somente enquanto estiver `OPEN`, MUST excluir fisicamente o registro (e, em cascata, seus vínculos com tipos) e responder `204`.

Somente o funcionário que registrou o atendimento ou um funcionário com `role = ADMIN` MUST poder cancelá-lo. As verificações MUST seguir a ordem: existência (`404`), autorização (`403`), status (`409`).

#### Scenario: Cancelar atendimento aberto próprio
- **WHEN** o funcionário que registrou o atendimento o cancela com status `OPEN`
- **THEN** o atendimento e seus vínculos em `service_service_types` são removidos e o sistema responde `204`

#### Scenario: Administrador cancela atendimento de outro funcionário
- **WHEN** um `ADMIN` cancela um atendimento `OPEN` registrado por outro funcionário
- **THEN** o atendimento é removido e o sistema responde `204`

#### Scenario: Membro tenta cancelar atendimento de outro funcionário
- **WHEN** um `MEMBER` tenta cancelar um atendimento registrado por outro funcionário
- **THEN** o sistema responde `403` com `Somente o funcionário que registrou o atendimento ou um administrador pode cancelá-lo.`
- **AND** nada é removido

#### Scenario: Cancelar atendimento finalizado
- **WHEN** o dono ou um administrador tenta cancelar um atendimento `COMPLETED`
- **THEN** o sistema responde `409` com `O serviço solicitado já foi finalizado...` e nada é removido

#### Scenario: Atendimento inexistente
- **WHEN** o id não existe
- **THEN** o sistema responde `404` com `O serviço solicitado não foi localizado em nossa base de dados...`

