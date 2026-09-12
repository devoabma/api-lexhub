import { render } from '@react-email/components'
import { AgentRegistrationEmail } from './src/utils/emails/agent-registration-email'

async function main() {
  const html = await render(
    AgentRegistrationEmail({
      name: 'Luis',
      email: 'luis@luis',
      tempPassword: '123456',
      link: 'https://oabatende.com.br',
    })
  )

  console.log(html)
}

main()

// Execução
// pnpm tsx preview-email.ts > preview.html
