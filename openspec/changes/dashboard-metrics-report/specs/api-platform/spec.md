## MODIFIED Requirements

### Requirement: CORS
O sistema SHALL aceitar requisições cross-origin apenas da origem `WEB_URL`, com `credentials: true`, métodos `GET, POST, PATCH, PUT, DELETE` e cabeçalhos `Content-Type` e `Authorization`, e MUST expor o cabeçalho de resposta `Content-Disposition`.

#### Scenario: Origem permitida
- **WHEN** o frontend hospedado em `WEB_URL` envia uma requisição com cookies
- **THEN** o sistema responde com os cabeçalhos CORS que permitem a origem e credenciais

#### Scenario: Nome do arquivo de um download
- **WHEN** o frontend em `WEB_URL` baixa o relatório em PDF
- **THEN** a resposta inclui `Access-Control-Expose-Headers: Content-Disposition`, e o frontend consegue ler o nome do arquivo
