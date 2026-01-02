import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { pickEnv, requireEnv } from './env'

function getSupabaseUrl(): string {
  return requireEnv('VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL')
}

function getSupabaseAnonKey(): string {
  return requireEnv('VITE_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY')
}

export function createAdminClient(): SupabaseClient {
  const url = getSupabaseUrl()
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export async function getUserFromAccessToken(accessToken: string) {
  const url = getSupabaseUrl()
  const anonKey = getSupabaseAnonKey()

  const client = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })

  const { data, error } = await client.auth.getUser(accessToken)
  if (error) return { user: null, error }
  return { user: data.user, error: null }
}

export type MusicRow = {
  id: string
  titulo: string
  preco: number | null
}

export async function fetchMusicById(musicId: string): Promise<{ music: MusicRow | null; error: string | null }> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('musicas')
    .select('id, titulo, preco')
    .eq('id', musicId)
    .maybeSingle()

  if (error) return { music: null, error: error.message }
  if (!data) return { music: null, error: null }

  return {
    music: {
      id: String((data as any).id),
      titulo: String((data as any).titulo ?? ''),
      preco: (data as any).preco === null || (data as any).preco === undefined ? null : Number((data as any).preco),
    },
    error: null,
  }
}

export function parseBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  return match?.[1] ?? null
}

export function getAppOriginFromRequest(req: import('express').Request): string {
  const proto = (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0]?.trim() || req.protocol
  const host = (req.headers['x-forwarded-host'] as string | undefined)?.split(',')[0]?.trim() || req.get('host')
  return `${proto}://${host}`
}
