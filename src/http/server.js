"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _env_1 = require("./_env");
const app_1 = require("./app");
app_1.app
    .listen({
    port: _env_1.env.PORT,
    host: '0.0.0.0',
})
    .then(() => {
    console.log(`
    🚀 \x1b[32m> Servidor iniciado com sucesso!\x1b[0m ✨
    📡 \x1b[33m> Aguardando conexões na porta ${_env_1.env.PORT}...\x1b[0m
    `);
});
