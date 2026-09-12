## MODIFIED Requirements

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
