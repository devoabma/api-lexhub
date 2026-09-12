# service-types Specification

## Purpose

Catálogo de tipos de serviço (ex.: "Emissão de certidão", "Orientação jurídica")
usados para classificar cada atendimento. Administradores mantêm o catálogo;
todos os funcionários consultam a lista completa ao registrar atendimentos.

## Requirements

### Requirement: Criação de tipo de serviço
O sistema SHALL permitir que um administrador crie um tipo via `POST /services/types` com `{ name }`, respondendo `201` sem corpo, e MUST rejeitar nomes já existentes (comparação exata). O id do tipo é um CUID.

#### Scenario: Nome novo
- **WHEN** um administrador cria o tipo "Emissão de certidão" inexistente
- **THEN** o tipo é gravado e o sistema responde `201`

#### Scenario: Nome duplicado
- **WHEN** já existe tipo com o mesmo nome
- **THEN** o sistema responde `400` com `Tipo de serviço já cadastrado. Insira um nome único.`

### Requirement: Listagem paginada de tipos de serviço
O sistema SHALL permitir que um administrador liste tipos via `GET /services/types/all` com paginação de 10 itens (`pageIndex`, padrão 1) e filtros opcionais `id` (CUID, igualdade) e `name` (contém, sem diferenciar maiúsculas), MUST ordenar do mais recente para o mais antigo e responder `200` com `{ servicesTypes: [{ id, name }], total }`.

#### Scenario: Busca por nome
- **WHEN** um administrador consulta `GET /services/types/all?name=certid`
- **THEN** o sistema retorna os tipos cujo nome contém "certid" e o total correspondente

#### Scenario: Solicitante não administrador
- **WHEN** um `MEMBER` chama a rota
- **THEN** o sistema responde `401` com a mensagem de permissão negada

### Requirement: Listagem completa de tipos de serviço
O sistema SHALL permitir que qualquer funcionário autenticado obtenha todos os tipos via `GET /services/types/all-wp` (sem paginação), MUST ordenar por data de criação crescente e responder `200` com `{ servicesTypes: [{ id, name }] }`.

#### Scenario: Preenchimento do formulário de atendimento
- **WHEN** um funcionário autenticado abre o formulário de novo atendimento
- **THEN** o sistema retorna todos os tipos na ordem em que foram criados

### Requirement: Atualização de tipo de serviço
O sistema SHALL permitir que um administrador renomeie um tipo via `PUT /services/types/update/:id` (id CUID) com `{ name }` (mín. 6 caracteres), respondendo `204`, e MUST rejeitar nome igual ao atual ou já usado por outro tipo.

#### Scenario: Renomear
- **WHEN** um administrador envia um nome novo e único para um tipo existente
- **THEN** o nome é atualizado e o sistema responde `204`

#### Scenario: Tipo inexistente
- **WHEN** o id não corresponde a nenhum tipo
- **THEN** o sistema responde `401` com `Serviço não encontrado. Verifique as informações e tente novamente.`

#### Scenario: Nome igual ao atual
- **WHEN** o nome enviado é idêntico ao nome atual
- **THEN** o sistema responde `400` com `O nome inserido já está registrado para este serviço...`

#### Scenario: Nome usado por outro tipo
- **WHEN** outro tipo já possui o nome enviado
- **THEN** o sistema responde `401` com `O tipo de serviço informado já existe. Insira um nome único para prosseguir.`

### Requirement: Tipos de serviço não removíveis
O sistema SHALL NOT oferecer rota de exclusão de tipos de serviço, e o banco MUST impedir (`ON DELETE RESTRICT`) a remoção de um tipo vinculado a atendimentos.

#### Scenario: Tentativa de exclusão direta no banco
- **WHEN** alguém tenta apagar um tipo referenciado em `service_service_types`
- **THEN** o PostgreSQL rejeita a operação por violação de chave estrangeira
