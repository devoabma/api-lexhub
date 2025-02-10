import { PrismaClient, Role } from '@prisma/client'
import { hash } from 'bcryptjs'
import { env } from 'http/env'

const prisma = new PrismaClient()

async function main() {
  // FIXME: // Senha padrão (altere para produção)
  const password = env.PASSWORD_ADMIN_FULL
  const hashedPassword = await hash(password, 8)

  // Verifica se o admin já existe
  const existingAdmin = await prisma.agent.findUnique({
    where: { email: env.EMAIL_ADMIN_FULL },
  })

  if (!existingAdmin) {
    await prisma.agent.create({
      data: {
        name: 'Gerência de Tecnologia da Informação',
        email: env.EMAIL_ADMIN_FULL,
        passwordHash: hashedPassword,
        role: Role.ADMIN,
      },
    })
    console.log('> ✅ Administrador criado com sucesso.')
  } else {
    console.log('> 🔐 Administrador já existente na base de dados.')
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
