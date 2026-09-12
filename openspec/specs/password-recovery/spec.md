# password-recovery Specification

## Purpose

Permitir que um funcionário redefina a própria senha sem estar autenticado,
por meio de um código de 6 caracteres enviado por e-mail (Resend).
## Requirements
### Requirement: Solicitação de recuperação de senha
O sistema SHALL receber `POST /agents/password/recover` com `{ email }` (rota pública) e MUST sempre responder `200` sem corpo, independentemente de o e-mail existir, para não revelar quais e-mails estão cadastrados.

Quando o e-mail pertence a um funcionário, o sistema MUST:
1. gerar um código de 6 caracteres (`A-Z0-9`) e gravá-lo na tabela `tokens` com `type = PASSWORD_RECOVER`;
2. enviar o e-mail "🔄 Redefinição de Senha - OAB Atende" (remetente `oabatende@oabma.org.br`) com o código e o link `${WEB_URL}/reset-password?code=<código>`;
3. agendar, em memória do processo (`setTimeout`), a exclusão do token após 2 minutos.

Fora de produção, o e-mail é enviado para um endereço fixo de desenvolvedor e o código é impresso no console.

#### Scenario: E-mail cadastrado
- **WHEN** é solicitada a recuperação para o e-mail de um funcionário existente
- **THEN** o sistema cria o token, envia o e-mail com código e link e responde `200`

#### Scenario: E-mail não cadastrado
- **WHEN** é solicitada a recuperação para um e-mail inexistente
- **THEN** o sistema responde `200` sem criar token nem enviar e-mail

#### Scenario: Expiração do código
- **WHEN** passam 2 minutos desde a criação do token e o processo não foi reiniciado
- **THEN** o token é excluído do banco e o código deixa de ser aceito

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

