import { Prisma } from '@prisma/client'
import { TIMEZONE, dayjs } from 'lib/dayjs'
import { prisma } from 'lib/prisma'
import {
  MONTH_LABELS,
  type Period,
  currentDate,
  monthPeriod,
  pad,
  yearPeriod,
} from './period'

interface CountRow {
  key: number
  total: number
}

interface RankingRow {
  id: string
  name: string
  total: number
}

// created_at é timestamp sem fuso, gravado em UTC. Os limites vão como texto
// com cast explícito para não depender do fuso da sessão do banco
function toSqlTimestamp(date: Date) {
  return dayjs.utc(date).format('YYYY-MM-DD HH:mm:ss.SSS')
}

// created_at no horário local da OAB Maranhão (TIMEZONE é uma constante)
const localCreatedAt = Prisma.sql`((s.created_at AT TIME ZONE 'UTC') AT TIME ZONE ${Prisma.raw(`'${TIMEZONE}'`)})`

function periodWhere(period: Period | null) {
  if (!period) {
    return Prisma.empty
  }

  return Prisma.sql`WHERE s.created_at >= ${toSqlTimestamp(period.start)}::timestamp
    AND s.created_at < ${toSqlTimestamp(period.end)}::timestamp`
}

function createdAtIn(period: Period): Prisma.ServicesWhereInput {
  return { createdAt: { gte: period.start, lt: period.end } }
}

export function countServices(
  period: Period | null,
  where: Prisma.ServicesWhereInput = {}
) {
  return prisma.services.count({
    where: period ? { ...where, ...createdAtIn(period) } : where,
  })
}

export async function countServicesByAssistance(period: Period) {
  const groups = await prisma.services.groupBy({
    by: ['assistance'],
    where: createdAtIn(period),
    _count: { _all: true },
  })

  const totalOf = (assistance: 'PERSONALLY' | 'REMOTE') =>
    groups.find(group => group.assistance === assistance)?._count._all ?? 0

  return { personally: totalOf('PERSONALLY'), remote: totalOf('REMOTE') }
}

// Série anual do primeiro ano com atendimentos até o ano atual, com zeros
// nos anos sem registro
export async function countServicesPerYear() {
  const rows = await prisma.$queryRaw<CountRow[]>`
    SELECT extract(year FROM ${localCreatedAt})::int AS key,
      count(*)::int AS total
    FROM services s
    GROUP BY 1
    ORDER BY 1
  `

  const totals = new Map(rows.map(row => [row.key, row.total]))
  const { year: currentYear } = currentDate()
  const firstYear = Math.min(rows[0]?.key ?? currentYear, currentYear)

  return Array.from({ length: currentYear - firstYear + 1 }, (_, index) => {
    const year = firstYear + index

    return { year, total: totals.get(year) ?? 0 }
  })
}

async function countByLocalPart(part: 'month' | 'day', period: Period) {
  const rows = await prisma.$queryRaw<CountRow[]>`
    SELECT extract(${Prisma.raw(part)} FROM ${localCreatedAt})::int AS key,
      count(*)::int AS total
    FROM services s
    ${periodWhere(period)}
    GROUP BY 1
  `

  return new Map(rows.map(row => [row.key, row.total]))
}

// Série de 12 meses do ano informado
export async function countServicesPerMonth(year: number) {
  const totals = await countByLocalPart('month', yearPeriod(year))

  return MONTH_LABELS.map((label, index) => ({
    month: index + 1,
    label,
    total: totals.get(index + 1) ?? 0,
  }))
}

// Série com todos os dias do mês informado
export async function countServicesPerDay(year: number, month: number) {
  const totals = await countByLocalPart('day', monthPeriod(year, month))
  const daysInMonth = dayjs.utc(`${year}-${pad(month)}-01`).daysInMonth()

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1

    return {
      day,
      date: `${year}-${pad(month)}-${pad(day)}`,
      total: totals.get(day) ?? 0,
    }
  })
}

// Empates são desfeitos pelo nome, para o ranking ser estável
export function findTopLawyers(period: Period | null, limit: number) {
  return prisma.$queryRaw<(RankingRow & { oab: string })[]>`
    SELECT l.id, l.name, l.oab, count(*)::int AS total
    FROM services s
    JOIN lawyers l ON l.id = s.lawyer_id
    ${periodWhere(period)}
    GROUP BY l.id
    ORDER BY total DESC, l.name ASC
    LIMIT ${limit}::int
  `
}

export function findTopAgents(period: Period | null, limit: number) {
  return prisma.$queryRaw<RankingRow[]>`
    SELECT a.id, a.name, count(*)::int AS total
    FROM services s
    JOIN agents a ON a.id = s.agent_id
    ${periodWhere(period)}
    GROUP BY a.id
    ORDER BY total DESC, a.name ASC
    LIMIT ${limit}::int
  `
}
