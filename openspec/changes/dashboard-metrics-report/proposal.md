## Why

O dashboard só mostra os totais do dia, do mês e do ano, sempre comparados ao
período imediatamente anterior, e um gráfico mensal que soma todos os anos da
base (DT-11). A diretoria da OAB-MA precisa de mais: acompanhar a evolução por
ano, por mês e por dia, saber quais advogados(as) mais procuram a Seccional e
quais funcionários(as) mais atendem, e levar esses números às reuniões num
relatório em PDF. Além disso, os limites de "hoje" e de "este mês" dependem do
fuso do servidor (DT-16): com o processo em UTC, o dia vira às 21h no Maranhão.

## What Changes

- Novas rotas de métricas em `/metrics` (🔑 qualquer funcionário autenticado):
  - `GET /metrics/services/yearly`: série anual, do primeiro ano com registros
    até o atual;
  - `GET /metrics/services/monthly?year=`: os 12 meses de um ano (padrão: ano
    atual);
  - `GET /metrics/services/daily?year=&month=`: todos os dias de um mês
    (padrão: mês atual);
  - `GET /metrics/lawyers/top?year=&month=&limit=`: ranking dos advogados(as)
    mais atendidos(as) (padrão: 10);
  - `GET /metrics/agents/top?year=&month=&limit=`: ranking dos
    funcionários(as) que mais atenderam (padrão: 3);
  - `GET /metrics/report?year=&month=`: relatório em PDF (A4) para a diretoria,
    com indicadores, gráfico, rankings e histórico anual.
- Todas as métricas passam a usar o fuso `America/Fortaleza` (UTC-3, horário do
  Maranhão), qualquer que seja o fuso do servidor ou da sessão do banco.
  Resolve DT-16.
- `GET /services/monthly` passa a contar só o ano informado em `?year=`
  (padrão: ano atual) em vez de somar todos os anos, e deixa de carregar a
  tabela inteira na memória. O formato da resposta é mantido, e a rota fica
  marcada como depreciada no Swagger em favor de `GET /metrics/services/monthly`.
  Resolve DT-11. Uma falha no banco deixa de virar `400` genérico e vai para o
  handler global (`500`, com log) (DT-21, parcial).
- As rotas de totais (`/services/general/*`) mantêm o contrato; as contagens
  passam a rodar em paralelo (DT-38, parcial) e no fuso fixo.
- Índice em `services.created_at`, a coluna usada por todas as métricas.
  Resolve DT-37.
- O CORS passa a expor o cabeçalho `Content-Disposition`, para o frontend ler o
  nome do arquivo do PDF.
- Nova dependência: `pdfkit`, que gera o PDF no servidor com as fontes padrão,
  sem navegador headless.

Nenhuma mudança **BREAKING** no formato das respostas. Muda um comportamento
visível no frontend: o gráfico atual (`/services/monthly`) passa a mostrar só o
ano corrente, que é o que quem lê "Atendimentos por mês" espera.

Fora do escopo: rotas próprias para métricas por tipo de serviço e por forma de
atendimento, filtro por funcionário nos rankings, restrição de acesso às
métricas (DT-15) e renomeação das rotas antigas (DT-25).

## Capabilities

### New Capabilities

Nenhuma. As novas rotas ampliam `service-metrics`.

### Modified Capabilities

- `service-metrics`: séries anual, mensal (por ano) e diária; rankings de
  advogados e de funcionários; parâmetros de período; relatório em PDF; fuso
  fixo `America/Fortaleza`; `/services/monthly` filtrada por ano.
- `api-platform`: o CORS passa a expor `Content-Disposition`.

## Impact

- Código: `src/http/core/metrics/*` (6 rotas), `src/utils/metrics/*` (períodos,
  consultas e schemas), `src/utils/reports/*` (PDF e logo), `src/lib/dayjs.ts`,
  rotas de totais em `src/http/core/services/`, `src/http/routes/index.ts` e
  `src/http/app.ts`.
- Banco: migration `20260911180000_adicionado_indice_created_at_em_services`
  (só `CREATE INDEX`), aplicada pelo `prisma migrate deploy` do CI.
- Dependências: `pdfkit` e `@types/pdfkit`.
- Frontend (web-lexhub): pode consumir as novas rotas quando quiser; nada quebra
  se não consumir. O gráfico atual passa a exibir só o ano corrente.
