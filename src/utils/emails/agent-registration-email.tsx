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
  email: string
  tempPassword: string
  link: string
}

// @ts-ignore somente para o react-email
React.version

export const AgentRegistrationEmail = ({
  name,
  email,
  tempPassword,
  link,
}: PasswordResetEmailProps) => {
  const currentYear = new Date().getFullYear()
  const sendDate = new Date().toLocaleDateString('pt-BR')

  return (
    <Html>
      <Head />
      <Preview>
        Bem-vindo(a) à OAB Atende! Confira os detalhes do seu cadastro.
      </Preview>

      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="bg-white border border-gray-200 rounded-lg p-8 mx-auto my-8 max-w-xl">
            <Heading className="text-2xl font-bold text-center text-blue-700 mb-6">
              Bem-vindo(a) à OAB Atende!
            </Heading>
            <Text className="text-gray-700 mb-6">
              Olá, <b>{name}</b>
            </Text>
            <Text className="text-gray-700 mb-6">
              Estamos muito felizes em tê-lo(a) conosco! Abaixo estão os
              detalhes do seu cadastro:
            </Text>
            <Section className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <Text className="text-gray-700 mb-2">
                <b>Nome:</b> {name}
              </Text>
              <Text className="text-gray-700 mb-2">
                <b>E-mail:</b> {email}
              </Text>
              <Text className="text-gray-700">
                <b>Senha provisória:</b> {tempPassword}
              </Text>
            </Section>
            <Text className="text-gray-700 mb-6">
              Você está recebendo uma senha temporária para acessar o sistema da
              OAB Atende. Por questões de segurança, é obrigatório que você
              realize a redefinição de senha.
            </Text>
            <Button
              href={link}
              className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-center block"
            >
              Acessar o Sistema
            </Button>
            <Hr className="border-gray-200 my-6" />
            <Text className="text-sm text-gray-500 text-center">
              Este é um e-mail automático. Por favor, não responda a esta
              mensagem.
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
