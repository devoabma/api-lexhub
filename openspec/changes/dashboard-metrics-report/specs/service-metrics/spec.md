## ADDED Requirements

### Requirement: Parâmetros de período das métricas
O sistema SHALL aceitar nas rotas de `/metrics` os parâmetros de query opcionais `year` (inteiro de 2000 a 2100) e `month` (inteiro de 1 a 12). Quando `month` for informado sem `year`, o sistema MUST usar o ano atual. Valores fora da faixa ou não numéricos MUST resultar em `400` com a mensagem de validação.

#### Scenario: Mês sem ano
- **WHEN** um funcionário consulta `GET /metrics/lawyers/top?month=3` em 2026
- **THEN** o ranking considera março de 2026

#### Scenario: Mês inválido
- **WHEN** um funcionário consulta `GET /metrics/services/daily?month=13`
- **THEN** o sistema responde `400` com `Houve um erro na validação, verifique os dados enviados.`

### Requirement: Série anual de atendimentos
O sistema SHALL retornar via `GET /metrics/services/yearly` `{ years: [{ year, total }] }` com um item por ano, do primeiro ano com atendimentos até o ano atual, em ordem crescente, com `total = 0` nos anos sem registro. Sem atendimentos na base, MUST retornar apenas o ano atual com `total = 0`.

#### Scenario: Ano sem atendimentos no meio da série
- **WHEN** existem atendimentos em 2024 e 2026, nenhum em 2025, e a consulta é feita em 2026
- **THEN** o sistema responde `200` com três itens, 2024, 2025 (`total: 0`) e 2026

### Requirement: Série mensal de um ano
O sistema SHALL retornar via `GET /metrics/services/monthly` `{ year, total, months: [{ month, label, total }] }`, com 12 itens (`month` de 1 a 12, `label` de `Jan` a `Dez`) contando os atendimentos de cada mês do ano informado em `?year=` (padrão: ano atual), e `total` igual à soma dos meses.

#### Scenario: Ano informado
- **WHEN** existem 50 atendimentos em janeiro de 2025 e 30 em janeiro de 2026, e o funcionário consulta `?year=2026`
- **THEN** o item `Jan` retorna `total: 30`

#### Scenario: Sem ano
- **WHEN** a consulta é feita em setembro de 2026 sem `year`
- **THEN** o sistema responde `200` com `year: 2026`

### Requirement: Série diária de um mês
O sistema SHALL retornar via `GET /metrics/services/daily` `{ year, month, total, days: [{ day, date, total }] }`, com um item para cada dia do mês (28 a 31) e `date` no formato `YYYY-MM-DD`. Sem `year`, MUST usar o ano atual; sem `month`, o mês atual.

#### Scenario: Fevereiro de ano bissexto
- **WHEN** um funcionário consulta `?year=2024&month=2`
- **THEN** o sistema responde `200` com 29 itens em `days`

### Requirement: Ranking de advogados mais atendidos
O sistema SHALL retornar via `GET /metrics/lawyers/top` `{ servicesInPeriod, lawyers: [{ id, name, oab, total }] }` com os advogados(as) com mais atendimentos no período (sem `year` e `month`, todo o histórico), em ordem decrescente de `total` e, em empate, crescente de nome. `limit` MUST ter padrão 10 e aceitar de 1 a 50. `servicesInPeriod` MUST ser o total de atendimentos do período.

#### Scenario: Top 10 do ano
- **WHEN** um funcionário consulta `?year=2026`
- **THEN** o sistema responde `200` com até 10 advogados(as) ordenados pelo número de atendimentos em 2026

#### Scenario: Empate
- **WHEN** dois advogados têm o mesmo número de atendimentos no período
- **THEN** aparece primeiro o de nome anterior na ordem alfabética

