import type { Database } from './database.js'

const courses = [
  ['lsm-cero', 'LSM desde cero', 'Ruta inicial', 'Construye bases sólidas para presentarte y tener tus primeras conversaciones.', '12 lecciones · 2 h 10 min', 'Conversación', 'Principiante', 'coral', 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80', 12],
  ['primeras-conversaciones', 'Primeras conversaciones en LSM', 'Conversación cotidiana', 'Saluda, pregunta y responde con recursos útiles para situaciones reales.', '8 lecciones · 1 h 20 min', 'Conversación', 'Principiante', 'coral', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80', 8],
  ['rostro-comunica', 'El rostro también comunica', 'Expresión no manual', 'Practica componentes no manuales que aportan intención y significado.', '6 lecciones · 55 min', 'Gramática', 'Intermedio', 'yellow', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80', 6],
  ['identidad-sorda', 'Comunidad, identidad y orgullo Sordo', 'Contexto esencial', 'Conoce perspectivas, historia e identidad desde voces de la Comunidad Sorda.', '5 lecciones · 45 min', 'Cultura Sorda', 'Principiante', 'blue', 'https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=900&q=80', 5],
  ['familia-hogar', 'Familia y vida en casa', 'Vocabulario temático', 'Amplía tu vocabulario para hablar de personas, espacios y rutinas.', '7 lecciones · 1 h 05 min', 'Vocabulario', 'Principiante', 'mint', 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=900&q=80', 7],
  ['clasificadores', 'Clasificadores en contexto', 'Gramática visual', 'Describe formas, movimientos y ubicaciones con mayor precisión.', '9 lecciones · 1 h 35 min', 'Gramática', 'Avanzado', 'yellow', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80', 9],
  ['trabajo-estudio', 'Trabajo, escuela y proyectos', 'Vocabulario aplicado', 'Comunícate sobre actividades académicas y profesionales frecuentes.', '8 lecciones · 1 h 15 min', 'Vocabulario', 'Intermedio', 'blue', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80', 8],
  ['narrar-lsm', 'Narrar experiencias en LSM', 'Comunicación fluida', 'Organiza el espacio, el tiempo y los referentes al contar una historia.', '10 lecciones · 1 h 50 min', 'Conversación', 'Avanzado', 'coral', 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=900&q=80', 10],
] as const

const specialLessonTitles: Record<string, string[]> = {
  'lsm-cero': ['Bienvenida a la LSM', 'El alfabeto manual', 'Saludos básicos', 'Expresión facial', 'Decir tu nombre', 'De dónde eres', 'Preguntar: ¿cómo te llamas?', 'Presentar a alguien', 'Números básicos', 'Conversación guiada', 'Práctica en contexto', 'Repaso final'],
  'rostro-comunica': ['El rostro en LSM', 'Expresión interrogativa', 'Negación', 'Intensidad', 'Emociones', 'Práctica integrada'],
  'identidad-sorda': ['Comunidad Sorda', 'Identidad y lengua', 'Historia en México', 'Cultura y convivencia', 'Voces de la comunidad'],
}

export function seedDatabase(db: Database): void {
  db.exec('BEGIN IMMEDIATE')
  try {
    db.prepare(`INSERT OR IGNORE INTO users
      (id, display_name, first_name, initials, level, points, streak_days, best_streak_days, practice_minutes, signs_mastered, daily_goal_minutes, weekly_goal_days)
      VALUES ('demo-andrea', 'Andrea M.', 'Andrea', 'AM', 4, 1240, 12, 12, 252, 68, 18, 5)`).run()

    const insertCourse = db.prepare(`INSERT INTO courses
      (id,title,eyebrow,description,meta,category,level,color,image_url,position)
      VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title, eyebrow=excluded.eyebrow,
      description=excluded.description, meta=excluded.meta, category=excluded.category, level=excluded.level,
      color=excluded.color, image_url=excluded.image_url, position=excluded.position`)
    const insertLesson = db.prepare(`INSERT OR IGNORE INTO lessons
      (id,course_id,title,description,duration_seconds,position,points_reward) VALUES (?,?,?,?,?,?,25)`)
    courses.forEach((course, courseIndex) => {
      const [id, title, eyebrow, description, meta, category, level, color, image, count] = course
      insertCourse.run(id, title, eyebrow, description, meta, category, level, color, image, courseIndex + 1)
      for (let position = 1; position <= count; position++) {
        const lessonTitle = specialLessonTitles[id]?.[position - 1] ?? `${title}: lección ${position}`
        insertLesson.run(`${id}-${position}`, id, lessonTitle, description, 600, position)
      }
    })

    const enroll = db.prepare('INSERT OR IGNORE INTO enrollments(user_id,course_id,completed_at) VALUES (?,?,?)')
    enroll.run('demo-andrea', 'lsm-cero', null)
    enroll.run('demo-andrea', 'rostro-comunica', null)
    enroll.run('demo-andrea', 'identidad-sorda', '2026-07-18T18:00:00.000Z')
    const progress = db.prepare(`INSERT OR IGNORE INTO lesson_progress
      (user_id,lesson_id,status,watched_seconds,completed_at) VALUES ('demo-andrea',?,'completed',600,'2026-07-18T18:00:00.000Z')`)
    for (let i = 1; i <= 7; i++) progress.run(`lsm-cero-${i}`)
    for (let i = 1; i <= 2; i++) progress.run(`rostro-comunica-${i}`)
    for (let i = 1; i <= 5; i++) progress.run(`identidad-sorda-${i}`)

    db.prepare(`INSERT OR IGNORE INTO challenges
      (id,title,prompt,options_json,correct_answer,explanation,points_reward,active_from,active_until)
      VALUES ('daily-gracias','Una seña, tres opciones','¿Qué significa esta seña?',?, 'Gracias',
      'El movimiento va desde el mentón hacia adelante.',15,'2020-01-01T00:00:00.000Z','2035-01-01T00:00:00.000Z')`).run(JSON.stringify(['Por favor', 'Gracias', 'Con permiso']))

    db.prepare(`INSERT OR IGNORE INTO users(id,display_name,first_name,initials,level,points) VALUES
      ('community-mariana','Mariana R.','Mariana','MR',3,800), ('community-sofia','Sofía','Sofía','SO',2,500)`).run()
    db.prepare(`INSERT OR IGNORE INTO posts(id,user_id,topic,body,created_at) VALUES
      ('post-mariana','community-mariana','Práctica','Hoy logré presentarme en LSM sin consultar mis apuntes. Me funcionó grabarme, revisar la expresión facial y repetir a menor velocidad. ¿Qué les ayuda a mantener el ritmo?','2026-07-24T20:00:00.000Z')`).run()
    db.prepare(`INSERT OR IGNORE INTO comments(id,post_id,user_id,body,created_at) VALUES
      ('comment-sofia','post-mariana','community-sofia','Me ayudó mucho practicar primero el ritmo de la frase.','2026-07-24T21:00:00.000Z')`).run()
    const like = db.prepare(`INSERT OR IGNORE INTO post_likes(post_id,user_id) VALUES ('post-mariana',?)`)
    for (let i = 1; i <= 24; i++) {
      const id = `seed-like-${i}`
      db.prepare(`INSERT OR IGNORE INTO users(id,display_name,first_name,initials,level,points) VALUES (?,?,'Estudiante','MX',1,0)`).run(id, `Estudiante ${i}`)
      like.run(id)
    }
    db.prepare(`INSERT OR IGNORE INTO events(id,title,description,starts_at,duration_minutes,mode,capacity)
      VALUES ('conversatorio-jovenes-sordos','Conversatorio: experiencias de jóvenes Sordos en México',
      'Con Daniela Luna y Marco Hernández. Interpretación LSM–español incluida.','2026-07-30T19:00:00-06:00',45,'online',500)`).run()
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}
