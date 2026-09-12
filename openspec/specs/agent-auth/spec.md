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
O sistema SHALL aceitar o JWT tanto pelo cookie `@lexhub-auth` (não assinado) quanto pelo cabeçalho `Authorization: Bearer <token>` e MUST disponibilizar em cada requisição de rota protegida o método `request.getCurrentAgentId()`, que valida o token e retorna o `sub`.

#### Scenario: Token válido
- **WHEN** uma rota protegida chama `getCurrentAgentId()` com token válido e não expirado
- **THEN** o método retorna o id do funcionário

#### Scenario: Token ausente, inválido ou expirado
- **WHEN** a requisição não traz token válido
- **THEN** o sistema responde `401` com `Token inválido ou expirado. Faça login novamente.`

### Requirement: Verificação de administrador
O sistema SHALL disponibilizar `request.checkIfAgentIsAdmin()`, que valida o token, busca o funcionário no banco e MUST rejeitar a requisição com `401` quando o funcionário não existir ou tiver papel `MEMBER`.

O papel é lido do banco de dados (não do JWT); o status de inatividade não é verificado.

#### Scenario: Administrador
- **WHEN** o token pertence a um funcionário com `role = ADMIN`
- **THEN** a execução da rota continua

#### Scenario: Membro comum
- **WHEN** o token pertence a um funcionário com `role = MEMBER`
- **THEN** o sistema responde `401` com `Permissão negada. Você precisa ser um administrador para realizar esta ação.`

#### Scenario: Funcionário removido do banco
- **WHEN** o `sub` do token não corresponde a nenhum funcionário
- **THEN** o sistema responde `401` com `Funcionário não encontrado. Verifique os dados e tente novamente.`

### Requirement: Sessão não revogável por inativação
O sistema SHALL considerar válido, em rotas que usam apenas `getCurrentAgentId()`, qualquer JWT não expirado, MUST NOT consultar o status `inactive` do funcionário nessas rotas.

#### Scenario: Funcionário inativado com sessão aberta
- **WHEN** um administrador inativa um funcionário que possui token emitido há menos de 1 dia
- **THEN** esse token continua aceito pelas rotas que exigem apenas autenticação até expirar

### Requirement: Logout
O sistema SHALL encerrar a sessão via `POST /agents/logout` (autenticado), limpando o cookie `@lexhub-auth` (`path=/`, `domain=DOMAIN`) e respondendo `200` sem corpo. O token em si MUST NOT ser invalidado no servidor (JWT stateless).

#### Scenario: Logout com sessão válida
- **WHEN** um funcionário autenticado chama o logout
- **THEN** o sistema responde `200` e remove o cookie de autenticação

#### Scenario: Funcionário inexistente
- **WHEN** o `sub` do token não corresponde a um funcionário
- **THEN** o sistema responde `400` com a mensagem de funcionário não localizado

### Requirement: Perfil do funcionário logado
O sistema SHALL retornar, via `GET /agents/profile` (autenticado), `{ agent: { id, name, email, role } }` do funcionário dono do token.

#### Scenario: Perfil encontrado
- **WHEN** um funcionário autenticado solicita o perfil
- **THEN** o sistema responde `200` com id, nome, e-mail e papel

#### Scenario: Perfil não encontrado
- **WHEN** o funcionário do token não existe mais
- **THEN** o sistema responde `400` com `Funcionário não encontrado. Verifique os dados e tente novamente.`
