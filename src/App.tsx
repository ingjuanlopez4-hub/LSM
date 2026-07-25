import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react'
import { ArrowLeft, Bell, Check, ChevronRight, CircleHelp, Compass, Hand, Home, Library, Menu, Play, Search, Settings, Target, Users, X } from 'lucide-react'
import { type Course, type Section } from './data'
import { CommunityView, ExploreView, HomeView, MyCoursesView, PracticeView } from './views'

const navItems: { label: Section; icon: typeof Home }[] = [
  { label: 'Inicio', icon: Home }, { label: 'Explorar', icon: Compass }, { label: 'Mis cursos', icon: Library }, { label: 'Práctica', icon: Target }, { label: 'Comunidad', icon: Users },
]

const sectionPaths: Record<Section, string> = { Inicio: 'inicio', Explorar: 'explorar', 'Mis cursos': 'mis-cursos', Práctica: 'practica', Comunidad: 'comunidad' }
const pathSections = Object.fromEntries(Object.entries(sectionPaths).map(([section, path]) => [path, section])) as Record<string, Section>

function sectionFromUrl() {
  return pathSections[window.location.hash.replace(/^#\/?/, '').split('?')[0]] ?? 'Inicio'
}

const today = new Date()
const dailyPracticeKey = `manosmx.practice.${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

function readStored<T>(key: string, fallback: T): T {
  try { const value = window.localStorage.getItem(key); return value === null ? fallback : JSON.parse(value) as T } catch { return fallback }
}

function Brand() { return <div className="brand" aria-label="Manos MX"><span className="brand-mark"><Hand size={23} strokeWidth={2.4} /></span><span>manos<span>mx</span></span></div> }

function useModalFocus(containerRef: RefObject<HTMLElement>, initialFocusRef: RefObject<HTMLElement>, onClose: () => void) {
  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose }, [onClose])
  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    initialFocusRef.current?.focus()
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); return }
      if (event.key !== 'Tab') return
      const focusable = [...(containerRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), [tabindex]:not([tabindex="-1"])') ?? [])]
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKey)
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = previousOverflow; previouslyFocused?.focus() }
  }, [containerRef, initialFocusRef])
}

function Sidebar({ active, onNavigate, practiceCompleted, onHelp, onSettings, onProfile }: { active: Section; onNavigate: (section: Section) => void; practiceCompleted: boolean; onHelp: () => void; onSettings: () => void; onProfile: () => void }) {
  return <aside className="sidebar"><Brand /><nav aria-label="Navegación principal"><p className="nav-label">APRENDER</p>{navItems.map(({ label, icon: Icon }) => <button key={label} className={active === label ? 'nav-item active' : 'nav-item'} onClick={() => onNavigate(label)} aria-current={active === label ? 'page' : undefined}><Icon size={19} /><span>{label}</span>{label === 'Práctica' && !practiceCompleted && <span className="nav-dot" aria-label="Práctica pendiente" />}</button>)}</nav><div className="weekly-goal"><div className="goal-ring" aria-label={`${practiceCompleted ? 5 : 4} de 5 prácticas completadas`}><span>{practiceCompleted ? 5 : 4}</span><small>/5</small></div><div><strong>Meta semanal</strong><p>{practiceCompleted ? 'Meta completada' : 'Una práctica más'}</p></div></div><div className="sidebar-footer"><button className="nav-item" onClick={onHelp}><CircleHelp size={19} /><span>Ayuda</span></button><button className="nav-item" onClick={onSettings}><Settings size={19} /><span>Configuración</span></button><button className="profile-mini" onClick={onProfile} aria-label="Abrir perfil de Andrea"><span className="avatar">AM</span><span><strong>Andrea M.</strong><small>Nivel 4</small></span><ChevronRight size={17} /></button></div></aside>
}

function Header({ query, onSearch, onMenu, onHelp, onSettings, onProfile }: { query: string; onSearch: (value: string) => void; onMenu: () => void; onHelp: () => void; onSettings: () => void; onProfile: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const actionsRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLButtonElement>(null)
  const profileRef = useRef<HTMLButtonElement>(null)
  const [menu, setMenu] = useState<'notifications' | 'profile' | null>(null)
  const [unread, setUnread] = useState(true)
  useEffect(() => { if (inputRef.current) inputRef.current.value = query }, [query])
  useEffect(() => { const shortcut = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); inputRef.current?.focus() } }; window.addEventListener('keydown', shortcut); return () => window.removeEventListener('keydown', shortcut) }, [])
  useEffect(() => {
    if (!menu) return
    const close = (event: KeyboardEvent | PointerEvent) => {
      if (event instanceof KeyboardEvent && event.key === 'Escape') { setMenu(null); (menu === 'notifications' ? notificationRef : profileRef).current?.focus() }
      else if (event instanceof PointerEvent && !actionsRef.current?.contains(event.target as Node)) setMenu(null)
    }
    document.addEventListener('keydown', close)
    document.addEventListener('pointerdown', close)
    return () => { document.removeEventListener('keydown', close); document.removeEventListener('pointerdown', close) }
  }, [menu])
  const submit = (event: FormEvent) => { event.preventDefault(); onSearch(inputRef.current?.value.trim() ?? '') }
  const openUtility = (action: () => void) => { profileRef.current?.focus(); setMenu(null); action() }
  return <header className="topbar"><button className="icon-button mobile-menu" onClick={onMenu} aria-label="Abrir menú"><Menu /></button><div className="mobile-brand"><Brand /></div><form className="search-box" role="search" onSubmit={submit}><Search size={18} /><label className="sr-only" htmlFor="global-search">Buscar cursos o señas</label><input ref={inputRef} id="global-search" defaultValue={query} placeholder="Buscar cursos, temas o señas" /><kbd>⌘ K</kbd></form><div className="top-actions" ref={actionsRef}><button ref={notificationRef} className="icon-button notification" aria-label={unread ? 'Notificaciones, una sin leer' : 'Notificaciones'} aria-expanded={menu === 'notifications'} aria-controls="notifications-menu" onClick={() => setMenu(value => value === 'notifications' ? null : 'notifications')}><Bell size={20} />{unread && <span />}</button><button ref={profileRef} className="top-profile" aria-label="Abrir menú de perfil" aria-expanded={menu === 'profile'} aria-controls="profile-menu" onClick={() => setMenu(value => value === 'profile' ? null : 'profile')}><span className="avatar">AM</span><span>Andrea</span><ChevronRight size={16} /></button>{menu === 'notifications' && <section className="header-popover notifications-popover" id="notifications-menu" aria-label="Notificaciones"><div className="popover-heading"><strong>Notificaciones</strong>{unread && <button onClick={() => setUnread(false)}>Marcar como leída</button>}</div><div className={unread ? 'notification-item unread' : 'notification-item'}><span><Target size={17} /></span><div><strong>Estás a una práctica de tu meta</strong><p>Completa el reto de hoy para cerrar tu semana.</p><small>Hace 20 min</small></div></div></section>}{menu === 'profile' && <div className="header-popover profile-menu" id="profile-menu" role="menu"><div className="profile-summary"><span className="avatar">AM</span><div><strong>Andrea Martínez</strong><small>1,240 puntos · Nivel 4</small></div></div><button role="menuitem" onClick={() => openUtility(onProfile)}>Ver mi perfil <ChevronRight size={15} /></button><button role="menuitem" onClick={() => openUtility(onSettings)}><Settings size={16} /> Configuración</button><button role="menuitem" onClick={() => openUtility(onHelp)}><CircleHelp size={16} /> Centro de ayuda</button></div>}</div></header>
}

function LessonModal({ course, onClose, onComplete }: { course: Course; onClose: () => void; onComplete: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const modalRef = useRef<HTMLElement>(null)
  useModalFocus(modalRef, closeRef, onClose)
  return <div className="modal-backdrop" onMouseDown={onClose}><section ref={modalRef} className="lesson-modal" role="dialog" aria-modal="true" aria-labelledby="lesson-title" onMouseDown={event => event.stopPropagation()}><button ref={closeRef} className="modal-close icon-button" onClick={onClose} aria-label="Cerrar lección"><X /></button><div className="lesson-video"><img src={course.image} alt="Grupo practicando durante una lección" /><span aria-hidden="true"><Play fill="currentColor" /></span></div><p className="eyebrow">SIGUIENTE LECCIÓN · 09:40 MIN</p><h2 id="lesson-title">{course.id === 'lsm-cero' ? 'Preguntar: ¿cómo te llamas?' : course.title}</h2><p>{course.description} Observa la dirección de la mirada, la expresión y el uso del espacio antes de repetir.</p><div className="modal-actions"><button className="secondary-button" onClick={onClose}><ArrowLeft size={17} /> Volver</button><button className="primary-button" onClick={onComplete}>Marcar como vista <Check size={17} /></button></div></section></div>
}

type Utility = 'help' | 'settings' | 'profile'
function UtilityDialog({ type, onClose }: { type: Utility; onClose: () => void }) {
  const dialogRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  useModalFocus(dialogRef, closeRef, onClose)
  const content = {
    help: { eyebrow: 'CENTRO DE AYUDA', title: '¿Cómo podemos ayudarte?', body: 'Consulta respuestas rápidas o escríbenos si necesitas apoyo con una lección.', action: 'Contactar soporte' },
    settings: { eyebrow: 'PREFERENCIAS', title: 'Configuración', body: 'Ajusta cómo quieres recibir recordatorios de aprendizaje.', action: 'Guardar preferencias' },
    profile: { eyebrow: 'TU CUENTA', title: 'Andrea Martínez', body: 'Nivel 4 · 12 días de racha · 68 señas dominadas', action: 'Cerrar' },
  }[type]
  return <div className="modal-backdrop" onMouseDown={onClose}><section ref={dialogRef} className="utility-dialog" role="dialog" aria-modal="true" aria-labelledby="utility-title" onMouseDown={event => event.stopPropagation()}><button ref={closeRef} className="icon-button utility-close" onClick={onClose} aria-label="Cerrar"><X /></button><p className="eyebrow">{content.eyebrow}</p><h2 id="utility-title">{content.title}</h2><p>{content.body}</p>{type === 'settings' && <label className="setting-option"><span><strong>Recordatorio de práctica</strong><small>Un aviso diario a las 19:00</small></span><input type="checkbox" defaultChecked /></label>}{type === 'help' && <div className="help-links"><button onClick={onClose}>Empezar un curso <ChevronRight size={16} /></button><button onClick={onClose}>Accesibilidad y subtítulos <ChevronRight size={16} /></button></div>}<button className="primary-button utility-action" onClick={onClose}>{content.action}</button></section></div>
}

function MobileDrawer({ active, onNavigate, onClose, onHelp, onSettings }: { active: Section; onNavigate: (section: Section) => void; onClose: () => void; onHelp: () => void; onSettings: () => void }) {
  const drawerRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  useModalFocus(drawerRef, closeRef, onClose)
  return <><button className="menu-backdrop" onClick={onClose} aria-label="Cerrar menú" /><aside ref={drawerRef} className="mobile-drawer open" role="dialog" aria-modal="true" aria-label="Menú principal"><div className="drawer-head"><Brand /><button ref={closeRef} className="icon-button" onClick={onClose} aria-label="Cerrar menú"><X /></button></div><nav aria-label="Navegación móvil">{navItems.map(({ label, icon: Icon }) => <button key={label} className={active === label ? 'nav-item active' : 'nav-item'} onClick={() => onNavigate(label)} aria-current={active === label ? 'page' : undefined}><Icon size={20} />{label}</button>)}</nav><div className="drawer-utilities"><button className="nav-item" onClick={onHelp}><CircleHelp size={19} />Ayuda</button><button className="nav-item" onClick={onSettings}><Settings size={19} />Configuración</button></div></aside></>
}

function App() {
  const [active, setActive] = useState<Section>(sectionFromUrl)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [lesson, setLesson] = useState<Course | null>(null)
  const [query, setQuery] = useState('')
  const [points, setPoints] = useState(() => readStored('manosmx.points', 1240))
  const [practiceCompleted, setPracticeCompleted] = useState(() => readStored(dailyPracticeKey, false))
  const [liked, setLiked] = useState(() => readStored('manosmx.community.like', false))
  const [toast, setToast] = useState('')
  const [utility, setUtility] = useState<Utility | null>(null)
  const toastTimer = useRef<number | undefined>()
  const mainRef = useRef<HTMLElement>(null)
  useEffect(() => { try { localStorage.setItem('manosmx.points', JSON.stringify(points)); localStorage.setItem(dailyPracticeKey, JSON.stringify(practiceCompleted)); localStorage.setItem('manosmx.community.like', JSON.stringify(liked)) } catch { /* La app continúa si el almacenamiento está bloqueado. */ } }, [points, practiceCompleted, liked])
  useEffect(() => () => window.clearTimeout(toastTimer.current), [])
  useEffect(() => {
    const syncRoute = () => { setActive(sectionFromUrl()); setMobileOpen(false); requestAnimationFrame(() => mainRef.current?.focus()) }
    if (!window.location.hash) window.history.replaceState(null, '', `#/${sectionPaths[active]}`)
    document.title = `${active} · Manos MX`
    window.addEventListener('popstate', syncRoute)
    window.addEventListener('hashchange', syncRoute)
    return () => { window.removeEventListener('popstate', syncRoute); window.removeEventListener('hashchange', syncRoute) }
  }, [active])
  const announce = (message: string) => { setToast(message); window.clearTimeout(toastTimer.current); toastTimer.current = window.setTimeout(() => setToast(''), 2600) }
  const navigate = (section: Section) => { const hash = `#/${sectionPaths[section]}`; if (window.location.hash !== hash) window.history.pushState(null, '', hash); setActive(section); setMobileOpen(false); window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); requestAnimationFrame(() => mainRef.current?.focus()) }
  const globalSearch = (value: string) => { setQuery(value); navigate('Explorar') }
  const completePractice = () => { if (!practiceCompleted) { setPracticeCompleted(true); setPoints(value => value + 15); announce('Objetivo diario completado · +15 puntos') } else announce('Repaso guardado') }
  const completeLesson = () => { setLesson(null); setPoints(value => value + 25); announce('Lección completada · +25 puntos') }
  const common = { points, practiceCompleted, onPracticeComplete: completePractice, onOpenCourse: setLesson, onNavigate: navigate }
  const openUtility = (type: Utility) => { setMobileOpen(false); setUtility(type) }
  return <div className="app-shell"><Sidebar active={active} onNavigate={navigate} practiceCompleted={practiceCompleted} onHelp={() => openUtility('help')} onSettings={() => openUtility('settings')} onProfile={() => openUtility('profile')} />{mobileOpen && <MobileDrawer active={active} onNavigate={navigate} onClose={() => setMobileOpen(false)} onHelp={() => openUtility('help')} onSettings={() => openUtility('settings')} />}<div className="page-wrap"><Header query={query} onSearch={globalSearch} onMenu={() => setMobileOpen(true)} onHelp={() => openUtility('help')} onSettings={() => openUtility('settings')} onProfile={() => openUtility('profile')} /><main ref={mainRef} tabIndex={-1}>{active === 'Inicio' && <HomeView {...common} />}{active === 'Explorar' && <ExploreView initialQuery={query} onQueryChange={setQuery} onOpenCourse={setLesson} />}{active === 'Mis cursos' && <MyCoursesView onOpenCourse={setLesson} onNavigate={navigate} />}{active === 'Práctica' && <PracticeView completed={practiceCompleted} onComplete={completePractice} />}{active === 'Comunidad' && <CommunityView liked={liked} onToggleLike={() => setLiked(value => !value)} onToast={announce} />}</main><nav className="bottom-nav" aria-label="Navegación inferior">{navItems.map(({ label, icon: Icon }) => <button key={label} className={active === label ? 'active' : ''} onClick={() => navigate(label)} aria-current={active === label ? 'page' : undefined}><Icon size={20} /><span>{label === 'Mis cursos' ? 'Cursos' : label}</span></button>)}</nav></div>{lesson && <LessonModal course={lesson} onClose={() => setLesson(null)} onComplete={completeLesson} />}{utility && <UtilityDialog type={utility} onClose={() => setUtility(null)} />}{toast && <div className="toast" role="status" aria-live="polite"><Check size={17} />{toast}</div>}</div>
}

export default App
