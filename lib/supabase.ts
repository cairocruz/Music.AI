import { createClient } from '@supabase/supabase-js';

// Vite exposes env vars via `import.meta.env` and requires the `VITE_` prefix.
// We fail fast if they're missing to avoid silently running with broken auth/DB.
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!SUPABASE_URL) throw new Error('Missing VITE_SUPABASE_URL');
if (!SUPABASE_ANON_KEY) throw new Error('Missing VITE_SUPABASE_ANON_KEY');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
