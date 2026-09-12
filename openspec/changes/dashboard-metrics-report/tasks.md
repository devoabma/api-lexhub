## 1. Datas e consultas

- [x] 1.1 Criar `src/lib/dayjs.ts` com os plugins `utc` e `timezone` e a constante `TIMEZONE = 'America/Fortaleza'`
- [x] 1.2 Criar `src/utils/metrics/period.ts`: intervalos `[início, fim)` de dia, mês e ano no fuso local, filtro de período (`month` sem `year` = ano atual), período anterior comparável e rótulos em pt-BR
- [x] 1.3 Criar `src/utils/metrics/queries.ts`: contagens, séries por ano/mês/dia com `$queryRaw` no horário local (limites como texto com `::timestamp`) e rankings com desempate por nome
- [x] 1.4 Criar `src/utils/metrics/schemas.ts` com `year` (2000–2100) e `month` (1–12)

## 2. Rotas novas (`src/http/core/metrics/`)

- [x] 2.1 `GET /metrics/services/yearly`, `GET /metrics/services/monthly` e `GET /metrics/services/daily`
- [x] 2.2 `GET /metrics/lawyers/top` (limit padrão 10, máx. 50) e `GET /metrics/agents/top` (padrão 3, máx. 20), com `servicesInPeriod`
- [x] 2.3 `GET /metrics/report` coletando os dados em paralelo e respondendo `application/pdf` com `Content-Disposition: attachment`
- [x] 2.4 Registrar as rotas em `src/http/routes/index.ts` (tag `metrics` no Swagger)

## 3. Relatório em PDF

- [x] 3.1 Adicionar `pdfkit` e `@types/pdfkit`
- [x] 3.2 Criar `src/utils/reports/services-report.ts`: cabeçalho, indicadores, gráfico de barras, tabelas com quebra de página, notas e rodapé paginado
- [x] 3.3 Embutir a logo da OAB-MA em base64 (`src/utils/reports/oab-logo.ts`)
- [x] 3.4 Expor `Content-Disposition` no CORS (`src/http/app.ts`)

## 4. Rotas existentes

- [x] 4.1 Rotas de totais (`/services/general/day|month|year|agent/:id`) com os helpers de período e `Promise.all`, mantendo o contrato
- [x] 4.2 `GET /services/monthly` com `?year=` (padrão: ano atual), agregação no banco, `deprecated: true` no Swagger e sem o `try/catch` que convertia falhas em `400`

## 5. Banco

- [x] 5.1 `@@index([createdAt])` em `Services` e migration `20260911180000_adicionado_indice_created_at_em_services`

## 6. Verificação

- [x] 6.1 `pnpm tsc --noEmit --ignoreDeprecations 5.0` e `pnpm biome check src` sem erros
- [x] 6.2 `pnpm build` e smoke test do bundle (`build/http/app.js`) gerando PDF e ranking
- [x] 6.3 Banco de teste isolado (`db-lexhub-metrics-test`) com 3.004 atendimentos sintéticos de 2024 a 2026, incluindo viradas de dia, mês e ano em UTC; todas as rotas novas e antigas conferidas contra um cálculo independente, com o processo em `TZ=UTC` e em `TZ=Asia/Tokyo` e com a sessão do banco em `America/Sao_Paulo`
- [x] 6.4 Validação (`400`) e autenticação (`401`) das rotas novas
- [x] 6.5 Inspeção visual dos PDFs: mensal, anual em andamento, ano completo e ano sem dados
- [x] 6.6 `prisma migrate diff` entre o banco migrado e o schema sem diferenças
- [x] 6.7 `openspec validate dashboard-metrics-report --strict`

## 7. Documentação

- [x] 7.1 `docs/api.md`: índice de endpoints, parâmetros de período, contratos das rotas `/metrics` e do relatório; `/services/monthly` depreciada
- [x] 7.2 `docs/fluxos-de-negocio.md`: métricas no fuso local, novas séries e rankings, relatório para a diretoria
- [x] 7.3 `docs/modelo-de-dados.md`: índice em `created_at` e histórico de migrations
- [x] 7.4 `docs/arquitetura.md`: `core/metrics`, `lib/dayjs.ts`, `utils/metrics` e `utils/reports`
- [x] 7.5 `docs/debitos-tecnicos.md`: DT-11, DT-16 e DT-37 resolvidos; DT-38 parcial
- [x] 7.6 `CLAUDE.md`, `docs/README.md` e `context` de `openspec/config.yaml`

## 8. Frontend e encerramento

- [ ] 8.1 Entregar ao web-lexhub o prompt de integração (novas rotas, seletor de período, rankings, botão do relatório)
- [ ] 8.2 Depois do deploy e da validação em produção, arquivar a change (`/opsx:archive`)
