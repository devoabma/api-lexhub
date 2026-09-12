## MODIFIED Requirements

### Requirement: Redefinição de senha com código
O sistema SHALL receber `POST /agents/password/reset` com `{ code, password }` (senha com mín. 8 caracteres, rota pública) e MUST substituir o hash de senha do funcionário dono do token, respondendo `204`.

O token MUST NOT ser removido após o uso (a remoção depende apenas do timer de 2 minutos).

#### Scenario: Código válido e nova senha diferente
- **WHEN** o código existe e a nova senha difere da atual
- **THEN** o sistema grava o novo hash bcrypt (custo 8) e responde `204`

#### Scenario: Código inválido ou expirado
- **WHEN** o código não existe na tabela `tokens`
- **THEN** o sistema responde `400` com `Código de redefinição de senha inválido. Verifique e tente novamente.`

#### Scenario: Nova senha igual à atual
- **WHEN** a nova senha confere com o hash atual
- **THEN** o sistema responde `400` com `A nova senha deve ser diferente da atual. Escolha outra senha e tente novamente.`
