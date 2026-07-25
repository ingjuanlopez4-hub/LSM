import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../server/app.js'
import { readConfig } from '../server/config.js'
import { migrate, openDatabase, type Database } from '../server/database.js'
import { seedDatabase } from '../server/seed-data.js'

let db: Database
let server: Server
let baseUrl: string

beforeEach(async () => {
  db = openDatabase(':memory:')
  migrate(db)
  seedDatabase(db)
  const config = readConfig({
    NODE_ENV: 'test', DATABASE_PATH: ':memory:', CORS_ORIGINS: 'http://localhost:5173',
    LOG_LEVEL: 'silent', RATE_LIMIT_MAX: '10', RATE_LIMIT_WINDOW_MS: '60000',
  })
  server = createServer(createApp({ db, config }))
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

afterEach(async () => {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  db.close()
})

async function json(path: string, init?: RequestInit) {
  const response = await fetch(`${baseUrl}${path}`, init)
  return { response, body: await response.json() as any }
}

const jsonHeaders = { 'content-type': 'application/json' }

describe('security boundaries', () => {
  it('ignores spoofed identity and emits hardened API headers', async () => {
    const { response, body } = await json('/api/v1/me', {
      headers: { 'X-User-Id': 'admin', Authorization: 'Bearer attacker', 'X-Request-Id': '<bad value>' },
    })
    expect(body.data.id).toBe('demo-andrea')
    expect(response.headers.get('x-powered-by')).toBeNull()
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(response.headers.get('x-frame-options')).toBe('DENY')
    expect(response.headers.get('content-security-policy')).toContain("default-src 'none'")
    expect(response.headers.get('x-request-id')).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('handles allowed preflight and denies cross-origin state changes before parsing', async () => {
    const preflight = await fetch(`${baseUrl}/api/v1/posts`, {
      method: 'OPTIONS',
      headers: { Origin: 'http://localhost:5173', 'Access-Control-Request-Method': 'POST' },
    })
    expect(preflight.status).toBe(204)
    expect(preflight.headers.get('access-control-allow-origin')).toBe('http://localhost:5173')
    expect(preflight.headers.get('access-control-allow-credentials')).toBeNull()
    expect(preflight.headers.get('vary')).toContain('Origin')

    const denied = await json('/api/v1/posts', {
      method: 'POST', headers: { ...jsonHeaders, Origin: 'https://evil.example' }, body: '{not-json',
    })
    expect(denied.response.status).toBe(403)
    expect(denied.body.error.code).toBe('CORS_ORIGIN_DENIED')
    expect(denied.response.headers.get('access-control-allow-origin')).toBeNull()
    expect(denied.response.headers.get('vary')).toContain('Origin')
  })

  it('returns bounded JSON errors for malformed and oversized bodies', async () => {
    const malformed = await json('/api/v1/posts', { method: 'POST', headers: jsonHeaders, body: '{"topic":' })
    expect(malformed.response.status).toBe(400)
    expect(malformed.body.error.code).toBe('INVALID_JSON')

    const oversized = await json('/api/v1/posts', {
      method: 'POST', headers: jsonHeaders, body: JSON.stringify({ topic: 'x', body: 'a'.repeat(33_000) }),
    })
    expect(oversized.response.status).toBe(413)
    expect(oversized.body.error.code).toBe('PAYLOAD_TOO_LARGE')

    const unsupported = await json('/api/v1/posts', {
      method: 'POST', headers: { 'content-type': 'application/json; charset=iso-8859-1' }, body: '{}',
    })
    expect(unsupported.response.status).toBe(415)
    expect(unsupported.body.error.code).toBe('UNSUPPORTED_ENCODING')
  })

  it('rejects mass assignment, parameter pollution, and invalid resource IDs', async () => {
    const extra = await json('/api/v1/posts', {
      method: 'POST', headers: jsonHeaders,
      body: JSON.stringify({ topic: 'Seguridad', body: 'Texto', userId: 'admin', points: 999_999 }),
    })
    expect(extra.response.status).toBe(422)

    const pollution = await json('/api/v1/courses?page=1&page=2')
    expect(pollution.response.status).toBe(422)

    const traversal = await json('/api/v1/courses/..%2F..%2Fetc%2Fpasswd')
    expect(traversal.response.status).toBe(422)
    expect(traversal.body.error.code).toBe('VALIDATION_ERROR')

    const malformedUrl = await json('/api/v1/courses/%E0%A4%A')
    expect(malformedUrl.response.status).toBe(400)
    expect(malformedUrl.body.error.code).toBe('INVALID_URL_ENCODING')
  })

  it('uses bound SQL parameters and enforces the course/lesson relationship', async () => {
    const injection = await json(`/api/v1/courses?q=${encodeURIComponent("' OR 1=1 --")}`)
    expect(injection.response.status).toBe(200)
    expect(injection.body.meta.total).toBe(0)

    const badRelation = await json('/api/v1/courses/identidad-sorda/lessons/lsm-cero-8/progress', {
      method: 'PUT', headers: jsonHeaders, body: JSON.stringify({ status: 'completed' }),
    })
    expect(badRelation.response.status).toBe(404)
    expect(badRelation.body.error.code).toBe('LESSON_NOT_FOUND')
    expect((db.prepare('SELECT COUNT(*) count FROM courses').get() as { count: number }).count).toBeGreaterThan(0)
  })

  it('stores markup only as JSON text, without creating an HTML response sink', async () => {
    const payload = '<img src=x onerror=alert(1)><script>alert(1)</script>'
    const created = await json('/api/v1/posts', {
      method: 'POST', headers: jsonHeaders, body: JSON.stringify({ topic: 'XSS', body: payload }),
    })
    expect(created.response.status).toBe(201)
    const feed = await json('/api/v1/posts')
    expect(feed.response.headers.get('content-type')).toContain('application/json')
    expect(feed.body.data.find((post: { id: string }) => post.id === created.body.data.id).body).toBe(payload)
  })

  it('serializes concurrent replays and awards a challenge only once', async () => {
    const before = (await json('/api/v1/me')).body.data.points
    const submit = () => json('/api/v1/challenges/daily-gracias/attempts', {
      method: 'POST', headers: { ...jsonHeaders, 'Idempotency-Key': 'parallel-attempt' },
      body: JSON.stringify({ answer: 'Gracias' }),
    })
    const results = await Promise.all([submit(), submit(), submit()])
    expect(results.map(result => result.response.status).sort()).toEqual([200, 200, 201])
    expect(results.filter(result => result.body.data.pointsAwarded === 15)).toHaveLength(3)
    expect((await json('/api/v1/me')).body.data.points).toBe(before + 15)
  })

  it('rate limits repeated API abuse with standard limit metadata', async () => {
    const responses = []
    for (let index = 0; index < 11; index++) responses.push(await json('/api/v1/me'))
    expect(responses[9].response.status).toBe(200)
    expect(responses[9].response.headers.get('ratelimit-remaining')).toBe('0')
    expect(responses[10].response.status).toBe(429)
    expect(responses[10].body.error.code).toBe('RATE_LIMITED')
  })
})

describe('production configuration guard', () => {
  it('cannot enable the demo API in production with an override', () => {
    expect(() => readConfig({ NODE_ENV: 'production', AUTH_MODE: 'demo', ALLOW_DEMO_AUTH_IN_PRODUCTION: 'true' })).toThrow(/disabled in production/)
  })

  it('rejects CORS entries that are not exact HTTP origins', () => {
    expect(() => readConfig({ NODE_ENV: 'test', CORS_ORIGINS: 'https://app.example/path' })).toThrow(/exact HTTP\(S\) origins/)
  })
})
