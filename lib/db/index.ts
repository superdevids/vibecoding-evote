import { getDbDriver } from './config'
import { createJsonCollection } from './adapters/jsonAdapter'
import { createMySqlCollection } from './adapters/mysqlAdapter'
import type { DataAdapter, DataCollection } from '@/lib/types'

function createAdapter(): DataAdapter {
  const driver = getDbDriver()
  if (driver === 'mysql') {
    return {
      collection(name: string): DataCollection {
        return createMySqlCollection(name)
      },
    }
  }
  return {
    collection(name: string): DataCollection {
      return createJsonCollection(name)
    },
  }
}

export const db = createAdapter()
export { clearCache } from './adapters/jsonAdapter'
export { getDbDriver } from './config'
