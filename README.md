<div align="center">
  <img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Music.AI

Plataforma web para **gerar músicas com IA**, publicar no **Marketplace**, vender via **checkout (Stripe)** e acionar **agentes (n8n)** por webhooks para automações (criação, marketing, etc.).

Este projeto foi construído a partir de um app gerado no **Google AI Studio** (base do app + direcionamento de prompts/fluxos), e depois integrado com Supabase + n8n para orquestração.

## Demo (Render)

Para facilitar testes, esta aplicação foi publicada no Render:

- https://music-ai-d18l.onrender.com/

## Visão geral (arquitetura)

Em alto nível:

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

## Tecnologias usadas

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

## Estrutura do repositório

- `pages/` e `components/`: telas e componentes do app
- `contexts/`: Auth + Player
- `lib/supabase.ts`: client do Supabase no frontend
- `server/`: API (Express) usada localmente e também em produção
- `agentsN8n/`: exports de workflows do n8n ("agents")

## Como os Agents (n8n) se conectam ao app (Webhooks)

Existem **dois tipos de “webhook”** no projeto:

1) **App → n8n (chamada de webhook/URL do n8n)**
- O backend chama uma URL do n8n (guardada em env var) para iniciar um processo.
- Ex.: iniciar checkout no Marketplace.

2) **n8n → App (callback para atualizar status/registrar dados)**
- O n8n chama uma rota do backend para atualizar o banco (ex.: compra concluída).
- Essas rotas devem ser protegidas por segredo (Bearer token).

### Onde isso está no código

Rotas principais no backend:

- `POST /api/n8n/billing/checkout` — Browser → App → n8n (checkout)
  - Implementação em [server/index.ts](server/index.ts#L193)
  - Requer `Authorization: Bearer <access_token do Supabase>`
  - Body: `{ "musicId": "..." }`
  - Retorna: `{ url, purchase_id, session_id }`

- `POST /api/n8n/purchases/update` — n8n → App (atualiza compra)
  - Implementação em [server/index.ts](server/index.ts#L289)
  - Requer `Authorization: Bearer <N8N_MARKETPLACE_PURCHASE_UPDATE_SECRET>`
  - Body: `{ purchase_id, status, stripe_session_id?, stripe_payment_intent_id?, error_message? }`

- `POST /api/n8n/creations/webhook` — Browser → App → n8n (criação)
  - Implementação em [server/index.ts](server/index.ts#L324)
  - É usado para acionar um workflow de criação com/sem letras (dependendo do `mode`).

### Onde os Webhooks do n8n ficam

Os workflows exportados em `agentsN8n/` contêm nós do tipo `n8n-nodes-base.webhook`.
Quando você importa esses workflows na sua instância n8n e ativa, eles passam a expor endpoints como:

- `POST https://<seu-n8n>/webhook/<path>` (produção)
- `POST https://<seu-n8n>/webhook-test/<path>` (modo de teste)

O `<path>` é o campo `path` dentro do nó Webhook no JSON.

## Fluxos principais (end-to-end)

### 1) Marketplace: gerar link de pagamento (Stripe)

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

Observação importante:
- Neste repo, o webhook “direto do Stripe” não está implementado no Express. O padrão aqui é:
  **Stripe → n8n → App**.

#### Testar pagamentos (Stripe)

Para testar a compra de alguma música no Marketplace, use os **cartões de teste do Stripe**:

- https://docs.stripe.com/testing?locale=pt-BR

### 2) Criação de música: SunoAPI + Supabase

Um fluxo típico (workflows em `agentsN8n/`):

1. O n8n chama a **SunoAPI** para gerar áudio (`/api/v1/generate`).
2. (Opcional) Gera vídeo/MP4 (`/api/v1/mp4/generate`).
3. O n8n grava/atualiza registros no Supabase (`musicas`, `criacoes`, etc.).
4. A música aparece no app, e se `em_venda = true`, pode aparecer no Marketplace.

### 3) Marketing/Clipes: Shotstack + X/Twitter + IA

O workflow “Agent Marketing” (em `agentsN8n/`) é acionado por webhook e faz:

- Envia um job para o **Shotstack** renderizar um clipe (via `x-api-key`)
- Faz polling do status do render
- Baixa o vídeo
- Faz upload em partes para o X/Twitter (INIT/APPEND/FINALIZE)
- Gera texto/copy usando IA (ex.: Gemini / modelos via n8n)
- Publica o post

## Variáveis de ambiente

Use [\.env.example](.env.example) como base.

### Supabase

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (somente servidor)

⚠️ Segurança
- **Nunca** exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend.
- Em produção (Render), configure essa env var no painel do Render.

### Integração n8n

- `N8N_MARKETPLACE_CHECKOUT_URL` (App → n8n)
- `N8N_MARKETPLACE_CHECKOUT_SECRET` (opcional, se seu n8n exigir)
- `N8N_MARKETPLACE_PURCHASE_UPDATE_SECRET` (n8n → App)
- `N8N_CREATIONS_WEBHOOK_URL` ou `N8N_CREATIONS_WEBHOOK_WITH_LYRICS_URL` / `N8N_CREATIONS_WEBHOOK_NO_LYRICS_URL`
- `N8N_CREATIONS_WEBHOOK_SECRET` (opcional)

### Outros

- `STRIPE_CHECKOUT_EXPIRES_MINUTES` (opcional)

## Rodar localmente

Pré-requisitos: Node.js LTS.

1. Instale dependências: `npm install`
2. Crie `.env` (ou `.env.local`) baseado em `.env.example`
3. Suba frontend + API juntos: `npm run dev`

Portas:

- Frontend (Vite): `http://localhost:3000`
- API (Express): `http://localhost:8787`

## Deploy (Render)

Este repo pode rodar como um único serviço Node que:

- serve o `dist/` do Vite em produção
- e também expõe `/api/*` via Express

Passos típicos:

1. Configure as env vars no Render (principalmente `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`/`VITE_SUPABASE_URL`, `SUPABASE_ANON_KEY`/`VITE_SUPABASE_ANON_KEY`, `N8N_*`).
2. Build command: `npm run build`
3. Start command: `npm run start`

URL pública de teste (Render):

- https://music-ai-d18l.onrender.com/

## Sobre os arquivos em agentsN8n/

Os JSONs em `agentsN8n/` são exports do n8n e podem conter:

- `path` de Webhook (isso define o endpoint público quando o workflow está ativo)
- URLs de APIs externas (Stripe, SunoAPI, Shotstack, Twitter)
- Referências a credenciais do n8n (por id/nome) — os **segredos reais ficam no n8n**, não no JSON

Se você for versionar esses arquivos publicamente, revise para não commitar chaves/segredos reais.

