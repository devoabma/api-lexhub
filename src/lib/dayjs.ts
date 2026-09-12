import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

// Fuso da OAB Maranhão. Dias, meses e anos das métricas seguem o horário
// local, qualquer que seja o fuso do servidor (DT-16)
export const TIMEZONE = 'America/Fortaleza'

// Data e hora atuais no fuso da OAB Maranhão
export function nowInTimezone() {
  return dayjs().tz(TIMEZONE)
}

export { dayjs }
