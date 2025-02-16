import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface PasswordResetEmailProps {
  name: string
  code: string
  link: string
}

// @ts-ignore somente para o react-email
React.version

export const ResetPasswordEmail = ({
  name,
  code,
  link,
}: PasswordResetEmailProps) => {
  const currentYear = new Date().getFullYear()
  const sendDate = new Date().toLocaleDateString('pt-BR')

  return (
    <Html>
      <Head />
      <Preview>
        Recebemos uma solicitação para redefinir a senha da sua conta no OAB
        Atende.
      </Preview>

      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="bg-white border border-gray-200 rounded-lg p-8 mx-auto my-8 max-w-xl">
            <Heading className="text-2xl font-bold text-center text-blue-700 mb-6">
              Redefinição de Senha - OAB Atende
            </Heading>
            <Text className="text-gray-700 mb-6">
              Olá, <b>{name}</b>
            </Text>
            <Text className="text-gray-700 mb-6">
              Recebemos uma solicitação para redefinir a senha da sua conta no
              OAB Atende. Use o código abaixo para concluir o processo de
              redefinição:
            </Text>
            <Section className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <Text className="text-2xl font-bold text-center text-blue-700">
                {code}
              </Text>
            </Section>
            <Text className="text-gray-700 mb-6">
              Agora, clique no botão abaixo para ser redirecionado à página de
              redefinição de senha:
            </Text>
            <Button
              href={link}
              className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-center block"
            >
              Redefinir Senha
            </Button>
            <Hr className="border-gray-200 my-6" />
            <Text className="text-sm text-gray-500 text-center">
              Se você não solicitou a redefinição de senha, por favor ignore
              este e-mail ou entre em contato com nosso suporte.
            </Text>
            <Hr className="border-gray-200 my-6" />
            <Text className="text-xs text-gray-400 text-center">
              &copy; {currentYear} OAB Atende. Todos os direitos reservados.
            </Text>
            <Text className="text-xs text-gray-400 text-center">
              Este e-mail foi enviado em {sendDate}.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
