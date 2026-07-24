export type Section = 'Inicio' | 'Explorar' | 'Mis cursos' | 'Práctica' | 'Comunidad'
export type Category = 'Para ti' | 'Vocabulario' | 'Conversación' | 'Cultura Sorda' | 'Gramática'
export type Level = 'Todos' | 'Principiante' | 'Intermedio' | 'Avanzado'

export type Course = {
  id: string
  title: string
  eyebrow: string
  description: string
  meta: string
  lessons: number
  category: Exclude<Category, 'Para ti'>
  level: Exclude<Level, 'Todos'>
  color: 'coral' | 'yellow' | 'blue' | 'mint'
  image: string
}

export const courses: Course[] = [
  { id: 'lsm-cero', title: 'LSM desde cero', eyebrow: 'Ruta inicial', description: 'Construye bases sólidas para presentarte y tener tus primeras conversaciones.', meta: '12 lecciones · 2 h 10 min', lessons: 12, category: 'Conversación', level: 'Principiante', color: 'coral', image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80' },
  { id: 'primeras-conversaciones', title: 'Primeras conversaciones en LSM', eyebrow: 'Conversación cotidiana', description: 'Saluda, pregunta y responde con recursos útiles para situaciones reales.', meta: '8 lecciones · 1 h 20 min', lessons: 8, category: 'Conversación', level: 'Principiante', color: 'coral', image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80' },
  { id: 'rostro-comunica', title: 'El rostro también comunica', eyebrow: 'Expresión no manual', description: 'Practica componentes no manuales que aportan intención y significado.', meta: '6 lecciones · 55 min', lessons: 6, category: 'Gramática', level: 'Intermedio', color: 'yellow', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80' },
  { id: 'identidad-sorda', title: 'Comunidad, identidad y orgullo Sordo', eyebrow: 'Contexto esencial', description: 'Conoce perspectivas, historia e identidad desde voces de la Comunidad Sorda.', meta: '5 lecciones · 45 min', lessons: 5, category: 'Cultura Sorda', level: 'Principiante', color: 'blue', image: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=900&q=80' },
  { id: 'familia-hogar', title: 'Familia y vida en casa', eyebrow: 'Vocabulario temático', description: 'Amplía tu vocabulario para hablar de personas, espacios y rutinas.', meta: '7 lecciones · 1 h 05 min', lessons: 7, category: 'Vocabulario', level: 'Principiante', color: 'mint', image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=900&q=80' },
  { id: 'clasificadores', title: 'Clasificadores en contexto', eyebrow: 'Gramática visual', description: 'Describe formas, movimientos y ubicaciones con mayor precisión.', meta: '9 lecciones · 1 h 35 min', lessons: 9, category: 'Gramática', level: 'Avanzado', color: 'yellow', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80' },
  { id: 'trabajo-estudio', title: 'Trabajo, escuela y proyectos', eyebrow: 'Vocabulario aplicado', description: 'Comunícate sobre actividades académicas y profesionales frecuentes.', meta: '8 lecciones · 1 h 15 min', lessons: 8, category: 'Vocabulario', level: 'Intermedio', color: 'blue', image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80' },
  { id: 'narrar-lsm', title: 'Narrar experiencias en LSM', eyebrow: 'Comunicación fluida', description: 'Organiza el espacio, el tiempo y los referentes al contar una historia.', meta: '10 lecciones · 1 h 50 min', lessons: 10, category: 'Conversación', level: 'Avanzado', color: 'coral', image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=900&q=80' },
]

export const enrolledCourses = [
  { courseId: 'lsm-cero', progress: 58, next: 'Preguntar: ¿cómo te llamas?' },
  { courseId: 'rostro-comunica', progress: 32, next: 'Expresión interrogativa' },
  { courseId: 'identidad-sorda', progress: 100, next: 'Curso completado' },
]