### Requirement: Ranking de funcionários que mais atenderam
O sistema SHALL retornar via `GET /metrics/agents/top` `{ servicesInPeriod, agents: [{ id, name, total }] }` com os funcionários(as) que registraram mais atendimentos no período, com as mesmas regras de período e desempate do ranking de advogados. `limit` MUST ter padrão 3 e aceitar de 1 a 20. Funcionários inativos MUST continuar no ranking pelos atendimentos que registraram.

#### Scenario: Top 3 do mês
- **WHEN** um funcionário consulta `?year=2026&month=8`
- **THEN** o sistema responde `200` com os 3 funcionários(as) com mais atendimentos em agosto de 2026 e `servicesInPeriod` igual ao total do mês

### Requirement: Relatório de atendimentos em PDF
O sistema SHALL gerar via `GET /metrics/report` um PDF A4, respondido com `200`, `Content-Type: application/pdf` e `Content-Disposition: attachment; filename="relatorio-atendimentos-<ano>[-<mês>].pdf"`. Sem `month`, o relatório cobre o ano informado em `year` (padrão: ano atual); com `month`, o mês. O documento MUST conter: identificação da OAB Maranhão, período, data e hora de geração e nome do funcionário que o gerou; total do período com a variação sobre o período anterior; total do período anterior; divisão presencial/remoto; total geral do sistema; gráfico de barras por dia (relatório mensal) ou por mês (relatório anual); top 10 advogados(as) e top 3 funcionários(as) do período com participação percentual; histórico anual; e notas sobre o critério de contagem.

#### Scenario: Relatório mensal
- **WHEN** um funcionário solicita `?year=2026&month=8`
- **THEN** o sistema responde o PDF `relatorio-atendimentos-2026-08.pdf`, com o gráfico por dia de agosto e a comparação com julho de 2026

#### Scenario: Relatório do ano em andamento
- **WHEN** um funcionário solicita o relatório de 2026 em 11/09/2026
- **THEN** o período aparece como parcial e a comparação usa o mesmo trecho de 2025 (01/01 a 11/09)

#### Scenario: Período anterior sem registros
- **WHEN** o período anterior não tem atendimentos
- **THEN** o relatório informa que não há base de comparação, sem exibir variação percentual

#### Scenario: Sem autenticação
- **WHEN** a requisição não tem sessão válida
- **THEN** o sistema responde `401`

## MODIFIED Requirements

### Requirement: Fuso horário dos períodos
O sistema SHALL calcular os limites de dia, mês e ano de todas as métricas no fuso `America/Fortaleza` (UTC-3, horário do Maranhão), independentemente do fuso do processo Node.js e do fuso da sessão do banco de dados.

#### Scenario: Servidor em UTC
- **WHEN** o processo roda em UTC e um atendimento é criado às 22h30 de 31/08 no Maranhão (01h30 UTC de 01/09)
- **THEN** o atendimento é contado em 31 de agosto, no mês de agosto

#### Scenario: Virada de ano
- **WHEN** um atendimento é criado às 23h59 de 31/12/2025 no Maranhão (02h59 UTC de 01/01/2026)
- **THEN** o atendimento é contado em 2025

### Requirement: Série mensal para gráfico
O sistema SHALL retornar via `GET /services/monthly` um array de 12 posições `[{ data: 'Jan'|'Fev'|...|'Dez', services: number }]`, em que `services` MUST ser a contagem de atendimentos daquele mês no ano informado em `?year=` (padrão: ano atual). A rota MUST ser marcada como depreciada na documentação OpenAPI em favor de `GET /metrics/services/monthly`.

#### Scenario: Base com dois anos de dados
- **WHEN** existem 50 atendimentos em janeiro de 2025 e 30 em janeiro de 2026, e a consulta é feita em 2026 sem `year`
- **THEN** a posição `Jan` retorna `services: 30`

#### Scenario: Falha na consulta
- **WHEN** a agregação no banco falha
- **THEN** o sistema responde `500` pelo handler global e registra a falha no log
