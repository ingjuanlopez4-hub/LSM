import { randomUUID } from 'node:crypto'
import express, { type NextFunction, type Request, type Response } from 'express'
import { z, ZodError } from 'zod'
import type { Config } from './config.js'
import { inTransaction, type Database } from './database.js'
import { openApiDocument } from './openapi.js'

const DEMO_USER_ID = 'demo-andrea'

class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) { super(message) }
}

type Row = Record<string, any>

function parse<T extends z.ZodTypeAny>(schema: T, value: unknown): z.infer<T> {
  const result = schema.safeParse(value)
  if (!result.success) throw new ApiError(422, 'VALIDATION_ERROR', 'La solicitud contiene datos inválidos.', result.error.flatten())
  return result.data
}

function getIdempotencyKey(request: Request): string {
  const value = request.header('Idempotency-Key')?.trim()
  if (!value || value.length > 128 || !/^[\w.:/-]+$/.test(value)) {
    throw new ApiError(422, 'INVALID_IDEMPOTENCY_KEY', 'Idempotency-Key es obligatorio y debe tener entre 1 y 128 caracteres seguros.')
  }
  return value
}

function courseFromRow(row: Row) {
  return {
    id: row.id, title: row.title, eyebrow: row.eyebrow, description: row.description,
    meta: row.meta, category: row.category, level: row.level, color: row.color,
    image: row.image_url, lessons: Number(row.lesson_count),
  }
}

function profile(db: Database) {
  const user = db.prepare(`SELECT id,display_name,first_name,initials,level,points,streak_days,best_streak_days,
    practice_minutes,signs_mastered,daily_goal_minutes,weekly_goal_days FROM users WHERE id=?`).get(DEMO_USER_ID) as Row
  const completedLessons = Number((db.prepare(`SELECT COUNT(*) count FROM lesson_progress WHERE user_id=? AND status='completed'`).get(DEMO_USER_ID) as Row).count)
  const enrolledCourses = Number((db.prepare('SELECT COUNT(*) count FROM enrollments WHERE user_id=?').get(DEMO_USER_ID) as Row).count)
  const completedChallenges = Number((db.prepare('SELECT COUNT(*) count FROM challenge_completions WHERE user_id=?').get(DEMO_USER_ID) as Row).count)
  return {
    id: user.id, displayName: user.display_name, firstName: user.first_name, initials: user.initials, level: user.level,
    points: user.points, streak: { currentDays: user.streak_days, bestDays: user.best_streak_days },
    metrics: { practiceMinutes: user.practice_minutes, signsMastered: user.signs_mastered, completedLessons, enrolledCourses, completedChallenges },
    goals: { dailyMinutes: user.daily_goal_minutes, weeklyDays: user.weekly_goal_days },
  }
}

