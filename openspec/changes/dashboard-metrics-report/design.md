## Context

As métricas atuais são seis rotas em `src/http/core/services/` que fazem
`count`s sequenciais com limites calculados por `dayjs()` no fuso do processo.
O gráfico mensal agrupa por `createdAt` (uma linha por atendimento), soma por
`getMonth()` e mistura os anos. O frontend (web-lexhub, Next.js + React Query +
recharts) consome essas rotas em quatro cards e um gráfico de linha.

A diretoria quer séries por ano, mês e dia, rankings de advogados e de
funcionários e um relatório impresso. `created_at` é `timestamp(3)` sem fuso,
gravado em UTC pelo Prisma, e não tem índice.

## Goals / Non-Goals

**Goals:**
- Expor séries e rankings com período configurável, prontos para gráficos.
- Gerar no servidor um PDF padronizado, com a identidade da OAB-MA.
- Contar dias, meses e anos no horário do Maranhão em qualquer ambiente.
- Não quebrar o contrato das rotas usadas hoje pelo frontend.

**Non-Goals:**
- Métricas por tipo de serviço, por forma de atendimento ou por status em
  rotas próprias (o PDF traz apenas a divisão presencial/remoto).
- Cache de métricas, relatórios agendados ou envio por e-mail.
- Renomear ou remover rotas antigas (DT-25).

## Decisions

### 1. Novas rotas em `/metrics`; rotas antigas mantidas

As rotas novas ficam em `src/http/core/metrics/` (uma por arquivo), com a tag
`metrics` no Swagger. As antigas continuam no ar com o mesmo contrato, porque o
frontend depende delas e o deploy da API é independente do frontend. Só
`/services/monthly` muda de comportamento (filtra por ano) e fica depreciada.

Alternativa descartada: ampliar `/services/general/*` com parâmetros. Os nomes
atuais já confundem (`/services/general/agent/day` conta todos os
funcionários), e os formatos (`totalTheDay`, `data`/`services`) não servem para
séries.

### 2. Fuso fixo `America/Fortaleza`

`src/lib/dayjs.ts` registra os plugins `utc` e `timezone` e exporta
`TIMEZONE = 'America/Fortaleza'` (UTC-3, sem horário de verão, o fuso do
Maranhão no tz database). `src/utils/metrics/period.ts` monta os intervalos
semiabertos `[início, fim)` a partir da data local (`dayjs.tz('2026-09-01',
TIMEZONE)`), com a aritmética de calendário feita em UTC puro para não depender
do fuso do processo. As rotas de totais existentes passam a usar os mesmos
helpers.

Alternativa descartada: `process.env.TZ` no `server.ts`. Seria global e
implícito, e não resolveria o agrupamento no banco.

### 3. Agregação no banco com `$queryRaw`

Séries e rankings usam SQL cru, porque o Prisma não agrupa por partes de data:

- o agrupamento converte `created_at` para o horário local com
  `(created_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/Fortaleza'`, o que
  independe do `TimeZone` da sessão;
- os limites do período vão como texto (`'YYYY-MM-DD HH:mm:ss.SSS'` em UTC) com
  `::timestamp` explícito, evitando que um parâmetro `timestamptz` seja
  convertido pelo fuso da sessão;
- `GROUP BY 1`, `count(*)::int` e `extract(...)::int` devolvem `number`, sem
  `BigInt`/`Decimal`;
- o fuso entra via `Prisma.raw` porque é uma constante do código, nunca uma
  entrada do usuário;
- os meses e dias sem registro são preenchidos com zero no Node.

Contagens simples continuam no client tipado (`prisma.services.count`).

### 4. Parâmetros de período

`year` (2000–2100) e `month` (1–12) são opcionais, validados pelo Zod (`400`
fora da faixa). Nos rankings, sem nenhum dos dois vale todo o histórico, e
`month` sem `year` usa o ano atual. Nas séries, a ausência cai no ano/mês atual.
Isso deixa o dashboard com um único seletor de período para os cards novos.

### 5. Rankings

