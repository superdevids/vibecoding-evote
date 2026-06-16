import type { DataCollection, PaginatedResult, QueryOptions } from '@/lib/types'

// MySQL adapter placeholder for future use.
// When DB_DRIVER=mysql, this adapter uses Prisma ORM.
// See /prisma/schema.prisma for the full schema.
// Migration: npx prisma migrate dev
// Migration data from JSON: npm run migrate-json-to-mysql

export function createMySqlCollection(_collectionName: string): DataCollection {
  throw new Error(
    'MySQL adapter not yet loaded. Ensure DATABASE_URL is set and run: npx prisma generate && npx prisma migrate dev'
  )
}
