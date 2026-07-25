import { ArrowRight, BookOpen, Check, Hand, Menu, MessageCircle, Play, Sparkles, Users, X } from 'lucide-react'
import { useState } from 'react'
import { courses } from './data'
import './landing.css'

const highlights = [
  { number: '01', title: 'Mira', body: 'Lecciones visuales breves para observar cada movimiento con atención.' },
  { number: '02', title: 'Practica', body: 'Retos cotidianos para recordar vocabulario y ganar confianza.' },
  { number: '03', title: 'Conecta', body: 'Aprende la lengua junto con el contexto y la Cultura Sorda.' },
]

function LandingBrand() {
  return <a className="landing-brand" href="#/" aria-label="Manos MX, inicio"><span><Hand size={22} strokeWidth={2.4} /></span><strong>manos<i>mx</i></strong></a>
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const featured = courses.slice(0, 3)
  const closeMenu = () => setMenuOpen(false)

  return <div className="landing-page">
    <header className="landing-header">
      <LandingBrand />
      <button className="landing-menu-button" onClick={() => setMenuOpen(value => !value)} aria-expanded={menuOpen} aria-controls="landing-navigation" aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}>{menuOpen ? <X /> : <Menu />}</button>
      <nav id="landing-navigation" className={menuOpen ? 'landing-nav open' : 'landing-nav'} aria-label="Navegación principal">
        <a href="#metodo" onClick={closeMenu}>Cómo funciona</a>
        <a href="#cursos" onClick={closeMenu}>Cursos</a>
        <a href="#comunidad" onClick={closeMenu}>Comunidad</a>
        <a className="landing-login" href="#/inicio" onClick={closeMenu}>Entrar</a>
        <a className="landing-nav-cta" href="#/inicio" onClick={closeMenu}>Comenzar gratis <ArrowRight size={16} /></a>
      </nav>
    </header>

    <main className="landing-main">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="hero-copy">
          <p className="landing-kicker"><span /> LENGUA DE SEÑAS MEXICANA</p>
          <h1 id="landing-title">Tus manos<br />ya tienen algo<br /><em>que decir.</em></h1>
          <p className="hero-lead">Aprende LSM a tu ritmo con lecciones visuales, práctica real y una ruta que también te acerca a la Cultura Sorda.</p>
          <div className="hero-actions">
            <a className="landing-button primary" href="#/inicio">Empezar a aprender <ArrowRight size={18} /></a>
            <a className="landing-button text" href="#metodo"><Play size={17} fill="currentColor" /> Conoce el método</a>
          </div>
          <div className="hero-proof" aria-label="Características de la plataforma">
            <span><Check size={14} /> Empieza desde cero</span>
            <span><Check size={14} /> A tu propio ritmo</span>
          </div>
        </div>
        <div className="hero-visual" aria-label="Vista previa de una lección de lengua de señas">
          <div className="hero-image-wrap">
            <img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1100&q=85" alt="Amigos conversando y aprendiendo juntos" />
            <span className="image-label">APRENDER ES CONECTAR</span>
          </div>
          <div className="lesson-float">
            <span className="float-icon"><Hand size={23} /></span>
            <div><small>LECCIÓN 04</small><strong>Presentarte en LSM</strong><span><i style={{ width: '68%' }} /> 68%</span></div>
            <button aria-label="Reproducir lección"><Play size={16} fill="currentColor" /></button>
          </div>
          <div className="visual-note"><Sparkles size={16} /><span><strong>Una seña a la vez</strong><small>Práctica breve todos los días</small></span></div>
        </div>
      </section>

      <section className="intro-strip" aria-label="Propuesta de valor">
        <p>Una lengua <em>visual, viva</em> y profundamente mexicana.</p>
        <div><span>LECCIONES VISUALES</span><span>PRÁCTICA DIARIA</span><span>CULTURA SORDA</span></div>
      </section>

      <section className="method-section" id="metodo" aria-labelledby="method-title">
        <div className="section-heading">
          <p className="landing-kicker">UN MÉTODO HECHO PARA VER</p>
          <h2 id="method-title">Aprender LSM es<br />aprender a <em>mirar.</em></h2>
          <p>Cada lección combina observación, repetición y contexto para ayudarte a comunicarte de manera clara y respetuosa.</p>
        </div>
        <div className="method-grid">
          {highlights.map((item, index) => <article key={item.number} className={index === 1 ? 'method-card featured' : 'method-card'}>
            <span>{item.number}</span>
            <div className="method-icon">{index === 0 ? <Play /> : index === 1 ? <Hand /> : <MessageCircle />}</div>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </article>)}
        </div>
      </section>

      <section className="courses-section" id="cursos" aria-labelledby="courses-title">
        <div className="courses-heading">
          <div><p className="landing-kicker">EMPIEZA POR AQUÍ</p><h2 id="courses-title">Tu primera ruta<br />en <em>LSM.</em></h2></div>
          <p>Desde tu primera seña hasta una conversación cotidiana. Avanza en orden o explora lo que más necesitas.</p>
          <a href="#/explorar">Ver todos los cursos <ArrowRight size={17} /></a>
        </div>
        <div className="landing-course-grid">
          {featured.map((course, index) => <article className="landing-course-card" key={course.id}>
            <a className="landing-course-image" href="#/explorar" aria-label={`Explorar ${course.title}`}>
              <img src={course.image} alt="" />
              <span>{String(index + 1).padStart(2, '0')}</span>
              <i><Play size={17} fill="currentColor" /></i>
            </a>
            <p>{course.level} · {course.lessons} LECCIONES</p>
            <h3>{course.title}</h3>
            <span>{course.description}</span>
          </article>)}
        </div>
      </section>

      <section className="culture-section" id="comunidad" aria-labelledby="culture-title">
        <div className="culture-image">
          <img src="https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=1100&q=85" alt="Grupo de personas reunidas en comunidad" />
          <span><Users size={17} /> COMUNIDAD QUE ACOMPAÑA</span>
        </div>
        <div className="culture-copy">
          <p className="landing-kicker">MÁS QUE VOCABULARIO</p>
          <h2 id="culture-title">La lengua vive<br />en su <em>comunidad.</em></h2>
          <p>Aprender LSM también significa conocer las historias, perspectivas e identidad de la Comunidad Sorda en México.</p>
          <ul>
            <li><BookOpen size={18} /><span><strong>Contexto en cada ruta</strong>Comprende el porqué, no solo el movimiento.</span></li>
            <li><Users size={18} /><span><strong>Aprendizaje respetuoso</strong>Acércate a la cultura desde la escucha y la curiosidad.</span></li>
          </ul>
          <a href="#/comunidad">Conocer la comunidad <ArrowRight size={17} /></a>
        </div>
      </section>

      <section className="final-cta" aria-labelledby="cta-title">
        <span className="cta-hand"><Hand size={44} /></span>
        <p className="landing-kicker">TU PRIMERA LECCIÓN TE ESPERA</p>
        <h2 id="cta-title">Empieza hoy.<br /><em>Habla con tus manos.</em></h2>
        <p>No necesitas experiencia previa. Solo curiosidad y unos minutos al día.</p>
        <a className="landing-button primary" href="#/inicio">Comenzar gratis <ArrowRight size={18} /></a>
      </section>
    </main>

    <footer className="landing-footer">
      <LandingBrand />
      <p>Aprende Lengua de Señas Mexicana con propósito.</p>
      <nav aria-label="Navegación de pie de página"><a href="#metodo">Método</a><a href="#cursos">Cursos</a><a href="#comunidad">Comunidad</a></nav>
      <small>© {new Date().getFullYear()} Manos MX</small>
    </footer>
  </div>
}
