@ -1,210 +1,395 @@
<div align="center">
  <img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>
# Music.AI — gere músicas com IA, publique e venda no Marketplace

# Music.AI
![Build](https://img.shields.io/badge/build-<<<PREENCHER>>>-lightgrey)
![Tests](https://img.shields.io/badge/tests-<<<PREENCHER>>>-lightgrey)
![Coverage](https://img.shields.io/badge/coverage-<<<PREENCHER>>>-lightgrey)
![License](https://img.shields.io/badge/license-<<<PREENCHER>>>-lightgrey)
![Version](https://img.shields.io/badge/version-0.0.0-blue)
![Status](https://img.shields.io/badge/status-POC%20%2F%20MVP-yellow)

Plataforma web para **gerar músicas com IA**, publicar no **Marketplace**, vender via **checkout (Stripe)** e acionar **agentes (n8n)** por webhooks para automações (criação, marketing, etc.).
Aplicação web (SPA) com backend leve para **criar músicas com IA**, armazenar no **Supabase**, vender via **Stripe Checkout** e orquestrar automações com **n8n** (agents/workflows).

Este projeto foi construído a partir de um app gerado no **Google AI Studio** (base do app + direcionamento de prompts/fluxos), e depois integrado com Supabase + n8n para orquestração.
> Importante: este projeto foi feito com apoio do **Google AI Studio** (Gemini) — tanto na geração/estrutura inicial do app quanto na construção de fluxos/prompting usados pelos agentes.

## Demo (Render)
## Sumário

Para facilitar testes, esta aplicação foi publicada no Render:
- [Visão geral](#visão-geral)
- [Entregáveis do teste](#entregáveis-do-teste)
- [Demonstração rápida (Quickstart)](#demonstração-rápida-quickstart)
- [Como funciona (alto nível)](#como-funciona-alto-nível)
- [Arquitetura e decisões técnicas](#arquitetura-e-decisões-técnicas)
- [Configuração](#configuração)
- [Rotas/Comandos principais](#rotascomandos-principais)
- [Testes](#testes)
- [Observabilidade e Debug](#observabilidade-e-debug)
- [Segurança](#segurança)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Roadmap](#roadmap)
- [Contribuição](#contribuição)
- [Licença e Autor](#licença-e-autor)

- https://music-ai-d18l.onrender.com/
## Visão geral

## Visão geral (arquitetura)
### Dados do projeto (preencher)

Em alto nível:
- Nome do projeto: Music.AI
- Tipo: Web (SPA) + API (Express)
- Objetivo do teste (1–2 frases): Autonomous music generation company com criação diária de músicas via IA, billing recorrente e marketing automatizado.
- Requisitos do desafio (bullets):
  - Music Agent: gerar música por IA diariamente (Suno, Diff-Singer, Riffusion)
  - Billing Agent: lidar com pagamento mensal (US$ 1)
  - Marketing Agent: postar em redes sociais com amostras
  - Bonus: playlist builder estilo Spotify
  - Bonus: geração baseada em mood
- O que foi entregue (bullets): <<<PREENCHER>>>
- Stack: TypeScript + React (Vite) + Node.js/Express + Supabase + n8n + Stripe + SunoAPI + Shotstack

1. **Frontend (Vite + React)**: UI (Login, Home, Marketplace, Player, etc.)
2. **Backend (Express)**: expõe rotas `/api/*` para:
   - autenticar usuário via Supabase
   - proteger segredos (tokens/URLs do n8n)
   - intermediar a criação do checkout do Marketplace
   - receber atualizações de compra (n8n → app)
3. **Supabase**: Auth + banco (tabelas como `musicas`, `compras`, etc.)
4. **n8n (Agents/Workflows)**: automações e integrações externas:
   - **SunoAPI** (geração de música/MP4)
   - **Stripe** (criar checkout session / confirmar pagamento)
   - **Shotstack** (renderização de vídeo/clipes)
   - **X/Twitter APIs** (upload de mídia + post)
   - LLMs (ex.: **Gemini via Google AI Studio**, e em alguns agentes modelos via Groq)
### O que esse projeto resolve

## Tecnologias usadas
- Usuário se autentica (Supabase Auth) e usa o app para criar/visualizar conteúdo.
- Músicas podem ser publicadas para venda no Marketplace.
- Compra no Marketplace cria um checkout via Stripe (orquestrado pelo n8n).
- Agents do n8n automatizam tarefas (criação, moderação/conformidade, marketing, clipes, postagem em redes).

- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express + CORS
- **Banco/Auth**: Supabase (`@supabase/supabase-js`)
- **Orquestração**: n8n (workflows exportados em `agentsN8n/`)
- **Pagamentos**: Stripe (checkout sessions)
- **Geração musical**: SunoAPI
- **Vídeo**: Shotstack (render de clipes)
- **IA**:
  - Google AI Studio (Gemini) como base/produção dos fluxos de IA
  - Alguns workflows usam integrações de LLM via n8n (ex.: Groq)
### Demo pública

## Estrutura do repositório
- Render (ambiente de teste): https://music-ai-d18l.onrender.com/

- `pages/` e `components/`: telas e componentes do app
- `contexts/`: Auth + Player
- `lib/supabase.ts`: client do Supabase no frontend
- `server/`: API (Express) usada localmente e também em produção
- `agentsN8n/`: exports de workflows do n8n ("agents")
## Entregáveis do teste

## Como os Agents (n8n) se conectam ao app (Webhooks)
### Checklist dos requisitos

Existem **dois tipos de “webhook”** no projeto:
> Preencha/ajuste esta lista para o contexto do desafio.

1) **App → n8n (chamada de webhook/URL do n8n)**
- O backend chama uma URL do n8n (guardada em env var) para iniciar um processo.
- Ex.: iniciar checkout no Marketplace.
- ✅ Aplicação Web (SPA) com rotas principais
- ✅ Backend simples para rotas `/api/*` e integração com n8n
- ✅ Integração com Supabase (Auth + DB)
- ✅ Marketplace com fluxo de compra via Stripe Checkout (via n8n)
- ✅ Integrações n8n exportadas em [agentsN8n/](agentsN8n/)
- ⚠️ Testes automatizados: <<<PREENCHER>>> (não há scripts de teste no `package.json`)
- ⚠️ Observabilidade estruturada: <<<PREENCHER>>> (logs via `console.*`)

2) **n8n → App (callback para atualizar status/registrar dados)**
- O n8n chama uma rota do backend para atualizar o banco (ex.: compra concluída).
- Essas rotas devem ser protegidas por segredo (Bearer token).
### Evidências

### Onde isso está no código
- Prints: <<<PREENCHER>>>
- Logs: <<<PREENCHER>>>
- Comandos executados: <<<PREENCHER>>>

Rotas principais no backend:
## Demonstração rápida (Quickstart)

- `POST /api/n8n/billing/checkout` — Browser → App → n8n (checkout)
  - Implementação em [server/index.ts](server/index.ts#L193)
  - Requer `Authorization: Bearer <access_token do Supabase>`
  - Body: `{ "musicId": "..." }`
  - Retorna: `{ url, purchase_id, session_id }`
### Rodar em 2 minutos (local)

- `POST /api/n8n/purchases/update` — n8n → App (atualiza compra)
  - Implementação em [server/index.ts](server/index.ts#L289)
  - Requer `Authorization: Bearer <N8N_MARKETPLACE_PURCHASE_UPDATE_SECRET>`
  - Body: `{ purchase_id, status, stripe_session_id?, stripe_payment_intent_id?, error_message? }`
Pré-requisitos:

- `POST /api/n8n/creations/webhook` — Browser → App → n8n (criação)
  - Implementação em [server/index.ts](server/index.ts#L324)
  - É usado para acionar um workflow de criação com/sem letras (dependendo do `mode`).
- Node.js (LTS)

### Onde os Webhooks do n8n ficam
```bash
npm install
cp .env.example .env
### edite o .env com suas chaves
npm run dev
```

Os workflows exportados em `agentsN8n/` contêm nós do tipo `n8n-nodes-base.webhook`.
Quando você importa esses workflows na sua instância n8n e ativa, eles passam a expor endpoints como:
✅ Esperado:

- `POST https://<seu-n8n>/webhook/<path>` (produção)
- `POST https://<seu-n8n>/webhook-test/<path>` (modo de teste)
- Frontend em `http://localhost:3000`
- API em `http://localhost:8787`
- Healthcheck retornando JSON:

O `<path>` é o campo `path` dentro do nó Webhook no JSON.
```bash
curl http://localhost:8787/api/health
```

## Fluxos principais (end-to-end)
Saída esperada (exemplo):

### 1) Marketplace: gerar link de pagamento (Stripe)
```json
{ "ok": true }
```

1. Usuário clica em “Comprar” no Marketplace.
2. O frontend chama `POST /api/n8n/billing/checkout`.
3. O backend:
   - valida o token do usuário (Supabase)
   - busca a música/preço no banco (Supabase)
   - chama o **n8n** via `N8N_MARKETPLACE_CHECKOUT_URL`.
4. O n8n (workflow “Agente de faturamento”):
   - cria uma **Stripe Checkout Session** (`/v1/checkout/sessions`)
   - devolve para o backend a `url` do checkout.
5. O frontend redireciona o usuário para a URL do Stripe.
6. Após pagamento/cancelamento, o Stripe redireciona para:
   - `GET /checkout/success?...` ou `GET /checkout/cancel?...` (rotas do SPA)
7. O n8n também atualiza o status no banco chamando `POST /api/n8n/purchases/update`.
❌ Problemas comuns:

Observação importante:
- Neste repo, o webhook “direto do Stripe” não está implementado no Express. O padrão aqui é:
  **Stripe → n8n → App**.
- `Missing env var: SUPABASE_SERVICE_ROLE_KEY`
  - Defina `SUPABASE_SERVICE_ROLE_KEY` no ambiente (no `.env` local / Render).
- Frontend não consegue chamar `/api/*` local
  - Confira o proxy do Vite (ver [vite.config.ts](vite.config.ts)).

#### Testar pagamentos (Stripe)
### Rodar via demo (Render)

Para testar a compra de alguma música no Marketplace, use os **cartões de teste do Stripe**:
- Acesse: https://music-ai-d18l.onrender.com/

- https://docs.stripe.com/testing?locale=pt-BR
✅ Esperado:

- Navegação carregando as páginas do app.

## Como funciona (alto nível)

### Fluxo do usuário / execução

1) Usuário entra no app e se autentica (Supabase Auth).

2) Marketplace:

- Ao clicar em comprar, o frontend chama `POST /api/n8n/billing/checkout`.
- O backend valida o usuário via Supabase e consulta a música/preço no banco.
- O backend chama um workflow do n8n para criar a sessão do Stripe Checkout.
- O frontend redireciona para a URL do checkout.

3) Criação/Agents:

- O app pode acionar workflows do n8n por webhooks (via backend).
- Workflows podem chamar SunoAPI (geração), Shotstack (render), e publicar em X/Twitter.

### Diagrama (componentes e integrações)

```mermaid
flowchart LR
  U[Usuário (Browser)] -->|SPA| FE[Frontend
React + Vite]
  FE -->|Supabase Auth| SB[(Supabase
Auth + DB)]
  FE -->|POST /api/*| API[Backend
Node.js + Express]

  API -->|Valida token| SB
  API -->|POST webhook (env N8N_*)| N8N[n8n (Agents/Workflows)]

  N8N -->|Create checkout session| Stripe[Stripe API]
  Stripe -->|Redirect success/cancel| FE

  N8N -->|Update purchase status| API
  API -->|update compras| SB

  N8N --> Suno[SunoAPI]
  N8N --> Shotstack[Shotstack API]
  N8N --> X[X/Twitter APIs]
  N8N --> AI[IA
Google AI Studio (Gemini)
e/ou LLMs no n8n]
```

## Arquitetura e decisões técnicas

### 2) Criação de música: SunoAPI + Supabase
### Por que essa stack

Um fluxo típico (workflows em `agentsN8n/`):
- **Vite + React + TS**: feedback rápido, SPA simples, build moderno.
- **Express**: API mínima para proteger segredos (URLs/tokens do n8n) e evitar expor chaves no frontend.
- **Supabase**: acelera Auth + banco, reduz boilerplate.
- **n8n**: orquestração de integrações externas (Stripe, SunoAPI, Shotstack, X/Twitter) com baixa fricção.

1. O n8n chama a **SunoAPI** para gerar áudio (`/api/v1/generate`).
2. (Opcional) Gera vídeo/MP4 (`/api/v1/mp4/generate`).
3. O n8n grava/atualiza registros no Supabase (`musicas`, `criacoes`, etc.).
4. A música aparece no app, e se `em_venda = true`, pode aparecer no Marketplace.
### Padrões (pastas e responsabilidades)

### 3) Marketing/Clipes: Shotstack + X/Twitter + IA
- Frontend:
  - [pages/](pages/) contém rotas/telas.
  - [components/](components/) contém componentes reutilizáveis.
  - [contexts/](contexts/) contém Auth/Player state.
- Backend:
  - [server/index.ts](server/index.ts) define rotas `/api/*`.
  - [server/supabase.ts](server/supabase.ts) encapsula criação de clients e helpers.
  - [server/http.ts](server/http.ts) possui helper de HTTP com timeout.
- n8n:
  - [agentsN8n/](agentsN8n/) contém exports dos workflows.

O workflow “Agent Marketing” (em `agentsN8n/`) é acionado por webhook e faz:
### Trade-offs

- Envia um job para o **Shotstack** renderizar um clipe (via `x-api-key`)
- Faz polling do status do render
- Baixa o vídeo
- Faz upload em partes para o X/Twitter (INIT/APPEND/FINALIZE)
- Gera texto/copy usando IA (ex.: Gemini / modelos via n8n)
- Publica o post
- ✅ Prós: time-to-market alto; integrações complexas ficam no n8n.
- ❌ Contras: parte da “lógica de negócio” fica fora do repo (no n8n); exige disciplina para versionar/exportar workflows.

## Variáveis de ambiente
## Configuração

Use [\.env.example](.env.example) como base.
### Variáveis de ambiente

### Supabase
Baseie-se em [.env.example](.env.example).

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (somente servidor)
Tabela (não inventar valores; exemplos são placeholders):

⚠️ Segurança
- **Nunca** exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend.
- Em produção (Render), configure essa env var no painel do Render.
| Variável | Obrigatória | Padrão | Descrição | Exemplo |
|---|---:|---|---|---|
| `VITE_SUPABASE_URL` | Sim | — | URL do projeto Supabase (usada no frontend e também no backend via fallback) | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Sim | — | Chave anon do Supabase (frontend + validação de usuário no backend) | `ey...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim (backend) | — | Service role key para queries server-side (ex.: buscar música/preço) | `ey...` |
| `N8N_MARKETPLACE_CHECKOUT_URL` | Sim (Marketplace) | — | URL do webhook do n8n para iniciar checkout | `https://<n8n>/webhook/...` |
| `N8N_MARKETPLACE_CHECKOUT_SECRET` | Não | vazio | Bearer token opcional para proteger o webhook do checkout no n8n | `<<<PREENCHER>>>` |
| `N8N_MARKETPLACE_PURCHASE_UPDATE_SECRET` | Recomendado | — | Segredo para autorizar n8n → app no update de compra | `<<<PREENCHER>>>` |
| `N8N_CREATIONS_WEBHOOK_URL` | Sim (criações) | — | URL do webhook do n8n para criações (modo único) | `https://<n8n>/webhook/...` |
| `N8N_CREATIONS_WEBHOOK_SECRET` | Não | vazio | Bearer token opcional para proteger o webhook de criações no n8n | `<<<PREENCHER>>>` |
| `STRIPE_CHECKOUT_EXPIRES_MINUTES` | Não | `60` | Expiração do checkout (minutos), enviada no payload para o n8n | `60` |
| `N8N_MARKETPLACE_CHECKOUT_TIMEOUT_MS` | Não | `15000` | Timeout do backend ao chamar o n8n (checkout) | `15000` |
| `N8N_CREATIONS_WEBHOOK_TIMEOUT_MS` | Não | `15000` | Timeout do backend ao chamar o n8n (criações) | `15000` |
| `GEMINI_API_KEY` | ⚠️ Depende | — | Chave para Gemini; o Vite injeta em `process.env.GEMINI_API_KEY` via config | `<<<PREENCHER>>>` |

### Integração n8n
⚠️ Segurança:

- `N8N_MARKETPLACE_CHECKOUT_URL` (App → n8n)
- `N8N_MARKETPLACE_CHECKOUT_SECRET` (opcional, se seu n8n exigir)
- `N8N_MARKETPLACE_PURCHASE_UPDATE_SECRET` (n8n → App)
- `N8N_CREATIONS_WEBHOOK_URL` ou `N8N_CREATIONS_WEBHOOK_WITH_LYRICS_URL` / `N8N_CREATIONS_WEBHOOK_NO_LYRICS_URL`
- `N8N_CREATIONS_WEBHOOK_SECRET` (opcional)
- Nunca coloque `SUPABASE_SERVICE_ROLE_KEY` em variáveis `VITE_*`.
- Evite commitar `.env` com chaves reais.

### Outros
## Rotas/Comandos principais

- `STRIPE_CHECKOUT_EXPIRES_MINUTES` (opcional)
### Portas/URLs

## Rodar localmente
- Local (frontend): `http://localhost:3000`
- Local (api): `http://localhost:8787`
- Health: `GET /api/health`
- Demo (Render): https://music-ai-d18l.onrender.com/

Pré-requisitos: Node.js LTS.
### Endpoints da API (Express)

1. Instale dependências: `npm install`
2. Crie `.env` (ou `.env.local`) baseado em `.env.example`
3. Suba frontend + API juntos: `npm run dev`
| Método | Rota | Descrição | Auth | Exemplo |
|---|---|---|---|---|
| GET | `/api/health` | Healthcheck do backend | — | `curl http://localhost:8787/api/health` |
| POST | `/api/n8n/billing/checkout` | Cria checkout via n8n e retorna URL | Bearer (Supabase access token) | ver abaixo |
| POST | `/api/n8n/purchases/update` | Atualiza status da compra | Bearer (segredo do n8n) | ver abaixo |
| POST | `/api/n8n/creations/webhook` | Aciona criação via n8n | Bearer (Supabase access token) | ver abaixo |

Portas:
Exemplos de cURL:

- Frontend (Vite): `http://localhost:3000`
- API (Express): `http://localhost:8787`
```bash
curl -X POST http://localhost:8787/api/n8n/billing/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SUPABASE_ACCESS_TOKEN>" \
  -d '{"musicId":"<UUID>"}'
```

## Deploy (Render)
```bash
curl -X POST http://localhost:8787/api/n8n/purchases/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <N8N_MARKETPLACE_PURCHASE_UPDATE_SECRET>" \
  -d '{"purchase_id":"<UUID>","status":"concluido"}'
```

Este repo pode rodar como um único serviço Node que:
```bash
curl -X POST http://localhost:8787/api/n8n/creations/webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SUPABASE_ACCESS_TOKEN>" \
  -d '{"title":"Minha música","theme":"Noite","mode":"inspiration","inspiration_prompt":"algo energético"}'
```

- serve o `dist/` do Vite em produção
- e também expõe `/api/*` via Express
### Páginas/fluxos (SPA)

Passos típicos:
Rotas visíveis no roteador (ver [App.tsx](App.tsx)):

1. Configure as env vars no Render (principalmente `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`/`VITE_SUPABASE_URL`, `SUPABASE_ANON_KEY`/`VITE_SUPABASE_ANON_KEY`, `N8N_*`).
2. Build command: `npm run build`
3. Start command: `npm run start`
- `/` (Home)
- `/login`
- `/register`
- `/marketplace`
- `/library` (protegida)
- `/my-creations` (protegida)
- `/create` (protegida)

URL pública de teste (Render):
## Testes

- https://music-ai-d18l.onrender.com/
### Como rodar

## Sobre os arquivos em agentsN8n/
Não há scripts de testes no `package.json`.

Os JSONs em `agentsN8n/` são exports do n8n e podem conter:
- Unit: <<<PREENCHER>>>
- Integration: <<<PREENCHER>>>
- E2E: <<<PREENCHER>>>

- `path` de Webhook (isso define o endpoint público quando o workflow está ativo)
- URLs de APIs externas (Stripe, SunoAPI, Shotstack, Twitter)
- Referências a credenciais do n8n (por id/nome) — os **segredos reais ficam no n8n**, não no JSON
### Estratégia sugerida (quando adicionar)

Se você for versionar esses arquivos publicamente, revise para não commitar chaves/segredos reais.
- Unit: componentes e helpers (React Testing Library / Vitest)
- Integration: rotas `/api/*` com supertest
- E2E: Playwright (login + marketplace + checkout)

## Observabilidade e Debug

### Logs

- Backend usa logs via `console.*` (ver mensagens no terminal/Render logs).

### Como ativar debug

- <<<PREENCHER>>> (ex.: `DEBUG=*` se você adicionar logger/debug)

### FAQ técnico

✅ Esperado:

- `GET /api/health` retorna `{ "ok": true }`.

❌ Problemas comuns:

- `Missing env var: SUPABASE_SERVICE_ROLE_KEY`
  - Configure `SUPABASE_SERVICE_ROLE_KEY` no ambiente do servidor.
- `Missing N8N_MARKETPLACE_CHECKOUT_URL`
  - Configure `N8N_MARKETPLACE_CHECKOUT_URL` apontando para o webhook correto do n8n.
- `502 n8n returned an error`
  - Verifique logs do n8n e credenciais (Stripe/SunoAPI/Shotstack).

## Segurança

- Secrets: mantidos no backend (`SUPABASE_SERVICE_ROLE_KEY`, `N8N_*_SECRET`) e/ou no cofre de credenciais do n8n.
- CORS: habilitado globalmente no backend (config padrão do `cors`).
- Rate limit: não implementado (<<<PREENCHER>>> se necessário).
- Validações: backend valida presença de campos e autenticação bearer para rotas sensíveis.

## Estrutura do repositório

```text
.
├─ App.tsx
├─ index.html
├─ index.tsx
├─ package.json
├─ vite.config.ts
├─ types.ts
├─ components/
│  ├─ Layout.tsx
│  ├─ MusicPlayer.tsx
│  └─ TrackCard.tsx
├─ contexts/
│  ├─ AuthContext.tsx
│  └─ PlayerContext.tsx
├─ lib/
│  └─ supabase.ts
├─ pages/
│  ├─ Home.tsx
│  ├─ Login.tsx
│  ├─ Register.tsx
│  ├─ Marketplace.tsx
│  ├─ Library.tsx
│  ├─ MyCreations.tsx
│  └─ Create.tsx
├─ server/
│  ├─ index.ts
│  ├─ supabase.ts
│  ├─ http.ts
│  └─ env.ts
└─ agentsN8n/
   ├─ Agente de faturamento (5).json
   ├─ criador de musica Schedule (3).json
   ├─ Agent Marketing ok.json
   └─ modo criativo ( incomparado na aplicação).json
```

## Roadmap

- [ ] Adicionar suíte de testes (unit + integration)
- [ ] Adicionar logger estruturado (pino/winston) + correlação de request
- [ ] Implementar rate limit para `/api/*`
- [ ] Documentar e versionar workflows do n8n com guia de import/config
- [ ] Ajustar páginas de retorno `/checkout/success` e `/checkout/cancel` (<<<PREENCHER>>> se necessário)

## Contribuição

1) Abra uma issue descrevendo o problema/melhoria.
2) Crie um branch: `feat/<descricao>` ou `fix/<descricao>`.
3) Abra PR com descrição clara e checklist.

Conventional Commits (resumo):

- `feat:` nova funcionalidade
- `fix:` correção
- `docs:` documentação
- `chore:` tarefas internas

## Licença e Autor

- Autor/contato: <<<PREENCHER>>>
- Licença: <<<PREENCHER>>>

---

### Testar compra no Stripe (cartões de teste)

Para testar compra no Marketplace em ambiente de testes do Stripe, use os cartões de teste oficiais:

- https://docs.stripe.com/testing?locale=pt-BR
