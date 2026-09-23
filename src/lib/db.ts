import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: pg.Pool | undefined
  poolEndpoint: string | undefined
}

// Ensure connection string always uses the resilient PgBouncer pooled endpoint (-pooler)
function getPooledConnectionString(): string {
  let url = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED || ''
  if (url.includes('.c-10.') && !url.includes('-pooler')) {
    url = url.replace('.c-10.', '-pooler.c-10.')
  }
  return url
}

const connectionString = getPooledConnectionString()

// If an existing pool was connected to an unpooled URL or stale config, terminate and reset it
if (globalForPrisma.pool) {
  const isStale =
    !globalForPrisma.poolEndpoint?.includes('-pooler') ||
    globalForPrisma.poolEndpoint !== connectionString

  if (isStale) {
    try {
      globalForPrisma.pool.end()
    } catch {}
    globalForPrisma.pool = undefined
    globalForPrisma.prisma = undefined
  }
}

const pool =
  globalForPrisma.pool ??
  new pg.Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
    keepAlive: true,
  })

globalForPrisma.poolEndpoint = connectionString

pool.on('error', (err) => {
  console.warn('[pg-pool] Connection pool warning:', err.message)
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.pool = pool

const adapter = new PrismaPg(pool)

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db