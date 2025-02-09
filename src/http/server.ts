import { app } from './app'
import { env } from './env'

app
  .listen({
    port: env.PORT,
    host: '0.0.0.0',
  })
  .then(() => {
    console.log(`
    🚀 \x1b[32m> Servidor iniciado com sucesso!\x1b[0m ✨
    📡 \x1b[33m> Aguardando conexões...\x1b[0m
    `)
  })
