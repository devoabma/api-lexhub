# service-metrics Specification

## Purpose

Indicadores de volume de atendimentos exibidos no dashboard do frontend: totais
geral, diário, mensal e anual (com comparação ao período anterior), total por
funcionário e série mensal para gráfico. Todas as rotas exigem apenas
autenticação e contam atendimentos pela data de criação (`createdAt`),
independentemente do status.

## Requirements

### Requirement: Fuso horário dos períodos
O sistema SHALL calcular os limites de dia, mês e ano com dayjs no fuso horário local do processo Node.js (sem fuso explícito configurado na aplicação).

#### Scenario: Servidor em UTC
- **WHEN** o processo roda com fuso UTC e um atendimento é criado às 22h de Brasília (01h UTC do dia seguinte)
- **THEN** o atendimento é contado no dia seguinte

### Requirement: Total geral de atendimentos
O sistema SHALL retornar via `GET /services/general` `{ total }` com a contagem de todos os atendimentos existentes.

#### Scenario: Consulta do total
- **WHEN** um funcionário autenticado consulta o total geral
- **THEN** o sistema responde `200` com o número total de registros em `services`

### Requirement: Totais do dia atual e do dia anterior
O sistema SHALL retornar via `GET /services/general/agent/day` `{ totalTheDay, totalLastDay }` com as contagens de atendimentos criados entre 00:00 e 23:59:59.999 de hoje e de ontem, considerando todos os funcionários.

#### Scenario: Comparação diária
- **WHEN** foram criados 12 atendimentos hoje e 20 ontem
- **THEN** o sistema responde `200` com `{ totalTheDay: 12, totalLastDay: 20 }`

### Requirement: Totais do mês atual e do mês anterior
O sistema SHALL retornar via `GET /services/general/month` `{ totalCurrentMonth, totalPreviousMonth }` com as contagens de atendimentos criados no mês corrente e no mês anterior.

#### Scenario: Virada de ano
- **WHEN** a consulta é feita em janeiro
- **THEN** `totalPreviousMonth` corresponde a dezembro do ano anterior

### Requirement: Totais do ano atual e do ano anterior
O sistema SHALL retornar via `GET /services/general/year` `{ totalCurrentYear, totalPreviousYear }` com as contagens de atendimentos criados no ano corrente e no ano anterior.

#### Scenario: Comparação anual
- **WHEN** um funcionário consulta os totais anuais
- **THEN** o sistema responde `200` com as contagens do ano atual e do ano anterior

### Requirement: Totais por funcionário
O sistema SHALL retornar via `GET /services/general/agent/:id` (id UUID) `{ totalGeneral, totalOnMonth, totalOnPreviousMonth }` com as contagens de atendimentos criados pelo funcionário informado: total, no mês corrente e no mês anterior. Qualquer funcionário autenticado MUST poder consultar os totais de qualquer outro.

#### Scenario: Funcionário sem atendimentos
- **WHEN** o id informado não possui atendimentos (ou não existe)
- **THEN** o sistema responde `200` com todos os totais iguais a `0`

### Requirement: Série mensal para gráfico
O sistema SHALL retornar via `GET /services/monthly` um array de 12 posições `[{ data: 'Jan'|'Fev'|...|'Dez', services: number }]`, em que `services` MUST ser a soma dos atendimentos cujo mês de `createdAt` corresponde àquele mês, somando todos os anos existentes na base (sem filtro de ano).

#### Scenario: Base com dois anos de dados
- **WHEN** existem 50 atendimentos em janeiro de 2025 e 30 em janeiro de 2026
- **THEN** a posição `Jan` retorna `services: 80`

#### Scenario: Falha na consulta
- **WHEN** a agregação no banco falha
- **THEN** o sistema responde `400` com a mensagem de erro ao recuperar os atendimentos mensais
