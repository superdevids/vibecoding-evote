interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const store = new Map<string, CacheEntry<unknown>>()

const DEFAULT_TTL = 60_000

export function getCached<T>(key: string): T | undefined {
  const entry = store.get(key)
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return undefined
  }
  return entry.value as T
}

export function setCache<T>(key: string, value: T, ttlMs: number = DEFAULT_TTL): void {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  })
}

export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    store.clear()
    return
  }

  if (pattern.includes("*")) {
    const regex = new RegExp(
      "^" + pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$"
    )
    for (const key of store.keys()) {
      if (regex.test(key)) {
        store.delete(key)
      }
    }
  } else {
    store.delete(pattern)
  }
}

export function cacheKeys(): string[] {
  return Array.from(store.keys())
}
