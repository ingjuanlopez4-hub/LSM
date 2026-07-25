import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, Bell, Check, ChevronRight, CircleHelp, Compass, Hand, Home, Library, Menu, Play, Search, Settings, Target, Users, X } from 'lucide-react'
import { type Course, type Section } from './data'
import { CommunityView, ExploreView, HomeView, MyCoursesView, PracticeView } from './views'

const navItems: { label: Section; icon: typeof Home }[] = [
  { label: 'Inicio', icon: Home }, { label: 'Explorar', icon: Compass }, { label: 'Mis cursos', icon: Library }, { label: 'Práctica', icon: Target }, { label: 'Comunidad', icon: Users },
]

const today = new Date()
const dailyPracticeKey = `manosmx.practice.${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

function readStored<T>(key: string, fallback: T): T {
  try { const value = window.localStorage.getItem(key); return value === null ? fallback : JSON.parse(value) as T } catch { return fallback }
}

function Brand() { return <div className="brand" aria-label="Manos MX"><span className="brand-mark"><Hand size={23} strokeWidth={2.4} /></span><span>manos<span>mx</span></span></div> }

function Sidebar({ active, onNavigate, practiceCompleted }: { active: Section; onNavigate: (section: Section) => void; practiceCompleted: boolean }) {
  return <aside className="sidebar"><Brand /><nav aria-label="Navegación principal"><p className="nav-label">APRENDER</p>{navItems.map(({ label, icon: Icon }) => <button key={label} className={active === label ? 'nav-item active' : 'nav-item'} onClick={() => onNavigate(label)} aria-current={active === label ? 'page' : undefined}><Icon size={19} /><span>{label}</span>{label === 'Práctica' && !practiceCompleted && <span className="nav-dot" />}</button>)}</nav><div className="weekly-goal"><div className="goal-ring"><span>{practiceCompleted ? 5 : 4}</span><small>/5</small></div><div><strong>Meta semanal</strong><p>{practiceCompleted ? 'Meta completada' : 'Una práctica más'}</p></div></div><div className="sidebar-footer"><button className="nav-item"><CircleHelp size={19} /><span>Ayuda</span></button><button className="nav-item"><Settings size={19} /><span>Configuración</span></button><div className="profile-mini"><span className="avatar">AM</span><div><strong>Andrea M.</strong><small>Nivel 4</small></div><ChevronRight size={17} /></div></div></aside>
}

function Header({ query, onSearch, onMenu }: { query: string; onSearch: (value: string) => void; onMenu: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { if (inputRef.current) inputRef.current.value = query }, [query])
  useEffect(() => { const shortcut = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); inputRef.current?.focus() } }; window.addEventListener('keydown', shortcut); return () => window.removeEventListener('keydown', shortcut) }, [])
  const submit = (event: FormEvent) => { event.preventDefault(); onSearch(inputRef.current?.value.trim() ?? '') }
  return <header className="topbar"><button className="icon-button mobile-menu" onClick={onMenu} aria-label="Abrir menú"><Menu /></button><div className="mobile-brand"><Brand /></div><form className="search-box" role="search" onSubmit={submit}><Search size={18} /><label className="sr-only" htmlFor="global-search">Buscar cursos o señas</label><input ref={inputRef} id="global-search" defaultValue={query} placeholder="Buscar cursos, temas o señas" /><kbd>⌘ K</kbd></form><div className="top-actions"><button className="icon-button notification" aria-label="Notificaciones"><Bell size={20} /><span /></button><button className="top-profile" aria-label="Abrir perfil"><span className="avatar">AM</span><span>Andrea</span><ChevronRight size={16} /></button></div></header>
}

function LessonModal({ course, onClose, onComplete }: { course: Course; onClose: () => void; onComplete: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { closeRef.current?.focus(); const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close) }, [onClose])
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="lesson-modal" role="dialog" aria-modal="true" aria-labelledby="lesson-title" onMouseDown={event => event.stopPropagation()}><button ref={closeRef} className="modal-close icon-button" onClick={onClose} aria-label="Cerrar"><X /></button><div className="lesson-video"><img src={course.image} alt="Grupo practicando durante una lección" /><span><Play fill="currentColor" /></span></div><p className="eyebrow">SIGUIENTE LECCIÓN · 09:40 MIN</p><h2 id="lesson-title">{course.id === 'lsm-cero' ? 'Preguntar: ¿cómo te llamas?' : course.title}</h2><p>{course.description} Observa la dirección de la mirada, la expresión y el uso del espacio antes de repetir.</p><div className="modal-actions"><button className="secondary-button" onClick={onClose}><ArrowLeft size={17} /> Volver</button><button className="primary-button" onClick={onComplete}>Marcar como vista <Check size={17} /></button></div></section></div>
}

function App() {
  const [active, setActive] = useState<Section>('Inicio')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [lesson, setLesson] = useState<Course | null>(null)
  const [query, setQuery] = useState('')
  const [points, setPoints] = useState(() => readStored('manosmx.points', 1240))
  const [practiceCompleted, setPracticeCompleted] = useState(() => readStored(dailyPracticeKey, false))
  const [liked, setLiked] = useState(() => readStored('manosmx.community.like', false))
  const [toast, setToast] = useState('')
  const toastTimer = useRef<number | undefined>()
  useEffect(() => { try { localStorage.setItem('manosmx.points', JSON.stringify(points)); localStorage.setItem(dailyPracticeKey, JSON.stringify(practiceCompleted)); localStorage.setItem('manosmx.community.like', JSON.stringify(liked)) } catch { /* La app continúa si el almacenamiento está bloqueado. */ } }, [points, practiceCompleted, liked])
  useEffect(() => () => window.clearTimeout(toastTimer.current), [])
  const announce = (message: string) => { setToast(message); window.clearTimeout(toastTimer.current); toastTimer.current = window.setTimeout(() => setToast(''), 2600) }
  const navigate = (section: Section) => { setActive(section); setMobileOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const globalSearch = (value: string) => { setQuery(value); navigate('Explorar') }
  const completePractice = () => { if (!practiceCompleted) { setPracticeCompleted(true); setPoints(value => value + 15); announce('Objetivo diario completado · +15 puntos') } else announce('Repaso guardado') }
  const completeLesson = () => { setLesson(null); setPoints(value => value + 25); announce('Lección completada · +25 puntos') }
  const common = { points, practiceCompleted, onPracticeComplete: completePractice, onOpenCourse: setLesson, onNavigate: navigate }
  return <div className="app-shell"><Sidebar active={active} onNavigate={navigate} practiceCompleted={practiceCompleted} />{mobileOpen && <button className="menu-backdrop" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú" />}<div className={mobileOpen ? 'mobile-drawer open' : 'mobile-drawer'} aria-hidden={!mobileOpen}><div className="drawer-head"><Brand /><button className="icon-button" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú"><X /></button></div><nav aria-label="Navegación móvil">{navItems.map(({ label, icon: Icon }) => <button key={label} className={active === label ? 'nav-item active' : 'nav-item'} onClick={() => navigate(label)} aria-current={active === label ? 'page' : undefined}><Icon size={20} />{label}</button>)}</nav></div><div className="page-wrap"><Header query={query} onSearch={globalSearch} onMenu={() => setMobileOpen(true)} /><main>{active === 'Inicio' && <HomeView {...common} />}{active === 'Explorar' && <ExploreView initialQuery={query} onQueryChange={setQuery} onOpenCourse={setLesson} />}{active === 'Mis cursos' && <MyCoursesView onOpenCourse={setLesson} onNavigate={navigate} />}{active === 'Práctica' && <PracticeView completed={practiceCompleted} onComplete={completePractice} />}{active === 'Comunidad' && <CommunityView liked={liked} onToggleLike={() => setLiked(value => !value)} onToast={announce} />}</main><nav className="bottom-nav" aria-label="Navegación inferior">{navItems.map(({ label, icon: Icon }) => <button key={label} className={active === label ? 'active' : ''} onClick={() => navigate(label)} aria-current={active === label ? 'page' : undefined}><Icon size={20} /><span>{label === 'Mis cursos' ? 'Cursos' : label}</span></button>)}</nav></div>{lesson && <LessonModal course={lesson} onClose={() => setLesson(null)} onComplete={completeLesson} />}{toast && <div className="toast" role="status"><Check size={17} />{toast}</div>}</div>
}

export default App
