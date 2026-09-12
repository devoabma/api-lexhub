import { env } from './_env'
import { app } from './app'

app
  .listen({
    port: env.PORT,
    host: '0.0.0.0',
  })
  .then(() => {
    console.log(`
    🚀 \x1b[32m> Servidor iniciado com sucesso!\x1b[0m ✨
    📡 \x1b[33m> Aguardando conexões na porta ${env.PORT}\x1b[0m
    `)
  })
