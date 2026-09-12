# Integrações externas

## TOTVS Protheus

Dois clientes axios em `src/lib/axios.ts`, sem timeout, headers de autenticação ou retry configurados.

### API de dados cadastrais — `API_PROTHEUS_DATA_URL`

| | |
|---|---|
| Chamada | `GET {API_PROTHEUS_DATA_URL}/?idOrg=10&param=<oab>` |
| Resposta usada | `{ "lawyer": { "nome": string, "registro": string, "email": string } }` |
| Usada em | `POST /services/consult/lawyer` (só `nome`) e `POST /services` (cadastro do advogado local) |
| `idOrg=10` | fixo no código (identificador da seccional no Protheus) |

### API financeira — `API_PROTHEUS_FIN_URL`

| | |
|---|---|
| Chamada | `GET {API_PROTHEUS_FIN_URL}/<oab>` |
| Interpretação | corpo **truthy** = adimplente · corpo **vazio/falsy** = inadimplente |
| Usada em | `POST /services/consult/lawyer` e `POST /services/external` |

### Tratamento de falhas

Qualquer `AxiosError` (rede, timeout, 4xx, 5xx) chega ao `errorHandler` global e vira
**404** com `Consulta indisponível ou advogado(a) não encontrado. Verifique os dados e tente novamente mais tarde.`
Não há distinção entre "advogado não existe" e "Protheus fora do ar" ([DT-23](debitos-tecnicos.md#dt-23)).

> O contrato acima foi deduzido do código. Não há documentação do Protheus neste
> repositório — se obtiver a especificação oficial, anexe-a aqui.

## Resend (e-mail)

Cliente em `src/lib/resend.ts` (`RESEND_API_KEY`). Remetente: `📧 OAB Atende <oabatende@oabma.com.br>`
(o domínio precisa estar verificado no Resend).

| Template (`src/utils/emails/`) | Assunto | Disparado por | Dados |
|---|---|---|---|
| `agent-registration-email.tsx` | 🎉 Bem-vindo à equipe! Aqui estão suas informações. | `POST /agents` | nome, e-mail, senha provisória, link `WEB_URL` |
| `reset-password-email.tsx` | 🔄 Redefinição de Senha - OAB Atende | `POST /agents/password/recover` | nome, código, link `WEB_URL/reset-password?code=` |

Os templates usam `@react-email/components` com Tailwind.

### Pré-visualizar um e-mail

Existe um script avulso na raiz (não versionado):

```bash
pnpm tsx preview-email.ts > preview.html
```
