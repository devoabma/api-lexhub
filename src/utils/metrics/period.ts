import { TIMEZONE, dayjs, nowInTimezone } from 'lib/dayjs'

// Intervalo semiaberto [start, end) em UTC, pronto para filtrar created_at
export interface Period {
  start: Date
  end: Date
}

export const MONTH_LABELS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

export const MONTH_NAMES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

export function pad(value: number) {
  return String(value).padStart(2, '0')
}

// Soma dias a uma data 'YYYY-MM-DD' (aritmética de calendário, sem fuso)
export function shiftDate(date: string, days: number) {
  return dayjs.utc(date).add(days, 'day').format('YYYY-MM-DD')
}

// Converte o início local de um dia/mês/ano para o intervalo em UTC
function localPeriod(start: string, unit: 'day' | 'month' | 'year'): Period {
  const end = dayjs.utc(start).add(1, unit).format('YYYY-MM-DD')

  return {
    start: dayjs.tz(start, TIMEZONE).toDate(),
    end: dayjs.tz(end, TIMEZONE).toDate(),
  }
}

export function dayPeriod(date: string) {
  return localPeriod(date, 'day')
}

export function monthPeriod(year: number, month: number) {
  return localPeriod(`${year}-${pad(month)}-01`, 'month')
}

export function yearPeriod(year: number) {
  return localPeriod(`${year}-01-01`, 'year')
}

export function previousMonth(year: number, month: number) {
  return month === 1
    ? { year: year - 1, month: 12 }
    : { year, month: month - 1 }
}

// Data de hoje no fuso da OAB Maranhão
export function currentDate() {
  const now = nowInTimezone()

  return {
    year: now.year(),
    month: now.month() + 1,
    date: now.format('YYYY-MM-DD'),
  }
}

// Filtro opcional de período das consultas: `month` sem `year` usa o ano
// atual; sem nenhum dos dois, vale todo o histórico (null)
export function resolvePeriodFilter({
  year,
  month,
}: {
  year?: number
  month?: number
}): Period | null {
  if (month) {
    return monthPeriod(year ?? currentDate().year, month)
  }

  if (year) {
    return yearPeriod(year)
  }

  return null
}

// Período anterior usado na comparação. Se o período atual ainda está em
// curso, compara com o mesmo trecho decorrido do anterior (ex.: 01/01 a 11/09
// do ano passado), para não confrontar um período parcial com um completo
export function comparablePreviousPeriod(
  current: Period,
  previous: Period,
  now = new Date()
) {
  const isOngoing = current.start <= now && now < current.end

  if (!isOngoing) {
    return { period: previous, partial: false }
  }

  const elapsed = now.getTime() - current.start.getTime()
  const end = new Date(
    Math.min(previous.start.getTime() + elapsed, previous.end.getTime())
  )

  return { period: { start: previous.start, end }, partial: true }
}

export function formatMonthYear(year: number, month: number) {
  const name = MONTH_NAMES[month - 1]

  return `${name.charAt(0).toUpperCase()}${name.slice(1)} de ${year}`
}

export function formatLocalDate(date: Date, template: string) {
  return dayjs(date).tz(TIMEZONE).format(template)
}
