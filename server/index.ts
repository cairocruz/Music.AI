import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { pickEnv, requireEnv } from './env'
import {
  fetchMusicById,
  getAppOriginFromRequest,
  getUserFromAccessToken,
  parseBearerToken,
  createAdminClient,
} from './supabase'
import { fetchJsonWithTimeout } from './http'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null
  if (Array.isArray(value)) {
    return value[0] && typeof value[0] === 'object' ? (value[0] as Record<string, unknown>) : null
  }
  return value as Record<string, unknown>
}

function sanitizeCheckoutUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  let url = raw.trim()
  if (!url) return null

  url = url.replace(/^=+/, '')

  const wrapped = url.match(/\/checkout\/=([^\s]+)$/i)
  if (wrapped?.[1]) url = wrapped[1]

  url = url.replace(/^https:\/(?!\/)/i, 'https://')
  url = url.replace(/^http:\/(?!\/)/i, 'http://')

  if (/^checkout\.stripe\.com\//i.test(url)) url = `https://${url}`
  if (!/^https?:\/\//i.test(url)) return null
  return url
}

function pickN8nWebhookUrl(mode: 'inspiration' | 'lyrics') {
  // Preferred: single webhook URL for both modes. `mode` is sent in the payload.
  const single = process.env.N8N_CREATIONS_WEBHOOK_URL

  // Primary (new) env vars
  const withLyrics = process.env.N8N_CREATIONS_WEBHOOK_WITH_LYRICS_URL
  const withoutLyrics = process.env.N8N_CREATIONS_WEBHOOK_NO_LYRICS_URL

  // Secondary / backwards-compatible env vars
  const legacySingle = process.env.N8N_WEBHOOK_URL
  const legacyWithLyrics =
    process.env.N8N_WEBHOOK_WITH_LYRICS_URL || process.env.N8N_WEBHOOK_LYRICS_URL
  const legacyWithoutLyrics =
    process.env.N8N_WEBHOOK_NO_LYRICS_URL || process.env.N8N_WEBHOOK_INSPIRATION_URL

  if (single && single.trim().length > 0) return single

  if (mode === 'lyrics') {
    return (
      withLyrics ||
      legacyWithLyrics ||
      // If only the legacy single URL exists, keep working.
      legacySingle ||
      null
    )
  }

  return withoutLyrics || legacyWithoutLyrics || legacySingle || null
}

type ApprovalResult =
  | { approved: true; reason: null }
  | { approved: false; reason: string }

type N8nDecisionDetails = {
  status?: string
  motivo?: string
  risco?: number
}

function parseApprovalFromJson(value: unknown): ApprovalResult | null {
  if (!value || typeof value !== 'object') return null
  const v = value as Record<string, unknown>

  // Support nested shape: { output: { ... } }
  if ('output' in v && v.output && typeof v.output === 'object') {
    const nested = parseApprovalFromJson(v.output)
    if (nested) return nested
  }

  // Support n8n shape: { status: 'reprovado'|'aprovado', motivo?: string }
  const statusRaw = v.status
  if (typeof statusRaw === 'string') {
    const normalized = statusRaw.trim().toLowerCase()
    if (normalized.includes('reprov')) {
      const motivoRaw = v.motivo ?? v.reason ?? v.message ?? v.error ?? v.error_message
      const motivo = typeof motivoRaw === 'string' ? motivoRaw : 'Não aprovado'
      return { approved: false, reason: motivo.trim() || 'Não aprovado' }
    }

    if (normalized.includes('aprov')) {
      return { approved: true, reason: null }
    }
  }

  const approvedRaw =
    v.approved ??
    v.aprovado ??
    v.isApproved ??
    v.is_approved ??
    v.approval ??
    null

  if (approvedRaw === null || approvedRaw === undefined) return null

  const approved = Boolean(approvedRaw)
  if (approved) return { approved: true, reason: null }

  const reasonRaw =
    v.reason ??
    v.motivo ??
    v.message ??
    v.error ??
    v.error_message ??
    'Não aprovado'

  const reason = typeof reasonRaw === 'string' ? reasonRaw : 'Não aprovado'
  return { approved: false, reason: reason.trim() || 'Não aprovado' }
}

function extractN8nDecisionDetails(value: unknown): N8nDecisionDetails {
  if (!value || typeof value !== 'object') return {}
  const v = value as Record<string, unknown>

  // Prefer { output: {...} } when present
  const base: Record<string, unknown> =
    'output' in v && v.output && typeof v.output === 'object'
      ? (v.output as Record<string, unknown>)
      : v

  const status = typeof base.status === 'string' ? base.status : undefined
  const motivo = typeof base.motivo === 'string' ? base.motivo : undefined
  const riscoRaw = base.risco
  const risco = typeof riscoRaw === 'number' ? riscoRaw : undefined

  return { status, motivo, risco }
}

function pickString(obj: Record<string, unknown> | null, keys: string[]): string | null {
  if (!obj) return null
  for (const key of keys) {
    const val = obj[key]
    if (typeof val === 'string' && val.trim()) return val
  }
  return null
}

function pickNestedString(parent: Record<string, unknown> | null, containerKey: string, keys: string[]): string | null {
  if (!parent) return null
  const container = asObject(parent[containerKey])
  return pickString(container, keys)
}

function normalizeN8nResponse(payload: unknown): { url: string | null; purchase_id: string | null; session_id: string | null; error: string | null } {
  const obj = asObject(payload)
  const error = pickString(obj, ['error', 'message'])

  const rawUrl = pickString(obj, ['url', 'URL', 'checkout_url', 'checkoutUrl'])
  const url = sanitizeCheckoutUrl(rawUrl)

  const session_id = pickString(obj, ['session_id', 'sessionId', 'id'])
  const purchase_id =
    pickString(obj, ['purchase_id', 'purchaseId']) ??
    pickNestedString(obj, 'metadata', ['purchase_id', 'purchaseId']) ??
    pickNestedString(obj, 'metadados', ['purchase_id', 'purchaseId'])

  return { url, purchase_id, session_id, error }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

// Frontend -> API -> n8n (checkout)
app.post('/api/n8n/billing/checkout', async (req, res) => {
  const accessToken = parseBearerToken(req.header('authorization'))
  if (!accessToken) {
    // eslint-disable-next-line no-console
    console.warn('[api] checkout: missing Authorization bearer token')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { user, error: userError } = await getUserFromAccessToken(accessToken)
  if (userError || !user) {
    // eslint-disable-next-line no-console
    console.warn('[api] checkout: invalid/expired supabase token')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const musicId = String((req.body?.musicId ?? '') as string).trim()
  if (!musicId) return res.status(400).json({ error: 'Missing musicId' })

  const { music, error: musicError } = await fetchMusicById(musicId)
  if (musicError) return res.status(400).json({ error: musicError })
  if (!music) return res.status(404).json({ error: 'Music not found' })

  const price = Number(music.preco ?? 0)
  if (!Number.isFinite(price) || price < 0) return res.status(400).json({ error: 'Invalid price' })
  if (price === 0) return res.status(400).json({ error: 'Free item' })

  const n8nUrl = pickEnv('N8N_MARKETPLACE_CHECKOUT_URL', 'N8N_BILLING_CHECKOUT_URL')
  if (!n8nUrl) {
    return res.status(500).json({ error: 'Missing N8N_MARKETPLACE_CHECKOUT_URL' })
  }

  const n8nToken = pickEnv('N8N_MARKETPLACE_CHECKOUT_SECRET', 'N8N_BILLING_CHECKOUT_SECRET') ?? ''

  const origin = getAppOriginFromRequest(req)

  const payload = {
    event: 'start_checkout',
    // Match the existing implementation used by your n8n flow.
    source: 'cwmia-web',
    created_at: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email ?? null,
    },
    purchase: {
      kind: 'marketplace_music',
      music_id: music.id,
      amount: price,
      currency: 'brl',
      title: music.titulo,
    },
    redirect: {
      // Keep keys and placeholders identical to the known-working route.
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&purchase_id={PURCHASE_ID}`,
      cancel_url: `${origin}/checkout/cancel?purchase_id={PURCHASE_ID}`,
    },
    policy: {
      expires_minutes: Number(process.env.STRIPE_CHECKOUT_EXPIRES_MINUTES ?? 60),
    },
  }

  const { ok, status, json, text } = await fetchJsonWithTimeout(n8nUrl, {
    method: 'POST',
    timeoutMs: Number(process.env.N8N_MARKETPLACE_CHECKOUT_TIMEOUT_MS ?? 15000),
    headers: {
      'Content-Type': 'application/json',
      ...(n8nToken ? { Authorization: `Bearer ${n8nToken}` } : {}),
    },
    body: JSON.stringify(payload),
  })

  if (!ok) {
    // eslint-disable-next-line no-console
    console.error('[api] n8n checkout error', { status, body: json ?? text })
    return res.status(502).json({ error: 'n8n returned an error', status, body: json ?? text })
  }

  // n8n might return JSON, array, or (rarely) a plain text URL.
  const normalized = normalizeN8nResponse(json)
  const fallbackUrl = sanitizeCheckoutUrl(text)

  const finalUrl = normalized.url ?? fallbackUrl
  if (!finalUrl) {
    // eslint-disable-next-line no-console
    console.error('[api] n8n checkout missing url', { status, body: json ?? text })
    return res.status(502).json({ error: normalized.error ?? 'Missing checkout URL from n8n', status, body: json ?? text })
  }

  return res.json({
    url: finalUrl,
    purchase_id: normalized.purchase_id,
    session_id: normalized.session_id,
  })
})

// n8n -> API (update purchase status)
app.post('/api/n8n/purchases/update', async (req, res) => {
  const expected =
    (process.env.N8N_MARKETPLACE_PURCHASE_UPDATE_SECRET ?? '').trim() ||
    (process.env.N8N_BILLING_INBOUND_SECRET ?? '').trim()

  if (!expected) {
    return res.status(500).json({ error: 'Missing N8N_MARKETPLACE_PURCHASE_UPDATE_SECRET' })
  }

  const token = parseBearerToken(req.header('authorization'))
  if (!token || token !== expected) return res.status(401).json({ error: 'Unauthorized' })

  const purchaseId = String((req.body?.purchase_id ?? '') as string).trim()
  if (!purchaseId) return res.status(400).json({ error: 'purchase_id is required' })

  const status = (req.body?.status ?? 'concluido') as string

  const patch: Record<string, unknown> = { status }
  if (req.body?.stripe_session_id !== undefined) patch.stripe_session_id = req.body.stripe_session_id
  if (req.body?.stripe_payment_intent_id !== undefined) patch.stripe_payment_intent_id = req.body.stripe_payment_intent_id
  if (req.body?.error_message !== undefined) patch.error_message = req.body.error_message

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('compras')
    .update(patch)
    .eq('id', purchaseId)
    .select()
    .maybeSingle()

  if (error) return res.status(400).json({ error: error.message })
  return res.json({ ok: true, purchase: data ?? null })
})

// Frontend -> API -> n8n (creations webhook)
app.post('/api/n8n/creations/webhook', async (req, res) => {
  const accessToken = parseBearerToken(req.header('authorization'))
  if (!accessToken) return res.status(401).json({ error: 'Unauthorized' })

  const { user, error: userError } = await getUserFromAccessToken(accessToken)
  if (userError || !user) return res.status(401).json({ error: 'Unauthorized' })

  let body
  try {
    body = req.body
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' })
  }

  const theme = (body.theme ?? '').trim()
  const mode = body.mode === 'lyrics' ? 'lyrics' : 'inspiration'
  const inspirationPrompt = (body.inspiration_prompt ?? '').trim()
  const lyrics = (body.lyrics ?? '').trim()

  if (!theme) {
    return res.status(400).json({ error: 'theme is required' })
  }

  if (mode === 'inspiration' && !inspirationPrompt) {
    return res.status(400).json({ error: 'inspiration_prompt is required when mode=inspiration' })
  }

  if (mode === 'lyrics' && !lyrics) {
    return res.status(400).json({ error: 'lyrics is required when mode=lyrics' })
  }

  const title = (body.title ?? '').trim()
  if (!title) {
    return res.status(400).json({ error: 'title is required' })
  }

  const webhookUrl = pickN8nWebhookUrl(mode)
  if (!webhookUrl) {
    return res.status(500).json({
      error:
        'Missing N8N webhook URL. Set N8N_CREATIONS_WEBHOOK_WITH_LYRICS_URL and N8N_CREATIONS_WEBHOOK_NO_LYRICS_URL (or legacy N8N_WEBHOOK_URL).',
    })
  }

  const timeoutMs = Number(process.env.N8N_CREATIONS_WEBHOOK_TIMEOUT_MS ?? 15000)
  const bearerToken = (process.env.N8N_CREATIONS_WEBHOOK_SECRET ?? '').trim() || null

  const payload = {
    title,
    mode,
    input_type: mode === 'lyrics' ? 'lyrics' : 'prompt',
    has_lyrics: mode === 'lyrics',
    theme,
    inspiration_prompt: mode === 'inspiration' ? inspirationPrompt : null,
    lyrics: mode === 'lyrics' ? lyrics : null,
    user: {
      id: user.id,
      email: user.email ?? null,
    },
    source: 'cwmia-web',
    created_at: new Date().toISOString(),
  }

  let upstreamRes
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    upstreamRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    clearTimeout(timeout)
  } catch {
    return res.status(502).json({ error: 'Failed to reach N8N webhook' })
  }

  const upstreamContentType = upstreamRes.headers.get('content-type') || ''
  const raw = await upstreamRes.text()

  if (!upstreamRes.ok) {
    return res.status(502).json({
      error: 'N8N webhook returned an error',
      status: upstreamRes.status,
      body: raw,
    })
  }

  let approval = null
  let upstream = raw
  let details: N8nDecisionDetails = {}

  if (upstreamContentType.includes('application/json')) {
    try {
      upstream = JSON.parse(raw)
      approval = parseApprovalFromJson(upstream)
      details = extractN8nDecisionDetails(upstream)
    } catch {
      // fallthrough to text
    }
  }

  if (!approval) {
    approval = { approved: true, reason: null }
  }

  if (!approval.approved) {
    const creationId =
      typeof upstream === 'object' && upstream && 'creation_id' in upstream
        ? String((upstream.creation_id ?? ''))
        : null

    return res.status(422).json({
      creation_id: creationId,
      approved: false,
      reason: approval.reason,
      status: details.status ?? 'reprovado',
      motivo: details.motivo ?? approval.reason,
      risco: details.risco ?? null,
      upstream,
    })
  }

  const creationId =
    typeof upstream === 'object' && upstream && 'creation_id' in upstream
      ? String((upstream.creation_id ?? ''))
      : null

  return res.status(200).json({
    creation_id: creationId,
    approved: true,
    status: details.status ?? 'aprovado',
    motivo: details.motivo ?? null,
    risco: details.risco ?? null,
    upstream,
  })
})

app.post('/api/n8n/creations/complete', (_req, res) => {
  return res.status(410).json({
    error: 'Deprecated endpoint',
    message: 'This endpoint is disabled. n8n must write creation/music records directly to Supabase.',
  })
})

// In production (e.g., Render), serve the Vite build output.
if ((process.env.NODE_ENV ?? '').toLowerCase() === 'production') {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const distDir = path.resolve(__dirname, '..', 'dist')

  app.use(express.static(distDir))
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).end()
    return res.sendFile(path.join(distDir, 'index.html'))
  })
}

// Render sets PORT. Keep API_PORT for local compatibility.
const port = Number(process.env.PORT ?? process.env.API_PORT ?? 8787)
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[api] listening on http://localhost:${port}`)
})
