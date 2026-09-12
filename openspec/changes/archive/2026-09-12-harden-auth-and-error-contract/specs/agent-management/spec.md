## MODIFIED Requirements

### Requirement: Criação de funcionário
O sistema SHALL permitir que um administrador crie um funcionário via `POST /agents` com `{ name, email, password }` (senha com mín. 8) e MUST responder `201` sem corpo.

O novo funcionário MUST ser criado com `role = MEMBER`. Antes de gravar, o sistema MUST enviar o e-mail "🎉 Bem-vindo à equipe!" ao novo funcionário contendo nome, e-mail, a senha informada (como senha provisória) e o link `WEB_URL`.

#### Scenario: Criação bem-sucedida
- **WHEN** um administrador envia dados válidos com e-mail ainda não cadastrado
- **THEN** o e-mail de boas-vindas é enviado, o funcionário é gravado como `MEMBER` e o sistema responde `201`

#### Scenario: E-mail duplicado
- **WHEN** já existe funcionário com o mesmo e-mail
- **THEN** o sistema responde `409` com `E-mail já cadastrado para outro funcionário.`

#### Scenario: Falha no envio do e-mail ou na gravação
- **WHEN** o envio pelo Resend ou a gravação no banco lança erro
- **THEN** o sistema responde `400` com `Erro ao criar funcionário. Por favor, tente novamente.`

#### Scenario: Solicitante não administrador
- **WHEN** um `MEMBER` chama a rota
- **THEN** o sistema responde `403` com a mensagem de permissão negada

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
