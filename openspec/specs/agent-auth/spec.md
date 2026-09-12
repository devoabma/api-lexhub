# agent-auth Specification

## Purpose

Autenticação e autorização dos funcionários (agents) da OAB que operam o sistema:
login com e-mail e senha, emissão de JWT (cookie httpOnly e corpo da resposta),
logout e as verificações usadas por todas as rotas protegidas.
## Requirements
### Requirement: Login de funcionário
O sistema SHALL autenticar um funcionário via `POST /agents/sessions` com `email` (e-mail válido) e `password` (mín. 8 caracteres) e MUST, em caso de sucesso, responder `201` com `{ token }` e definir o cookie `@lexhub-auth` contendo o mesmo token.

O JWT MUST conter `sub` (id do agent) e `role`, e MUST expirar em 1 dia. O cookie MUST ser `httpOnly`, `path=/`, `sameSite=lax`, `domain=DOMAIN`, `maxAge` de 1 dia e `secure` somente quando `NODE_ENV=production`.

#### Scenario: Credenciais válidas
- **WHEN** um funcionário ativo envia e-mail e senha corretos
- **THEN** o sistema responde `201` com `{ token }`
- **AND** define o cookie `@lexhub-auth` com o token

#### Scenario: E-mail inexistente ou senha incorreta
- **WHEN** o e-mail não está cadastrado ou a senha não confere com o hash bcrypt
- **THEN** o sistema responde `400` com `Credenciais inválidas. Verifique suas informações e tente novamente.`

#### Scenario: Funcionário inativo
- **WHEN** o e-mail pertence a um funcionário com `inactive` preenchido
- **THEN** o sistema responde `400` com `O funcionário está inativo. Procure com o administrador do sistema.`
- **AND** esta verificação ocorre antes da conferência de senha

### Requirement: Obtenção do token nas rotas protegidas
O sistema SHALL aceitar o JWT tanto pelo cookie `@lexhub-auth` (não assinado) quanto pelo cabeçalho `Authorization: Bearer <token>` e MUST disponibilizar em cada requisição de rota protegida os métodos `request.getCurrentAgent()`, que retorna `{ id, role }` do funcionário da sessão, e `request.getCurrentAgentId()`, que retorna apenas o `id`.

Para resolver o funcionário da sessão, o sistema MUST validar o token, buscar o funcionário pelo `sub` no banco e recusar com `401` quando o token for ausente, inválido ou expirado, quando o funcionário não existir ou quando estiver inativo. O papel retornado MUST vir do banco, não do JWT. A consulta MUST ocorrer no máximo uma vez por requisição, mesmo que vários métodos sejam chamados.

`UnauthorizedError` (`401`) MUST ser usado exclusivamente para essas falhas de sessão.

#### Scenario: Token válido
- **WHEN** uma rota protegida chama `getCurrentAgentId()` com token válido e não expirado de um funcionário ativo
- **THEN** o método retorna o id do funcionário

#### Scenario: Token ausente, inválido ou expirado
- **WHEN** a requisição não traz token válido
- **THEN** o sistema responde `401` com `Token inválido ou expirado. Faça login novamente.`

#### Scenario: Funcionário do token não existe
- **WHEN** o `sub` do token não corresponde a nenhum funcionário
- **THEN** o sistema responde `401` com `Token inválido ou expirado. Faça login novamente.`

#### Scenario: Uma consulta por requisição
- **WHEN** uma rota chama `checkIfAgentIsAdmin()` e depois `getCurrentAgentId()`
- **THEN** o funcionário é buscado no banco uma única vez

### Requirement: Verificação de administrador
O sistema SHALL disponibilizar `request.checkIfAgentIsAdmin()`, que resolve o funcionário da sessão (com as mesmas recusas `401` de sessão inválida, inexistente ou inativa) e MUST rejeitar a requisição com `403` quando o papel do funcionário for diferente de `ADMIN`.

O papel é lido do banco de dados (não do JWT).

#### Scenario: Administrador
- **WHEN** o token pertence a um funcionário ativo com `role = ADMIN`
- **THEN** a execução da rota continua

#### Scenario: Membro comum
- **WHEN** o token pertence a um funcionário com `role = MEMBER`
- **THEN** o sistema responde `403` com `Permissão negada. Você precisa ser um administrador para realizar esta ação.`

#### Scenario: Administrador inativo
- **WHEN** o token pertence a um funcionário com `role = ADMIN` e `inactive` preenchido
- **THEN** o sistema responde `401` com `Seu acesso foi desativado. Procure o administrador do sistema.`

#### Scenario: Funcionário removido do banco
- **WHEN** o `sub` do token não corresponde a nenhum funcionário
- **THEN** o sistema responde `401` com `Token inválido ou expirado. Faça login novamente.`

### Requirement: Logout
O sistema SHALL encerrar a sessão via `POST /agents/logout`, rota **pública** e idempotente, que MUST sempre limpar o cookie `@lexhub-auth` com os mesmos atributos do login (`path=/`, `domain=DOMAIN`) e responder `200` sem corpo, com ou sem token válido. O token em si MUST NOT ser invalidado no servidor (JWT stateless).

#### Scenario: Logout com sessão válida
- **WHEN** um funcionário autenticado chama o logout
- **THEN** o sistema responde `200` e remove o cookie de autenticação

#### Scenario: Logout com token expirado
- **WHEN** o logout é chamado com um cookie cujo JWT já expirou
- **THEN** o sistema responde `200` e remove o cookie de autenticação

#### Scenario: Logout sem token
- **WHEN** o logout é chamado sem cookie nem cabeçalho de autorização
- **THEN** o sistema responde `200`

### Requirement: Perfil do funcionário logado
O sistema SHALL retornar, via `GET /agents/profile` (autenticado), `{ agent: { id, name, email, role } }` do funcionário dono do token.

#### Scenario: Perfil encontrado
- **WHEN** um funcionário autenticado e ativo solicita o perfil
- **THEN** o sistema responde `200` com id, nome, e-mail e papel

#### Scenario: Perfil não encontrado
- **WHEN** o funcionário do token não existe mais
- **THEN** o sistema responde `401` com `Token inválido ou expirado. Faça login novamente.`

### Requirement: Revogação do acesso de funcionário inativo
O sistema MUST recusar com `401` qualquer requisição a rota protegida cujo token pertença a um funcionário com `inactive` preenchido, mesmo que o JWT seja válido e não esteja expirado. A recusa MUST valer a partir da primeira requisição após a inativação.

#### Scenario: Funcionário inativado com sessão aberta
- **WHEN** um administrador inativa um funcionário que possui token emitido há menos de 1 dia
- **AND** esse funcionário chama qualquer rota protegida
- **THEN** o sistema responde `401` com `Seu acesso foi desativado. Procure o administrador do sistema.`

#### Scenario: Funcionário reativado
- **WHEN** um funcionário inativado é reativado e ainda possui um token não expirado
- **THEN** as rotas protegidas voltam a aceitar esse token

