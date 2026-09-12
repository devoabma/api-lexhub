import { env } from 'http/_env'
import { Resend } from 'resend'

const resend = new Resend(env.RESEND_API_KEY)

type SendEmailOptions = Parameters<typeof resend.emails.send>[0]

// Envio recusado pelo Resend (domínio não verificado, limite de envio etc.)
export class EmailDeliveryError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'EmailDeliveryError'
    this.code = code
  }
}

// O SDK não lança quando o envio falha, devolve { data, error }. O helper
// converte o erro em exceção para que nenhuma rota consiga ignorá-lo
export async function sendEmail(options: SendEmailOptions) {
  const { data, error } = await resend.emails.send(options)

  if (error) {
    throw new EmailDeliveryError(error.name, error.message)
  }

  return data
}
