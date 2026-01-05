<div align="center">
  <img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Music.AI — Gere músicas com IA, publique e venda no Marketplace

![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/status-MVP-yellow)

**Music.AI** é uma plataforma web para **gerar músicas com IA**, publicar no **Marketplace**, vender via **checkout (Stripe)** e acionar **agentes (n8n)** por webhooks para automações (criação, marketing, etc.).

> 🚀 **Destaque:** O **Frontend** desta aplicação (site/interface) foi desenvolvido utilizando o **Google AI Studio**. A interface visual e a estrutura inicial foram aceleradas graças ao poder do Google Gemini.

---

## 🛠️ Tecnologias Utilizadas

Este projeto utiliza uma stack moderna e robusta. Abaixo, uma visão visual das principais tecnologias e serviços:

### Frontend
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Google AI Studio](https://img.shields.io/badge/Google_AI_Studio-4285F4?style=for-the-badge&logo=google&logoColor=white)

### Backend
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)

### Database & Auth
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

### AI & Automation
![n8n](https://img.shields.io/badge/n8n-FF6584?style=for-the-badge&logo=n8n&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=google%20gemini&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-000000?style=for-the-badge&logo=groq&logoColor=white)
![SunoAPI](https://img.shields.io/badge/SunoAPI-000000?style=for-the-badge&logo=music&logoColor=white)
![Shotstack](https://img.shields.io/badge/Shotstack-000000?style=for-the-badge&logo=video&logoColor=white)

### Payments
![Stripe](https://img.shields.io/badge/Stripe-626CD9?style=for-the-badge&logo=stripe&logoColor=white)

---

## 📚 Sumário
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

---

## Visão geral

Em alto nível:
- **Nome do projeto:** Music.AI
- **Tipo:** Web (SPA) + API (Express)
- **Objetivo:** Autonomous music generation company com criação diária de músicas via IA, billing recorrente e marketing automatizado.
- **Stack:** TypeScript + React (Vite) + Node.js/Express + Supabase + n8n + Stripe + SunoAPI + Shotstack

1. **Frontend (Vite + React):** UI (Login, Home, Marketplace, Player, etc.) construída com auxílio do **Google AI Studio**.
2. **Backend (Express):** expõe rotas `/api/*` para autenticação e orquestração segura.
3. **Supabase:** Auth + banco de dados.
4. **n8n (Agents/Workflows):** automações e integrações externas (Suno, Stripe, Shotstack, Twitter/X, LLMs).

### Demo pública
- **Render (ambiente de teste):** [https://music-ai-d18l.onrender.com/](https://music-ai-d18l.onrender.com/)

---

## Entregáveis do teste

### Checklist dos requisitos
- ✅ Aplicação Web (SPA) com rotas principais
- ✅ Backend simples para rotas `/api/*` e integração com n8n
- ✅ Integração com Supabase (Auth + DB)
- ✅ Marketplace com fluxo de compra via Stripe Checkout (via n8n)
- ✅ Integrações n8n exportadas em [agentsN8n/](agentsN8n/)

### Onde isso está no código
- **Rotas principais backend:** `server/index.ts`
- **Frontend pages:** `pages/`
- **Workflows n8n:** `agentsN8n/`

---

## Demonstração rápida (Quickstart)

### Rodar em 2 minutos (local)

Pré-requisitos: Node.js (LTS).

```bash
npm install
cp .env.example .env
### edite o .env com suas chaves (Supabase, etc)
npm run dev
```

✅ **Esperado:**
- Frontend em `http://localhost:3000`
- API em `http://localhost:8787`
- Healthcheck: `curl http://localhost:8787/api/health` -> `{ "ok": true }`

### Testar pagamentos (Stripe)
Para testar a compra de alguma música no Marketplace, use os **cartões de teste do Stripe**: [Docs Stripe Testing](https://docs.stripe.com/testing?locale=pt-BR).

---

## Como funciona (alto nível)

### Fluxo do usuário
1. **Login:** Usuário se autentica (Supabase Auth).
2. **Marketplace:** Ao clicar em comprar, o frontend chama o backend, que aciona o n8n para criar o checkout no Stripe.
3. **Criação/Agents:** O app aciona workflows do n8n para gerar músicas (SunoAPI), renderizar vídeos (Shotstack) e postar em redes sociais.

### Diagrama

```mermaid
flowchart LR
  U[Usuário (Browser)] -->|SPA| FE[Frontend React + Vite]
  FE -->|Supabase Auth| SB[(Supabase Auth + DB)]
  FE -->|POST /api/*| API[Backend Node.js + Express]

  API -->|Valida token| SB
  API -->|Webhook| N8N[n8n Agents]

  N8N -->|Checkout| Stripe[Stripe API]
  N8N -->|Geração Áudio| Suno[SunoAPI]
  N8N -->|Render Vídeo| Shotstack[Shotstack API]
  N8N -->|Post| X[Twitter/X]
  N8N -->|IA| Gemini[Google AI Studio/Gemini]
```

---

## Arquitetura e decisões técnicas

### Frontend com Google AI Studio
A interface do usuário foi acelerada utilizando o **Google AI Studio**, permitindo prototipagem rápida e geração de código React/Tailwind eficiente.

### Backend (Express)
API mínima para proteger segredos (URLs/tokens do n8n) e evitar expor chaves sensíveis no frontend.

### Orquestração (n8n)
Toda a lógica complexa de integração (Stripe, Suno, Shotstack) reside no n8n, permitindo ajustes rápidos nos fluxos sem deploy de código.

---

## Configuração

Use ` .env.example` como base.

| Variável | Descrição |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave pública do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave secreta (Backend apenas) |
| `N8N_MARKETPLACE_CHECKOUT_URL` | Webhook n8n para checkout |
| `N8N_CREATIONS_WEBHOOK_URL` | Webhook n8n para criação de músicas |

---

## Rotas/Comandos principais

### Portas
- Frontend: `3000`
- API: `8787`

### Endpoints API
- `GET /api/health`: Healthcheck.
- `POST /api/n8n/billing/checkout`: Inicia fluxo de compra.
- `POST /api/n8n/creations/webhook`: Inicia fluxo de criação de música.

---

## Estrutura do repositório

```text
.
├─ App.tsx                  # Rotas principais
├─ components/              # Componentes UI
├─ pages/                   # Páginas da aplicação
├─ server/                  # Backend Express
└─ agentsN8n/               # Workflows n8n exportados (JSON)
```

## Roadmap

- [ ] Adicionar testes unitários e de integração.
- [ ] Implementar logger estruturado.
- [ ] Melhorar tratamento de erros nos webhooks.

## Contribuição
Sinta-se livre para abrir issues e PRs.

## Licença
MIT
