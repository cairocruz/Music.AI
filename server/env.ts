export function pickEnv(...keys: string[]): string | null {
  for (const key of keys) {
    const val = process.env[key]
    if (typeof val === 'string' && val.trim().length > 0) return val.trim()
  }
  return null
}

export function requireEnv(...keys: string[]): string {
  const val = pickEnv(...keys)
  if (!val) {
    throw new Error(`Missing env var: ${keys.join(' or ')}`)
  }
  return val
}
