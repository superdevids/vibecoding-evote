import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import type { BaseEntity, PaginatedResult, QueryOptions, DataCollection } from '@/lib/types'

const DATA_DIR = path.resolve(process.cwd(), 'data')

let memoryCache: Record<string, { data: unknown[]; timestamp: number }> = {}
const CACHE_TTL = 5000
let writeQueue: Map<string, Promise<void>> = new Map()

function getFilePath(collection: string): string {
  return path.join(DATA_DIR, `${collection}.json`)
}

async function atomicWrite(filePath: string, data: string): Promise<void> {
  const tmpPath = filePath + '.tmp'
  await fs.writeFile(tmpPath, data, 'utf-8')
  await fs.rename(tmpPath, filePath)
}

async function readJSON<T>(collection: string): Promise<T[]> {
  const now = Date.now()
  const cached = memoryCache[collection]
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data as T[]
  }
  const filePath = getFilePath(collection)
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    const data = JSON.parse(raw) as T[]
    memoryCache[collection] = { data, timestamp: now }
    return data
  } catch {
    return []
  }
}

function invalidateCache(collection: string): void {
  delete memoryCache[collection]
}

async function writeJSON<T>(collection: string, data: T[]): Promise<void> {
  invalidateCache(collection)
  const filePath = getFilePath(collection)
  const jsonStr = JSON.stringify(data, null, 2)
  await atomicWrite(filePath, jsonStr)
}

async function enqueueWrite<T>(collection: string, fn: (data: T[]) => T[]): Promise<void> {
  const prev = writeQueue.get(collection) || Promise.resolve()
  const next = prev.then(async () => {
    const data = await readJSON<T>(collection)
    const newData = fn(data)
    await writeJSON(collection, newData)
  })
  writeQueue.set(collection, next)
  await next
}

function matchesQuery<T>(item: T, where?: Record<string, unknown>): boolean {
  if (!where) return true
  for (const [key, value] of Object.entries(where)) {
    const itemVal = (item as Record<string, unknown>)[key]
    if (Array.isArray(value)) {
      if (!value.includes(itemVal)) return false
    } else {
      if (itemVal !== value) return false
    }
  }
  return true
}

function applyPagination<T>(items: T[], opts?: QueryOptions): PaginatedResult<T> {
  const where = opts?.where
  let filtered = where ? items.filter((item) => matchesQuery(item, where)) : [...items]

  if (opts?.orderBy) {
    const { field, direction } = opts.orderBy
    filtered.sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[field]
      const bVal = (b as Record<string, unknown>)[field]
      if (aVal == null) return 1
      if (bVal == null) return -1
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return direction === 'asc'
        ? Number(aVal) - Number(bVal)
        : Number(bVal) - Number(aVal)
    })
  }

  const total = filtered.length
  const page = opts?.pagination?.page || 1
  const pageSize = opts?.pagination?.pageSize || total || 50
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const data = filtered.slice(start, start + pageSize)

  return { data, total, page, pageSize, totalPages }
}

function createEntity<T>(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): T {
  const now = new Date().toISOString()
  return {
    ...(data as Record<string, unknown>),
    id: data.id || uuidv4(),
    createdAt: now,
    updatedAt: now,
  } as T
}

function updateEntity<T>(existing: T, data: Partial<T>): T {
  return {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
  } as T
}

export function createJsonCollection(collectionName: string): DataCollection {
  return {
    async findMany<T>(opts?: QueryOptions): Promise<PaginatedResult<T>> {
      const items = await readJSON<T>(collectionName)
      return applyPagination(items, opts) as PaginatedResult<T>
    },

    async findById<T>(id: string): Promise<T | null> {
      const items = await readJSON<T>(collectionName)
      const found = items.find((item) => (item as BaseEntity).id === id)
      return found || null
    },

    async findOne<T>(where: Record<string, unknown>): Promise<T | null> {
      const items = await readJSON<T>(collectionName)
      const found = items.find((item) => matchesQuery(item, where))
      return found || null
    },

    async create<T>(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<T> {
      let result: T | undefined
      await enqueueWrite<T>(collectionName, (items) => {
        const newItem = createEntity(data)
        items.push(newItem)
        result = newItem
        return items
      })
      return result!
    },

    async update<T>(id: string, data: Partial<T>): Promise<T | null> {
      let result: T | null = null
      await enqueueWrite<T>(collectionName, (items) => {
        const idx = items.findIndex((item) => (item as BaseEntity).id === id)
        if (idx === -1) return items
        items[idx] = updateEntity(items[idx], data)
        result = items[idx]
        return items
      })
      return result
    },

    async delete(id: string): Promise<boolean> {
      let deleted = false
      await enqueueWrite(collectionName, (items) => {
        const idx = items.findIndex((item) => (item as BaseEntity).id === id)
        if (idx === -1) return items
        items.splice(idx, 1)
        deleted = true
        return items
      })
      return deleted
    },

    async count(opts?: { where?: Record<string, unknown> }): Promise<number> {
      const items = await readJSON(collectionName)
      if (!opts?.where) return items.length
      return items.filter((item) => matchesQuery(item, opts.where)).length
    },

    async append<T>(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<T> {
      let result: T | undefined
      await enqueueWrite<T>(collectionName, (items) => {
        const newItem = createEntity(data)
        items.push(newItem)
        result = newItem
        return items
      })
      return result!
    },
  }
}

export function clearCache(): void {
  memoryCache = {}
}
