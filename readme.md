# 📚 LexHub — API (OAB Atende)

**Sistema de gestão de atendimentos aos advogados(as) da OAB Maranhão.**

Funcionários da OAB registram cada atendimento prestado a um advogado — presencial
ou remoto, com um ou mais tipos de serviço — após consulta automática de cadastro e
adimplência no TOTVS Protheus. O sistema mantém o histórico, permite filtros e
alimenta um dashboard com indicadores diários, mensais e anuais.

---

## ✨ Funcionalidades

- **📝 Registro de atendimentos** com cadastro automático do advogado a partir do Protheus
- **💳 Verificação de adimplência** antes do atendimento, com regra de atendimento excepcional
- **🗂 Histórico** paginado com filtros por OAB, advogado, funcionário, modalidade e status
- **📊 Métricas** do dia, mês, ano, por funcionário e gráfico mensal
- **👥 Gestão de funcionários** (administradores e membros) e do catálogo de tipos de serviço
- **🔐 Autenticação** JWT em cookie httpOnly e recuperação de senha por e-mail

## 🛠 Stack

Node.js 22 · TypeScript · Fastify 5 · Zod · Prisma 6 · PostgreSQL 17 · Resend/React Email · pnpm · tsup

## 🚀 Início rápido

```bash
cp .env.example .env          # preencha as variáveis
pnpm install
docker compose up -d          # PostgreSQL (veja docker-compose-example.yml)
pnpm prisma migrate dev
pnpm prisma db seed           # cria o administrador inicial
pnpm dev                      # http://localhost:3892  ·  Swagger em /docs
```

## 📖 Documentação

Toda a documentação técnica está em [`docs/`](docs/README.md):

- [Arquitetura](docs/arquitetura.md) · [Referência da API](docs/api.md) · [Modelo de dados](docs/modelo-de-dados.md)
- [Fluxos de negócio](docs/fluxos-de-negocio.md) · [Integrações](docs/integracoes.md) · [Ambiente e deploy](docs/ambiente-e-deploy.md)
- [Débitos técnicos](docs/debitos-tecnicos.md)

As especificações de comportamento ficam em [`openspec/specs/`](openspec/specs/) e as
mudanças são propostas com o [OpenSpec](https://github.com/Fission-AI/OpenSpec)
(`/opsx:propose`, `/opsx:apply`, `/opsx:archive`).

## 🌟 Contribuição

1. Crie uma branch a partir de `main` (`git checkout -b feature/nova-feature`).
2. Para mudanças de comportamento, abra uma proposta no OpenSpec (`openspec/changes/`).
3. Envie um pull request explicando as alterações.

> Todo push em `main` é implantado automaticamente no servidor da OAB (ver [deploy](docs/ambiente-e-deploy.md#cicd--githubworkflowsmainyml)).

## 📜 Licença

Projeto destinado ao uso interno da OAB Maranhão.

## 📧 Contato

**Equipe de Suporte LexHub** — 📩 informatica@oabma.org.br · 🏢 OAB Maranhão - (98) 2107-5412