Ordenação por total decrescente e, em empate, por nome, para o ranking não
variar entre chamadas. `limit` configurável (padrão 10 para advogados e 3 para
funcionários, conforme o pedido), com teto baixo. A resposta traz
`servicesInPeriod` para o frontend mostrar a participação de cada item sem uma
chamada extra. Funcionários inativos continuam no ranking: os atendimentos
aconteceram.

### 6. PDF no servidor com `pdfkit`

`src/utils/reports/services-report.ts` recebe os dados já calculados e desenha
o documento (A4, Helvetica, cores da identidade visual do frontend):
cabeçalho com a logo, período e autoria; quatro indicadores; gráfico de barras
(por dia no relatório mensal, por mês no anual); tabelas do top 10 de
advogados, do top 3 de funcionários e do histórico anual; notas de
metodologia; rodapé com paginação. A rota `GET /metrics/report` só coleta os
dados (em paralelo) e responde o buffer com `Content-Disposition: attachment`.

A logo (texto escuro, 420 px, 64 cores, cerca de 7 KB) fica embutida em base64
em `src/utils/reports/oab-logo.ts`: funciona igual no `tsx` e no build do
`tsup`, sem copiar assets. O `pdfkit` é CJS e fica fora do bundle (dependência),
como as demais.

Alternativas descartadas:
- `@react-pdf/renderer`: reaproveitaria o JSX dos e-mails, mas a v4 é ESM-only
  e o projeto compila para CJS;
- Puppeteer/Chromium: HTML mais fácil de estilizar, mas pesado para o servidor
  da OAB (download do navegador no `pnpm install` do deploy, memória);
- gerar no frontend (jsPDF ou `window.print`): o resultado depende do navegador,
  e a diretoria precisa de um documento padronizado.

### 7. Comparação no relatório

O relatório compara o período com o anterior equivalente. Quando o período está
em curso (ex.: 2026 em setembro), compara com o mesmo trecho decorrido do
anterior (01/01 a 11/09 de 2025), limitado ao fim do período anterior, para não
confrontar um período parcial com um completo. Sem registros no período
anterior, o PDF diz que não há base de comparação em vez de mostrar `+100%`. Os
cards atuais do dashboard não mudam (seguem comparando com o período anterior
completo).

### 8. Permissões

Todas as rotas novas são 🔑, como as métricas atuais e o dashboard. O ranking
expõe nome e OAB de advogados, dados que o funcionário já vê na listagem de
atendimentos. Restringir o relatório a `ADMIN` é uma troca de
`getCurrentAgentId()` por `checkIfAgentIsAdmin()`.

## Risks / Trade-offs

- [Relatório pesado com muitos dados] → todas as consultas são agregadas no
  banco. Com cerca de 3 mil atendimentos, o PDF é gerado em 10–50 ms e tem cerca
  de 18 KB.
- [`CREATE INDEX` bloqueia escrita em `services` durante o deploy] → a tabela
  tem milhares de linhas, então o bloqueio dura menos de um segundo.
  `CONCURRENTLY` exigiria sair da transação da migration.
- [Série anual varre a tabela inteira] → é um `count` agrupado, sem trazer
  linhas para o Node. Aceitável no volume atual; o índice não ajuda nesse caso.
- [`/services/monthly` muda de comportamento sem mudar o formato] → é a correção
  de um bug (DT-11), comunicada ao frontend.
- [Nomes longos no PDF] → cortados com reticências na largura da coluna.
- [Fontes padrão do PDF (WinAnsi)] → cobrem os acentos do português. Caracteres
  fora dessa tabela (ex.: emoji num nome) não aparecem.

## Migration Plan

1. Push em `main`: o CI instala dependências (inclui `pdfkit`), roda
   `prisma migrate deploy` (cria o índice) e reinicia o pm2.
2. As rotas antigas seguem funcionando; o frontend adota as novas quando for
   publicado.
3. Rollback: reverter o commit. O índice pode ficar (é inofensivo) ou ser
   removido com uma migration de `DROP INDEX`.

## Open Questions

- O relatório deve ficar restrito a administradores?
- A diretoria quer também a distribuição por tipo de serviço (exige juntar
  `service_service_types`)?
