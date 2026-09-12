import { ConflictError } from 'http/_errors/conflict-error'
import { TIMEZONE, dayjs } from 'lib/dayjs'
import { prisma } from 'lib/prisma'

// Um advogado só pode ter um atendimento em aberto por vez. As rotas chamam
// antes do Protheus e de qualquer gravação
export async function assertLawyerHasNoOpenService(oab: string) {
  const openService = await prisma.services.findFirst({
    where: {
      status: 'OPEN',
      lawyer: {
        oab,
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      createdAt: true,
      lawyer: {
        select: {
          name: true,
        },
      },
      agent: {
        select: {
          name: true,
        },
      },
    },
  })

  if (!openService) {
    return
  }

  const openedAt = dayjs(openService.createdAt).tz(TIMEZONE)

  throw new ConflictError(
    `O(a) advogado(a) ${openService.lawyer.name} já possui um atendimento em aberto, registrado por ${openService.agent.name} em ${openedAt.format('DD/MM/YYYY')} às ${openedAt.format('HH:mm')}. Finalize ou cancele esse atendimento antes de abrir outro.`
  )
}
