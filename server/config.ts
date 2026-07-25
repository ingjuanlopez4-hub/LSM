import { loadEnvFile } from 'node:process'
import { resolve } from 'node:path'
import { z } from 'zod'

try { loadEnvFile(resolve('.env')) } catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_HOST: z.string().default('127.0.0.1'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DATABASE_PATH: z.string().default('./data/manos-mx.db'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent']).default('info'),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60_000),
  AUTH_MODE: z.literal('demo').default('demo'),
})

export type Config = ReturnType<typeof readConfig>

export function readConfig(overrides: NodeJS.ProcessEnv = process.env) {
  const env = envSchema.parse(overrides)
  if (env.NODE_ENV === 'production') {
    throw new Error('Demo authentication is disabled in production. Replace it with real authentication and authorization before starting this API.')
  }
  const corsOrigins = env.CORS_ORIGINS.split(',').map(value => value.trim()).filter(Boolean)
  for (const origin of corsOrigins) {
    let parsed: URL
    try { parsed = new URL(origin) } catch { throw new Error(`Invalid CORS origin: ${origin}`) }
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin) throw new Error(`CORS_ORIGINS entries must be exact HTTP(S) origins: ${origin}`)
  }
  return {
    nodeEnv: env.NODE_ENV,
    host: env.API_HOST,
    port: env.API_PORT,
    databasePath: env.DATABASE_PATH === ':memory:' ? ':memory:' : resolve(env.DATABASE_PATH),
    corsOrigins,
    logLevel: env.LOG_LEVEL,
    rateLimitMax: env.RATE_LIMIT_MAX,
    rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS,
    authMode: env.AUTH_MODE,
  }
}
