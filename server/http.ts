export async function fetchJsonWithTimeout(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<{ ok: boolean; status: number; json: any; text: string }> {
  const { timeoutMs, ...rest } = init
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs ?? 15000)

  try {
    const res = await fetch(url, {
      ...rest,
      signal: controller.signal,
    })

    const text = await res.text()
    let json: any = null
    try {
      json = text ? JSON.parse(text) : null
    } catch {
      json = null
    }

    return { ok: res.ok, status: res.status, json, text }
  } finally {
    clearTimeout(timeout)
  }
}
