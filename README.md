<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/temp/1

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create a `.env.local` file and set the required environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (required for the local API server)
3. (Optional) Set the `GEMINI_API_KEY` in `.env.local` if your flows require it.
4. Run the app:
   `npm run dev`

## n8n Integration (Local API)

This project includes a small local API server that exposes endpoints under `/api/n8n/*` and keeps `N8N_*` secrets on the server side.

- Frontend (Vite): `http://localhost:3000`
- API server (Express): `http://localhost:8787`
- Vite proxies `/api/*` to the API server during development.

### Required `.env` variables

- `N8N_MARKETPLACE_CHECKOUT_URL` (app -> n8n checkout flow)
- `N8N_MARKETPLACE_CHECKOUT_SECRET` (optional)
- `N8N_MARKETPLACE_PURCHASE_UPDATE_SECRET` (required for n8n -> app purchase status updates)

### Endpoints

- `POST /api/n8n/billing/checkout`
  - Browser -> API -> n8n
  - Requires `Authorization: Bearer <supabase_access_token>`
  - Body: `{ "musicId": "..." }`
  - Returns: `{ url, purchase_id, session_id }`

- `POST /api/n8n/purchases/update`
  - n8n -> API (server-to-server)
  - Requires `Authorization: Bearer <N8N_MARKETPLACE_PURCHASE_UPDATE_SECRET>`
  - Body: `{ purchase_id, status, stripe_session_id?, stripe_payment_intent_id?, error_message? }`
