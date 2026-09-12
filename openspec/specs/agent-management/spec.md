# agent-management Specification

## Purpose

Gestão do cadastro de funcionários (agents) por administradores: criação com
envio de e-mail de boas-vindas, listagem paginada com filtros, edição de dados e
papel, e ativação/inativação. Inclui o seed do administrador inicial.
## Requirements
### Requirement: Administrador inicial via seed
O sistema SHALL fornecer o seed `prisma/seed/index.ts` (`pnpm prisma db seed`) que MUST criar o funcionário "Gerência de Tecnologia da Informação" com `role = ADMIN`, e-mail `EMAIL_ADMIN_FULL` e senha `PASSWORD_ADMIN_FULL`, somente se ainda não existir funcionário com esse e-mail.

#### Scenario: Primeira execução
- **WHEN** o seed roda em um banco sem o e-mail do administrador
- **THEN** o administrador é criado e o console exibe `Administrador criado com sucesso.`

#### Scenario: Execução repetida
- **WHEN** o seed roda e o administrador já existe
- **THEN** nada é alterado e o console exibe `Administrador já existente na base de dados.`

### Requirement: Criação de funcionário
O sistema SHALL permitir que um administrador crie um funcionário via `POST /agents` com `{ name, email, password }` (senha com mín. 8) e MUST responder `201` sem corpo somente depois que o funcionário estiver gravado e o e-mail de boas-vindas tiver sido aceito pelo Resend.

O novo funcionário MUST ser criado com `role = MEMBER`. O sistema MUST enviar ao novo funcionário o e-mail "🎉 Bem-vindo à equipe!" contendo nome, e-mail, a senha informada (como senha provisória) e o link `WEB_URL`. A gravação e o envio MUST formar uma operação única: se o envio falhar, o funcionário MUST NOT permanecer gravado; se a gravação falhar, o e-mail MUST NOT ser enviado.

#### Scenario: Criação bem-sucedida
- **WHEN** um administrador envia dados válidos com e-mail ainda não cadastrado
- **THEN** o funcionário é gravado como `MEMBER`, o e-mail de boas-vindas é enviado e o sistema responde `201`

#### Scenario: E-mail duplicado
- **WHEN** já existe funcionário com o mesmo e-mail
- **THEN** o sistema responde `409` com `E-mail já cadastrado para outro funcionário.` sem enviar e-mail

#### Scenario: Falha no envio do e-mail
- **WHEN** o Resend recusa ou não conclui o envio do e-mail de boas-vindas (por exemplo, domínio remetente não verificado, limite de envio ou indisponibilidade)
- **THEN** o funcionário não fica gravado e o sistema responde `502` com `Não foi possível enviar o e-mail de boas-vindas. O funcionário não foi cadastrado, tente novamente mais tarde.`
- **AND** o erro devolvido pelo Resend é registrado no log do servidor

#### Scenario: Falha na gravação
- **WHEN** a gravação do funcionário no banco falha
- **THEN** nenhum e-mail é enviado e o sistema responde `500` com `Erro interno do servidor. Tente novamente mais tarde.`

#### Scenario: Solicitante não administrador
- **WHEN** um `MEMBER` chama a rota
- **THEN** o sistema responde `403` com a mensagem de permissão negada

### Requirement: Listagem de funcionários
O sistema SHALL permitir que um administrador liste funcionários via `GET /agents/all` com paginação fixa de 10 itens (`pageIndex`, base 1, padrão 1) e filtros opcionais `name` (contém, sem diferenciar maiúsculas) e `role` (`ADMIN`|`MEMBER`), MUST ordenar do mais recente para o mais antigo e responder `200` com `{ agents: [{ id, name, email, role, inactive }], total }`.

#### Scenario: Filtro por nome
- **WHEN** um administrador consulta `GET /agents/all?name=silva&pageIndex=2`
- **THEN** o sistema retorna até 10 funcionários cujo nome contém "silva", pulando os 10 primeiros, e o `total` de correspondências

#### Scenario: Erro de consulta
- **WHEN** a consulta ao banco falha
- **THEN** o sistema responde `400` com `Não foi possível recuperar os atendimentos. Tente novamente mais tarde.`

### Requirement: Atualização de funcionário
O sistema SHALL permitir que um administrador altere `name`, `email` e/ou `role` de um funcionário via `PUT /agents/update/:id` (id UUID), respondendo `204`, e MUST rejeitar a troca para um e-mail já usado por outro funcionário.

#### Scenario: Atualização válida
- **WHEN** um administrador envia novo nome e papel para um funcionário existente
- **THEN** os dados são atualizados e o sistema responde `204`

#### Scenario: Funcionário inexistente
- **WHEN** o id não corresponde a nenhum funcionário
- **THEN** o sistema responde `404` com `Funcionário não encontrado. Verifique os dados e tente novamente.`

#### Scenario: E-mail em uso
- **WHEN** o novo e-mail já pertence a outro funcionário
- **THEN** o sistema responde `409` com `E-mail já cadastrado. Verifique as informações e tente novamente.`

#### Scenario: Solicitante não administrador
- **WHEN** um `MEMBER` chama a rota
- **THEN** o sistema responde `403` com a mensagem de permissão negada

### Requirement: Inativação e reativação de funcionário
O sistema SHALL permitir que um administrador inative um funcionário via `PATCH /agents/inactive/:id` (grava a data atual em `inactive`) e o reative via `PATCH /agents/active/:id` (grava `inactive = null`), respondendo `204` em ambos. Funcionários inativos MUST NOT conseguir fazer login e MUST ter as sessões abertas recusadas com `401` a partir da requisição seguinte à inativação.

#### Scenario: Inativar
- **WHEN** um administrador inativa um funcionário existente
- **THEN** o campo `inactive` recebe a data/hora atual e o sistema responde `204`

#### Scenario: Sessão aberta do funcionário inativado
- **WHEN** o funcionário inativado faz uma nova requisição com o token que já possuía
- **THEN** o sistema responde `401` com `Seu acesso foi desativado. Procure o administrador do sistema.`

#### Scenario: Reativar
- **WHEN** um administrador reativa um funcionário inativo
- **THEN** o campo `inactive` volta a `null` e o funcionário pode fazer login novamente

#### Scenario: Funcionário inexistente
- **WHEN** o id não corresponde a nenhum funcionário
- **THEN** o sistema responde `404` com `O funcionário não foi encontrado. Verifique os dados informados e tente novamente.`

