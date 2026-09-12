import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from 'http/middlewares/auth'
import { nowInTimezone } from 'lib/dayjs'
import { prisma } from 'lib/prisma'
import {
  MONTH_NAMES,
  comparablePreviousPeriod,
  formatLocalDate,
  formatMonthYear,
  monthPeriod,
  pad,
  previousMonth,
  yearPeriod,
} from 'utils/metrics/period'
import {
  countServices,
  countServicesByAssistance,
  countServicesPerDay,
  countServicesPerMonth,
  countServicesPerYear,
  findTopAgents,
  findTopLawyers,
} from 'utils/metrics/queries'
import { monthQuerySchema, yearQuerySchema } from 'utils/metrics/schemas'
import { renderServicesReport } from 'utils/reports/services-report'
import { z } from 'zod'

export async function getServicesReport(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/metrics/report',
      {
        schema: {
          tags: ['metrics'],
          summary: 'Gera o relatório de atendimentos em PDF',
          description:
            'Responde `application/pdf` como anexo. Sem `month`, o relatório cobre o ano inteiro; sem `year`, usa o ano atual.',
          security: [{ bearerAuth: [] }],
          querystring: z.object({
            year: yearQuerySchema.optional(),
            month: monthQuerySchema.optional(),
          }),
        },
      },
      async (request, reply) => {
        const agentId = await request.getCurrentAgentId()

        const now = nowInTimezone()
        const year = request.query.year ?? now.year()
        const { month } = request.query
        const previous = month
          ? previousMonth(year, month)
          : { year: year - 1, month: undefined }

        const period = month ? monthPeriod(year, month) : yearPeriod(year)
        const comparison = comparablePreviousPeriod(
          period,
          previous.month
            ? monthPeriod(previous.year, previous.month)
            : yearPeriod(previous.year)
        )

        const [
          agent,
          total,
          previousTotal,
          overallTotal,
          assistance,
          series,
          yearly,
          topLawyers,
          topAgents,
        ] = await Promise.all([
          prisma.agent.findUnique({
            where: { id: agentId },
            select: { name: true },
          }),
          countServices(period),
          countServices(comparison.period),
          countServices(null),
          countServicesByAssistance(period),
          month
            ? countServicesPerDay(year, month).then(days =>
                days.map(day => ({ label: String(day.day), total: day.total }))
              )
            : countServicesPerMonth(year),
          countServicesPerYear(),
          findTopLawyers(period, 10),
          findTopAgents(period, 3),
        ])

        const periodName = month
          ? formatMonthYear(year, month)
          : `Ano de ${year}`
        const previousName = previous.month
          ? formatMonthYear(previous.year, previous.month)
          : `Ano de ${previous.year}`

        // Período em curso: compara com o mesmo trecho do período anterior
        const previousLabel = comparison.partial
          ? `Mesmo período de ${
              previous.month
                ? `${MONTH_NAMES[previous.month - 1]}/${previous.year}`
                : previous.year
            } (${formatLocalDate(comparison.period.start, 'DD/MM')} a ${formatLocalDate(comparison.period.end, 'DD/MM')})`
          : previousName

        const pdf = await renderServicesReport({
          periodLabel: comparison.partial
            ? `${periodName} (parcial, até ${now.format('DD/MM/YYYY')})`
            : periodName,
          generatedAt: now.format('DD/MM/YYYY [às] HH:mm'),
          generatedBy: agent?.name ?? '—',
          total,
          previous: { label: previousLabel, total: previousTotal },
          assistance,
          overallTotal,
          series: {
            title: month
              ? `Atendimentos por dia — ${periodName}`
              : `Atendimentos por mês — ${year}`,
            points: series,
          },
          yearly: yearly.map(entry => ({
            ...entry,
            partial: entry.year === now.year(),
          })),
          topLawyers,
          topAgents,
        })

        const fileName = `relatorio-atendimentos-${year}${month ? `-${pad(month)}` : ''}.pdf`

        return reply
          .status(200)
          .header('Content-Type', 'application/pdf')
          .header('Content-Disposition', `attachment; filename="${fileName}"`)
          .send(pdf)
      }
    )
}
