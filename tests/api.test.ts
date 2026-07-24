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
  const config = readConfig({ NODE_ENV: 'test', DATABASE_PATH: ':memory:', CORS_ORIGINS: 'http://localhost:5173', LOG_LEVEL: 'silent', RATE_LIMIT_MAX: '1000' })
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

describe('system and catalog', () => {
  it('reports readiness and serves filtered, bounded catalog data', async () => {
    const ready = await json('/ready')
    expect(ready.response.status).toBe(200)
    const catalog = await json('/api/v1/courses?level=Avanzado&pageSize=1')
    expect(catalog.response.status).toBe(200)
    expect(catalog.body.data).toHaveLength(1)
    expect(catalog.body.meta.total).toBe(2)
  })

  it('returns uniform validation and CORS errors', async () => {
    const invalid = await json('/api/v1/courses?pageSize=999')
    expect(invalid.response.status).toBe(422)
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR')
    expect(invalid.body.requestId).toBeTruthy()
    const cors = await json('/api/v1/me', { headers: { Origin: 'https://evil.example' } })
    expect(cors.response.status).toBe(403)
    expect(cors.body.error.code).toBe('CORS_ORIGIN_DENIED')
  })
})

describe('points and idempotency', () => {
  it('awards lesson points only on the first completion', async () => {
    const before = (await json('/api/v1/me')).body.data.points
    const request = { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'completed', watchedSeconds: 600 }) }
    const first = await json('/api/v1/courses/lsm-cero/lessons/lsm-cero-8/progress', request)
    const second = await json('/api/v1/courses/lsm-cero/lessons/lsm-cero-8/progress', request)
    expect(first.body.data.pointsAwarded).toBe(25)
    expect(second.body.data.pointsAwarded).toBe(0)
    expect((await json('/api/v1/me')).body.data.points).toBe(before + 25)
  })

  it('replays a challenge attempt and never awards its completion twice', async () => {
    const submit = (key: string) => json('/api/v1/challenges/daily-gracias/attempts', { method: 'POST', headers: { 'content-type': 'application/json', 'Idempotency-Key': key }, body: JSON.stringify({ answer: 'Gracias' }) })
    const before = (await json('/api/v1/me')).body.data.points
    const first = await submit('attempt-1')
    const replay = await submit('attempt-1')
    const another = await submit('attempt-2')
    expect(first.response.status).toBe(201)
    expect(first.body.data.pointsAwarded).toBe(15)
    expect(replay.response.status).toBe(200)
    expect(replay.body.data).toMatchObject({ replayed: true, pointsAwarded: 15, attemptId: first.body.data.attemptId })
    expect(another.body.data.pointsAwarded).toBe(0)
    expect((await json('/api/v1/me')).body.data.points).toBe(before + 15)
  })

  it('requires a valid idempotency key for challenge attempts', async () => {
    const result = await json('/api/v1/challenges/daily-gracias/attempts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ answer: 'Gracias' }) })
    expect(result.response.status).toBe(422)
    expect(result.body.error.code).toBe('INVALID_IDEMPOTENCY_KEY')
  })

  it('rejects reuse of an idempotency key with a different payload', async () => {
    const headers = { 'content-type': 'application/json', 'Idempotency-Key': 'same-key' }
    await json('/api/v1/challenges/daily-gracias/attempts', { method: 'POST', headers, body: JSON.stringify({ answer: 'Gracias' }) })
    const conflict = await json('/api/v1/challenges/daily-gracias/attempts', { method: 'POST', headers, body: JSON.stringify({ answer: 'Por favor' }) })
    expect(conflict.response.status).toBe(409)
    expect(conflict.body.error.code).toBe('IDEMPOTENCY_CONFLICT')
  })
})

describe('community and events', () => {
  it('likes and reserves idempotently', async () => {
    const put = { method: 'PUT' }
    const like1 = await json('/api/v1/posts/post-mariana/like', put)
    const like2 = await json('/api/v1/posts/post-mariana/like', put)
    expect(like1.response.status).toBe(201)
    expect(like2.response.status).toBe(200)
    expect(like2.body.data.likes).toBe(25)

    const reservation1 = await json('/api/v1/events/conversatorio-jovenes-sordos/reservation', put)
    const reservation2 = await json('/api/v1/events/conversatorio-jovenes-sordos/reservation', put)
    expect(reservation1.response.status).toBe(201)
    expect(reservation2.response.status).toBe(200)
    expect(reservation2.body.data.created).toBe(false)
  })
})