export function createApp({ db, config }: { db: Database; config: Config }) {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', false)

  app.use((request, response, next) => {
    const requestId = request.header('X-Request-Id')?.slice(0, 100) || randomUUID()
    response.locals.requestId = requestId
    response.setHeader('X-Request-Id', requestId)
    response.setHeader('X-Content-Type-Options', 'nosniff')
    response.setHeader('X-Frame-Options', 'DENY')
    response.setHeader('Referrer-Policy', 'no-referrer')
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    response.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'")
    next()
  })

  app.use((request, response, next) => {
    const started = performance.now()
    response.on('finish', () => {
      if (config.logLevel === 'silent') return
      const level = response.statusCode >= 500 ? 'error' : response.statusCode >= 400 ? 'warn' : 'info'
      console.log(JSON.stringify({ level, message: 'request_completed', requestId: response.locals.requestId, method: request.method, path: request.path, status: response.statusCode, durationMs: Math.round(performance.now() - started) }))
    })
    next()
  })

  app.use(express.json({ limit: '32kb', strict: true }))

  app.use((request, response, next) => {
    const origin = request.header('Origin')
    if (!origin) return next()
    if (!config.corsOrigins.includes(origin)) return next(new ApiError(403, 'CORS_ORIGIN_DENIED', 'Origen no permitido.'))
    response.setHeader('Access-Control-Allow-Origin', origin)
    response.setHeader('Vary', 'Origin')
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type,Idempotency-Key,X-Request-Id')
    response.setHeader('Access-Control-Max-Age', '600')
    if (request.method === 'OPTIONS') return response.status(204).end()
    next()
  })

  const buckets = new Map<string, { count: number; resetAt: number }>()
  app.use((request, response, next) => {
    if (request.path === '/health' || request.path === '/ready') return next()
    const now = Date.now()
    const key = request.ip || 'unknown'
    let bucket = buckets.get(key)
    if (!bucket || bucket.resetAt <= now) {
      if (buckets.size >= 10_000 && !buckets.has(key)) {
        for (const [storedKey, stored] of buckets) if (stored.resetAt <= now) buckets.delete(storedKey)
        if (buckets.size >= 10_000) return next(new ApiError(503, 'RATE_LIMIT_CAPACITY', 'Servicio temporalmente ocupado.'))
      }
      bucket = { count: 0, resetAt: now + config.rateLimitWindowMs }
      buckets.set(key, bucket)
    }
    bucket.count++
    response.setHeader('RateLimit-Limit', String(config.rateLimitMax))
    response.setHeader('RateLimit-Remaining', String(Math.max(0, config.rateLimitMax - bucket.count)))
    response.setHeader('RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)))
    if (bucket.count > config.rateLimitMax) return next(new ApiError(429, 'RATE_LIMITED', 'Demasiadas solicitudes; intenta nuevamente más tarde.'))
    next()
  })

  app.get('/health', (_request, response) => response.json({ data: { status: 'ok' } }))
  app.get('/ready', (_request, response) => {
    try { db.prepare('SELECT 1').get(); response.json({ data: { status: 'ready', database: 'ok' } }) }
    catch { response.status(503).json({ error: { code: 'NOT_READY', message: 'La base de datos no está disponible.' }, requestId: response.locals.requestId }) }
  })
  app.get('/openapi.json', (_request, response) => response.json(openApiDocument))
  app.get('/docs', (_request, response) => response.type('html').send(`<!doctype html><html lang="es"><meta charset="utf-8"><title>Manos MX API</title><body><h1>Manos MX API</h1><p>Contrato OpenAPI: <a href="/openapi.json">/openapi.json</a></p></body></html>`))

  // Auth boundary: this middleware always resolves one server-side demo identity and ignores identity headers.
  app.use('/api/v1', (_request, response, next) => { response.locals.userId = DEMO_USER_ID; next() })

  app.get('/api/v1/me', (_request, response) => response.json({ data: profile(db) }))
  app.patch('/api/v1/me/goals', (request, response, next) => {
    try {
      const body = parse(z.object({ dailyMinutes: z.number().int().min(1).max(240).optional(), weeklyDays: z.number().int().min(1).max(7).optional() }).refine(value => Object.keys(value).length > 0), request.body)
      db.prepare(`UPDATE users SET daily_goal_minutes=COALESCE(?,daily_goal_minutes), weekly_goal_days=COALESCE(?,weekly_goal_days), updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(body.dailyMinutes ?? null, body.weeklyDays ?? null, DEMO_USER_ID)
      response.json({ data: profile(db) })
    } catch (error) { next(error) }
  })

  app.get('/api/v1/courses', (request, response, next) => {
    try {
      const query = parse(z.object({ q: z.string().trim().max(100).optional(), category: z.enum(['Vocabulario', 'Conversación', 'Cultura Sorda', 'Gramática']).optional(), level: z.enum(['Principiante', 'Intermedio', 'Avanzado']).optional(), page: z.coerce.number().int().positive().default(1), pageSize: z.coerce.number().int().min(1).max(50).default(20) }), request.query)
      const filters = ['c.published=1']; const values: any[] = []
      if (query.q) { filters.push(`(lower(c.title) LIKE lower(?) ESCAPE '\\' OR lower(c.description) LIKE lower(?) ESCAPE '\\' OR lower(c.eyebrow) LIKE lower(?) ESCAPE '\\')`); const escaped = `%${query.q.replace(/[\\%_]/g, '\\$&')}%`; values.push(escaped, escaped, escaped) }
      if (query.category) { filters.push('c.category=?'); values.push(query.category) }
      if (query.level) { filters.push('c.level=?'); values.push(query.level) }
      const where = filters.join(' AND ')
      const total = Number((db.prepare(`SELECT COUNT(*) count FROM courses c WHERE ${where}`).get(...values) as Row).count)
      const rows = db.prepare(`SELECT c.*,COUNT(l.id) lesson_count FROM courses c LEFT JOIN lessons l ON l.course_id=c.id WHERE ${where} GROUP BY c.id ORDER BY c.position LIMIT ? OFFSET ?`).all(...values, query.pageSize, (query.page - 1) * query.pageSize) as Row[]
      response.json({ data: rows.map(courseFromRow), meta: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) } })
    } catch (error) { next(error) }
  })

  app.get('/api/v1/courses/:courseId', (request, response, next) => {
    try {
      const course = db.prepare(`SELECT c.*,COUNT(l.id) lesson_count FROM courses c LEFT JOIN lessons l ON l.course_id=c.id WHERE c.id=? AND c.published=1 GROUP BY c.id`).get(request.params.courseId) as Row | undefined
      if (!course) throw new ApiError(404, 'COURSE_NOT_FOUND', 'Curso no encontrado.')
      const lessons = db.prepare(`SELECT l.id,l.title,l.description,l.duration_seconds durationSeconds,l.position,l.points_reward pointsReward,
        lp.status,lp.watched_seconds watchedSeconds,lp.completed_at completedAt FROM lessons l LEFT JOIN lesson_progress lp ON lp.lesson_id=l.id AND lp.user_id=? WHERE l.course_id=? ORDER BY l.position`).all(DEMO_USER_ID, request.params.courseId)
      response.json({ data: { ...courseFromRow(course), lessons } })
    } catch (error) { next(error) }
  })

  app.put('/api/v1/courses/:courseId/enrollment', (request, response, next) => {
    try {
      if (!db.prepare('SELECT 1 FROM courses WHERE id=? AND published=1').get(request.params.courseId)) throw new ApiError(404, 'COURSE_NOT_FOUND', 'Curso no encontrado.')
      const result = db.prepare('INSERT OR IGNORE INTO enrollments(user_id,course_id) VALUES (?,?)').run(DEMO_USER_ID, request.params.courseId)
      response.status(result.changes ? 201 : 200).json({ data: { courseId: request.params.courseId, enrolled: true, created: Boolean(result.changes) } })
    } catch (error) { next(error) }
  })

  app.get('/api/v1/me/courses', (_request, response) => {
    const rows = db.prepare(`SELECT c.*,COUNT(l.id) lesson_count,
      SUM(CASE WHEN lp.status='completed' THEN 1 ELSE 0 END) completed_lessons,e.enrolled_at,e.completed_at
      FROM enrollments e JOIN courses c ON c.id=e.course_id JOIN lessons l ON l.course_id=c.id
      LEFT JOIN lesson_progress lp ON lp.lesson_id=l.id AND lp.user_id=e.user_id WHERE e.user_id=?
      GROUP BY c.id ORDER BY e.enrolled_at`).all(DEMO_USER_ID) as Row[]
    response.json({ data: rows.map(row => ({ ...courseFromRow(row), progress: { completedLessons: Number(row.completed_lessons), totalLessons: Number(row.lesson_count), percent: Math.round(Number(row.completed_lessons) * 100 / Number(row.lesson_count)), completedAt: row.completed_at } })) })
  })

  app.put('/api/v1/courses/:courseId/lessons/:lessonId/progress', (request, response, next) => {
    try {
      const body = parse(z.object({ status: z.enum(['in_progress', 'completed']), watchedSeconds: z.number().int().min(0).max(86_400).default(0) }), request.body)
      const lesson = db.prepare('SELECT id,points_reward FROM lessons WHERE id=? AND course_id=?').get(request.params.lessonId, request.params.courseId) as Row | undefined
      if (!lesson) throw new ApiError(404, 'LESSON_NOT_FOUND', 'Lección no encontrada en este curso.')
      const result = inTransaction(db, () => {
        db.prepare('INSERT OR IGNORE INTO enrollments(user_id,course_id) VALUES (?,?)').run(DEMO_USER_ID, request.params.courseId)
        const prior = db.prepare('SELECT status FROM lesson_progress WHERE user_id=? AND lesson_id=?').get(DEMO_USER_ID, request.params.lessonId) as Row | undefined
        const firstCompletion = body.status === 'completed' && prior?.status !== 'completed'
        const status = prior?.status === 'completed' ? 'completed' : body.status
        db.prepare(`INSERT INTO lesson_progress(user_id,lesson_id,status,watched_seconds,completed_at,updated_at)
          VALUES (?,?,?,?,CASE WHEN ?='completed' THEN CURRENT_TIMESTAMP END,CURRENT_TIMESTAMP)
          ON CONFLICT(user_id,lesson_id) DO UPDATE SET status=excluded.status, watched_seconds=MAX(lesson_progress.watched_seconds,excluded.watched_seconds),
          completed_at=COALESCE(lesson_progress.completed_at,excluded.completed_at), updated_at=CURRENT_TIMESTAMP`).run(DEMO_USER_ID, request.params.lessonId, status, body.watchedSeconds, status)
        if (firstCompletion) db.prepare('UPDATE users SET points=points+?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(lesson.points_reward, DEMO_USER_ID)
        const counts = db.prepare(`SELECT COUNT(*) total,SUM(CASE WHEN lp.status='completed' THEN 1 ELSE 0 END) completed
          FROM lessons l LEFT JOIN lesson_progress lp ON lp.lesson_id=l.id AND lp.user_id=? WHERE l.course_id=?`).get(DEMO_USER_ID, request.params.courseId) as Row
        if (Number(counts.completed) === Number(counts.total)) db.prepare('UPDATE enrollments SET completed_at=COALESCE(completed_at,CURRENT_TIMESTAMP) WHERE user_id=? AND course_id=?').run(DEMO_USER_ID, request.params.courseId)
        return { status, watchedSeconds: body.watchedSeconds, pointsAwarded: firstCompletion ? Number(lesson.points_reward) : 0, courseProgress: { completedLessons: Number(counts.completed), totalLessons: Number(counts.total), percent: Math.round(Number(counts.completed) * 100 / Number(counts.total)) } }
      })
      response.json({ data: result })
    } catch (error) { next(error) }
  })

  app.get('/api/v1/challenges/active', (_request, response, next) => {
    try {
      const row = db.prepare(`SELECT c.id,c.title,c.prompt,c.options_json,c.explanation,c.points_reward,
        EXISTS(SELECT 1 FROM challenge_completions cc WHERE cc.challenge_id=c.id AND cc.user_id=?) completed
        FROM challenges c WHERE datetime('now') BETWEEN datetime(c.active_from) AND datetime(c.active_until) ORDER BY c.active_from DESC LIMIT 1`).get(DEMO_USER_ID) as Row | undefined
      if (!row) throw new ApiError(404, 'NO_ACTIVE_CHALLENGE', 'No hay un reto activo.')
      response.json({ data: { id: row.id, title: row.title, prompt: row.prompt, options: JSON.parse(String(row.options_json)), explanation: row.explanation, pointsReward: row.points_reward, completed: Boolean(row.completed) } })
    } catch (error) { next(error) }
  })

  app.post('/api/v1/challenges/:challengeId/attempts', (request, response, next) => {
    try {
      const key = getIdempotencyKey(request)
      const body = parse(z.object({ answer: z.string().trim().min(1).max(200) }), request.body)
      const challenge = db.prepare(`SELECT id,correct_answer,explanation,points_reward FROM challenges WHERE id=? AND datetime('now') BETWEEN datetime(active_from) AND datetime(active_until)`).get(request.params.challengeId) as Row | undefined
      if (!challenge) throw new ApiError(404, 'CHALLENGE_NOT_FOUND', 'Reto no encontrado o inactivo.')
      const result = inTransaction(db, () => {
        const existing = db.prepare('SELECT id,answer,correct,points_awarded,created_at FROM challenge_attempts WHERE user_id=? AND challenge_id=? AND idempotency_key=?').get(DEMO_USER_ID, challenge.id, key) as Row | undefined
        if (existing) {
          if (existing.answer !== body.answer) throw new ApiError(409, 'IDEMPOTENCY_CONFLICT', 'La clave de idempotencia ya fue usada con una respuesta diferente.')
          return { created: false, attempt: existing }
        }
        const correct = body.answer === challenge.correct_answer
        const inserted = db.prepare(`INSERT INTO challenge_attempts(user_id,challenge_id,idempotency_key,answer,correct) VALUES (?,?,?,?,?)`).run(DEMO_USER_ID, challenge.id, key, body.answer, correct ? 1 : 0)
        let pointsAwarded = 0
        if (correct) {
          const completion = db.prepare('INSERT OR IGNORE INTO challenge_completions(user_id,challenge_id,attempt_id) VALUES (?,?,?)').run(DEMO_USER_ID, challenge.id, inserted.lastInsertRowid)
          if (completion.changes) {
            pointsAwarded = Number(challenge.points_reward)
            db.prepare('UPDATE challenge_attempts SET points_awarded=? WHERE id=?').run(pointsAwarded, inserted.lastInsertRowid)
            db.prepare('UPDATE users SET points=points+?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(pointsAwarded, DEMO_USER_ID)
          }
        }
        return { created: true, attempt: { id: Number(inserted.lastInsertRowid), correct: correct ? 1 : 0, points_awarded: pointsAwarded } }
      })
      response.status(result.created ? 201 : 200).json({ data: { attemptId: result.attempt.id, correct: Boolean(result.attempt.correct), pointsAwarded: Number(result.attempt.points_awarded), explanation: challenge.explanation, replayed: !result.created } })
    } catch (error) { next(error) }
  })

  app.get('/api/v1/posts', (_request, response) => {
    const posts = db.prepare(`SELECT p.id,p.topic,p.body,p.created_at,u.display_name,u.initials,
      COUNT(DISTINCT pl.user_id) like_count,MAX(CASE WHEN pl.user_id=? THEN 1 ELSE 0 END) liked
      FROM posts p JOIN users u ON u.id=p.user_id LEFT JOIN post_likes pl ON pl.post_id=p.id
      GROUP BY p.id ORDER BY p.created_at DESC LIMIT 50`).all(DEMO_USER_ID) as Row[]
    const comments = db.prepare(`SELECT c.id,c.post_id,c.body,c.created_at,u.display_name,u.initials FROM comments c JOIN users u ON u.id=c.user_id
      WHERE c.post_id IN (SELECT id FROM posts ORDER BY created_at DESC LIMIT 50) ORDER BY c.created_at`).all() as Row[]
    response.json({ data: posts.map(post => ({ id: post.id, topic: post.topic, body: post.body, createdAt: post.created_at, author: { displayName: post.display_name, initials: post.initials }, likes: Number(post.like_count), liked: Boolean(post.liked), comments: comments.filter(comment => comment.post_id === post.id).map(comment => ({ id: comment.id, body: comment.body, createdAt: comment.created_at, author: { displayName: comment.display_name, initials: comment.initials } })) })) })
  })

  app.post('/api/v1/posts', (request, response, next) => {
    try {
      const body = parse(z.object({ topic: z.string().trim().min(1).max(50), body: z.string().trim().min(1).max(2000) }), request.body)
      const id = randomUUID(); db.prepare('INSERT INTO posts(id,user_id,topic,body) VALUES (?,?,?,?)').run(id, DEMO_USER_ID, body.topic, body.body)
      response.status(201).json({ data: { id, ...body } })
    } catch (error) { next(error) }
  })

  app.post('/api/v1/posts/:postId/comments', (request, response, next) => {
    try {
      const body = parse(z.object({ body: z.string().trim().min(1).max(1000) }), request.body)
      if (!db.prepare('SELECT 1 FROM posts WHERE id=?').get(request.params.postId)) throw new ApiError(404, 'POST_NOT_FOUND', 'Publicación no encontrada.')
      const id = randomUUID(); db.prepare('INSERT INTO comments(id,post_id,user_id,body) VALUES (?,?,?,?)').run(id, request.params.postId, DEMO_USER_ID, body.body)
      response.status(201).json({ data: { id, postId: request.params.postId, body: body.body } })
    } catch (error) { next(error) }
  })

  app.put('/api/v1/posts/:postId/like', (request, response, next) => {
    try {
      if (!db.prepare('SELECT 1 FROM posts WHERE id=?').get(request.params.postId)) throw new ApiError(404, 'POST_NOT_FOUND', 'Publicación no encontrada.')
      const result = db.prepare('INSERT OR IGNORE INTO post_likes(post_id,user_id) VALUES (?,?)').run(request.params.postId, DEMO_USER_ID)
      const count = Number((db.prepare('SELECT COUNT(*) count FROM post_likes WHERE post_id=?').get(request.params.postId) as Row).count)
      response.status(result.changes ? 201 : 200).json({ data: { liked: true, created: Boolean(result.changes), likes: count } })
    } catch (error) { next(error) }
  })
  app.delete('/api/v1/posts/:postId/like', (request, response, next) => {
    try {
      if (!db.prepare('SELECT 1 FROM posts WHERE id=?').get(request.params.postId)) throw new ApiError(404, 'POST_NOT_FOUND', 'Publicación no encontrada.')
      const result = db.prepare('DELETE FROM post_likes WHERE post_id=? AND user_id=?').run(request.params.postId, DEMO_USER_ID)
      const count = Number((db.prepare('SELECT COUNT(*) count FROM post_likes WHERE post_id=?').get(request.params.postId) as Row).count)
      response.json({ data: { liked: false, removed: Boolean(result.changes), likes: count } })
    } catch (error) { next(error) }
  })

  app.get('/api/v1/events', (_request, response) => {
    const rows = db.prepare(`SELECT e.*,COUNT(er.user_id) reserved_count,MAX(CASE WHEN er.user_id=? THEN 1 ELSE 0 END) reserved
      FROM events e LEFT JOIN event_reservations er ON er.event_id=e.id GROUP BY e.id ORDER BY e.starts_at LIMIT 100`).all(DEMO_USER_ID) as Row[]
    response.json({ data: rows.map(row => ({ id: row.id, title: row.title, description: row.description, startsAt: row.starts_at, durationMinutes: row.duration_minutes, mode: row.mode, capacity: row.capacity, reservedCount: Number(row.reserved_count), availablePlaces: Math.max(0, Number(row.capacity) - Number(row.reserved_count)), reserved: Boolean(row.reserved) })) })
  })
  app.put('/api/v1/events/:eventId/reservation', (request, response, next) => {
    try {
      const result = inTransaction(db, () => {
        const event = db.prepare('SELECT capacity FROM events WHERE id=?').get(request.params.eventId) as Row | undefined
        if (!event) throw new ApiError(404, 'EVENT_NOT_FOUND', 'Evento no encontrado.')
        if (db.prepare('SELECT 1 FROM event_reservations WHERE event_id=? AND user_id=?').get(request.params.eventId, DEMO_USER_ID)) return { created: false }
        const count = Number((db.prepare('SELECT COUNT(*) count FROM event_reservations WHERE event_id=?').get(request.params.eventId) as Row).count)
        if (count >= Number(event.capacity)) throw new ApiError(409, 'EVENT_FULL', 'El evento ya no tiene lugares disponibles.')
        db.prepare('INSERT INTO event_reservations(event_id,user_id) VALUES (?,?)').run(request.params.eventId, DEMO_USER_ID)
        return { created: true }
      })
      response.status(result.created ? 201 : 200).json({ data: { eventId: request.params.eventId, reserved: true, created: result.created } })
    } catch (error) { next(error) }
  })

  app.use((_request, _response, next) => next(new ApiError(404, 'ROUTE_NOT_FOUND', 'Ruta no encontrada.')))
  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    void _next
    if (error instanceof SyntaxError && 'body' in error) error = new ApiError(400, 'INVALID_JSON', 'El cuerpo JSON no es válido.')
    if (error instanceof ZodError) error = new ApiError(422, 'VALIDATION_ERROR', 'Datos inválidos.', error.flatten())
    const apiError = error instanceof ApiError ? error : new ApiError(500, 'INTERNAL_ERROR', 'Ocurrió un error interno.')
    if (apiError.status >= 500) console.error(JSON.stringify({ level: 'error', message: apiError.message, requestId: response.locals.requestId, error: error instanceof Error ? error.stack : String(error) }))
    response.status(apiError.status).json({ error: { code: apiError.code, message: apiError.message, ...(apiError.details ? { details: apiError.details } : {}) }, requestId: response.locals.requestId })
  })
  return app
}
