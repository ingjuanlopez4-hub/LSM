import { ArrowDownRight, ArrowRight, Eye, Hand, Menu, MoveUpRight, ScanFace, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import './landing.css'

const learningSequence = [
  {
    signal: 'Mirada',
    title: 'Observa el mensaje completo',
    body: 'Ubica hacia dónde mira la persona y cómo orienta el cuerpo antes de concentrarte en las manos.',
  },
  {
    signal: 'Movimiento',
    title: 'Repite con intención',
    body: 'Practica en sesiones breves. Pausa, compara el recorrido y vuelve a observar antes de avanzar.',
  },
  {
    signal: 'Contexto',
    title: 'Comprende el uso real',
    body: 'Relaciona cada recurso con una situación, una intención y el contexto cultural que le da sentido.',
  },
]

function LandingBrand() {
  return <a className="landing-brand" href="#inicio" aria-label="Manos MX, ir al inicio">
    <span className="brand-hand" aria-hidden="true"><Hand size={22} strokeWidth={2.4} /></span>
    <strong>MANOS<span>/MX</span></strong>
  </a>
}

function VisualField() {
  return <figure className="visual-field" aria-labelledby="field-title field-caption">
    <div className="field-rail" aria-hidden="true">
      <span>ENCUADRE COMPLETO</span>
      <span>LSM · CAMPO 01</span>
    </div>
    <div className="field-stage">
      <div className="field-subject" aria-hidden="true">
        <span className="subject-head" />
        <span className="subject-body" />
        <span className="subject-hand subject-hand-left" />
        <span className="subject-hand subject-hand-right" />
      </div>
      <div className="focus-point focus-eyes" aria-hidden="true"><span>01</span><b>MIRADA</b></div>
      <div className="focus-point focus-face" aria-hidden="true"><span>02</span><b>EXPRESIÓN</b></div>
      <div className="focus-point focus-hands" aria-hidden="true"><span>03</span><b>MANOS</b></div>
      <div className="focus-point focus-space" aria-hidden="true"><span>04</span><b>ESPACIO</b></div>
      <svg className="field-trace" viewBox="0 0 500 640" preserveAspectRatio="none" aria-hidden="true">
        <path pathLength="1" d="M88 176 C180 128 323 148 405 222 S373 387 242 385 101 463 152 550" />
      </svg>
      <div className="field-thesis">
        <Eye size={23} aria-hidden="true" />
        <p id="field-title">El significado no cabe en un par de manos.</p>
      </div>
    </div>
    <figcaption id="field-caption"><span>NOTA DE USO</span> Diagrama de atención. No representa ni enseña una seña.</figcaption>
  </figure>
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  const closeMenu = () => setMenuOpen(false)

  return <div className="landing-page" id="inicio">
    <a className="skip-link" href="#contenido">Saltar al contenido</a>
    <header className="landing-header">
      <LandingBrand />
      <p className="header-purpose">PRÁCTICA VISUAL<br />PARA INICIAR EN LSM</p>
      <button className="landing-menu-button" onClick={() => setMenuOpen(value => !value)} aria-expanded={menuOpen} aria-controls="landing-navigation" aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}>
        {menuOpen ? <X /> : <Menu />}
      </button>
      <nav id="landing-navigation" className={menuOpen ? 'landing-nav open' : 'landing-nav'} aria-label="Navegación principal">
        <a href="#metodo" onClick={closeMenu}>Método</a>
        <a href="#criterio" onClick={closeMenu}>Criterio cultural</a>
        <a href="#/inicio" onClick={closeMenu}>Entrar</a>
        <a className="nav-primary" href="#/explorar" onClick={closeMenu}>Explorar <ArrowRight size={16} /></a>
      </nav>
    </header>

    <main className="landing-main" id="contenido">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="hero-copy">
          <p className="landing-kicker"><span>CURSO DE ENTRADA</span><span>PROTOTIPO 2026</span></p>
          <h1 id="landing-title"><span>APRENDER</span><strong>A MIRAR</strong></h1>
          <p className="hero-lead">La LSM se articula con las manos, la mirada, el rostro, el cuerpo y el espacio. Empieza por entrenar la atención al mensaje completo.</p>
          <div className="hero-actions">
            <a className="landing-button primary" href="#/explorar">Explorar el contenido <MoveUpRight size={18} /></a>
            <a className="landing-button quiet" href="#metodo">Ver cómo funciona <ArrowDownRight size={17} /></a>
          </div>
          <p className="prototype-note"><strong>Contenido en revisión.</strong> Los materiales lingüísticos requieren validación de especialistas Sordos antes de publicarse.</p>
        </div>
        <VisualField />
      </section>

      <section className="field-statement" aria-label="Principio de aprendizaje">
        <p>LAS MANOS ARTICULAN.</p>
        <p>EL CUERPO SITÚA.</p>
        <p className="statement-accent">LA MIRADA CONECTA.</p>
      </section>

      <section className="method-section" id="metodo" aria-labelledby="method-title">
        <header className="method-heading">
          <p className="section-code">MÉTODO / TRES MOMENTOS</p>
          <h2 id="method-title">No memorices una forma.<br /><span>Lee una situación.</span></h2>
          <p>La secuencia organiza la atención antes de pedir una repetición. El orden importa: observar, practicar y volver al contexto.</p>
        </header>
        <ol className="learning-sequence">
          {learningSequence.map((item, index) => <li key={item.signal}>
            <span className="sequence-index">0{index + 1}</span>
            <div className="sequence-signal"><i aria-hidden="true" />{item.signal}</div>
            <div className="sequence-copy"><h3>{item.title}</h3><p>{item.body}</p></div>
            <ArrowRight aria-hidden="true" />
          </li>)}
        </ol>
      </section>

      <section className="practice-window" aria-labelledby="practice-title">
        <div className="window-label" aria-hidden="true"><span>PRÁCTICA GUIADA</span><span>00:40</span></div>
        <div className="window-demo" aria-hidden="true">
          <span className="demo-eye"><Eye /></span>
          <span className="demo-face"><ScanFace /></span>
          <svg viewBox="0 0 620 230"><path pathLength="1" d="M45 166 C146 45 272 195 378 86 S535 60 580 150" /></svg>
          <span className="demo-caption">OBSERVA EL RECORRIDO</span>
        </div>
        <div className="window-copy">
          <p className="section-code">UNA LECCIÓN, TRES CONTROLES</p>
          <h2 id="practice-title">Pausa.<br />Compara.<br /><span>Vuelve a mirar.</span></h2>
          <p>Las lecciones propuestas usan video de cuerpo completo, velocidad ajustable y repetición por fragmentos. Nada avanza por ti.</p>
          <a className="landing-button primary" href="#/inicio">Probar la plataforma <ArrowRight size={18} /></a>
        </div>
      </section>

      <section className="culture-section" id="criterio" aria-labelledby="culture-title">
        <div className="culture-mark" aria-hidden="true"><span>ANTES DE<br />PUBLICAR</span><strong>REVISAR</strong></div>
        <div className="culture-copy">
          <p className="section-code">CRITERIO CULTURAL</p>
          <h2 id="culture-title">La Cultura Sorda no es contexto adicional. <span>Es parte de la lengua.</span></h2>
          <p>El vocabulario, los ejemplos y el enfoque pedagógico deben revisarse con personas Sordas especialistas en LSM. Este prototipo hace visible esa validación pendiente; no intenta sustituirla.</p>
        </div>
        <a href="#/comunidad">Conocer el espacio de comunidad <ArrowRight size={17} /></a>
      </section>

      <section className="final-cta" aria-labelledby="cta-title">
        <p className="section-code">LISTO PARA OBSERVAR</p>
        <h2 id="cta-title">ENTRA CON<br /><span>LOS OJOS ABIERTOS.</span></h2>
        <a className="landing-button inverted" href="#/explorar">Explorar Manos MX <MoveUpRight size={18} /></a>
      </section>
    </main>

    <footer className="landing-footer">
      <LandingBrand />
      <p>Prototipo educativo de Lengua de Señas Mexicana.</p>
      <nav aria-label="Navegación de pie de página"><a href="#metodo">Método</a><a href="#criterio">Criterio cultural</a><a href="#/inicio">Entrar</a></nav>
      <small>© {new Date().getFullYear()}</small>
    </footer>
  </div>
}
