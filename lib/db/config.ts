export type DbDriver = 'json' | 'mysql'

export function getDbDriver(): DbDriver {
  const env = (process.env.DB_DRIVER || 'json').toLowerCase()
  if (env === 'mysql') return 'mysql'
  return 'json'
}
