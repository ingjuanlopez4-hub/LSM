import { ArrowDown, ArrowRight, Eye, Hand, Menu, MessageCircle, MoveRight, ScanEye, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import './landing.css'

const learningSequence = [
  { number: '01', title: 'Observa el mensaje completo', body: 'Atiende al movimiento, la mirada, la expresión y al espacio; no solo a las manos.', icon: ScanEye },
  { number: '02', title: 'Practica con intención', body: 'Repite en sesiones breves y vuelve a mirar antes de avanzar.', icon: MoveRight },
  { number: '03', title: 'Conecta lengua y contexto', body: 'Acércate a la LSM junto con el contexto social y cultural que le da vida.', icon: MessageCircle },
]

function LandingBrand() {
  return <a className="landing-brand" href="#inicio" aria-label="Manos MX, ir al inicio"><span aria-hidden="true"><Hand size={21} strokeWidth={2.3} /></span><strong>manos<i>mx</i></strong></a>
}

function CommunicationCanvas() {
  return <figure className="communication-canvas" aria-labelledby="canvas-title canvas-caption">
    <div className="canvas-meta"><span>CAMPO VISUAL</span><span>01 / 03</span></div>
    <div className="canvas-stage" aria-hidden="true">
      <span className="canvas-axis horizontal" />
      <span className="canvas-axis vertical" />
      <div className="person person-a"><span>A</span><small>PERSONA</small></div>
      <div className="person person-b"><span>B</span><small>PERSONA</small></div>
      <span className="dialogue-path path-one"><i />DIRECCIÓN</span>
      <span className="dialogue-path path-two"><i />MIRADA</span>
      <span className="space-label label-expression">EXPRESIÓN</span>
      <span className="space-label label-space">ESPACIO</span>
      <div className="canvas-center"><Eye size={25} /><strong id="canvas-title">Mira antes de repetir</strong><span>El significado también ocurre alrededor de las manos.</span></div>
    </div>
    <figcaption id="canvas-caption"><span>Diagrama conceptual</span>No representa ni enseña una seña de LSM.</figcaption>
  </figure>
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  return <div className="landing-page" id="inicio">
    <a className="skip-link" href="#contenido">Saltar al contenido</a>
    <header className="landing-header">
      <LandingBrand />
      <button className="landing-menu-button" onClick={() => setMenuOpen(value => !value)} aria-expanded={menuOpen} aria-controls="landing-navigation" aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}>{menuOpen ? <X /> : <Menu />}</button>
      <nav id="landing-navigation" className={menuOpen ? 'landing-nav open' : 'landing-nav'} aria-label="Navegación principal">
        <a href="#enfoque" onClick={closeMenu}>Enfoque</a>
        <a href="#recorrido" onClick={closeMenu}>Recorrido</a>
        <a href="#criterio" onClick={closeMenu}>Criterio cultural</a>
        <a className="landing-login" href="#/inicio" onClick={closeMenu}>Entrar</a>
        <a className="landing-nav-cta" href="#/explorar" onClick={closeMenu}>Explorar plataforma <ArrowRight size={16} /></a>
      </nav>
    </header>

    <main className="landing-main" id="contenido">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="hero-copy">
          <p className="landing-kicker"><span /> LENGUA DE SEÑAS MEXICANA</p>
          <h1 id="landing-title">Aprender a mirar.<br /><em>Empezar a dialogar.</em></h1>
          <p className="hero-lead">Una plataforma para acercarte a la LSM desde la comunicación visual, el uso del espacio y el contexto cultural.</p>
          <div className="hero-actions">
            <a className="landing-button primary" href="#/explorar">Explorar el contenido <ArrowRight size={18} /></a>
            <a className="landing-button text" href="#enfoque">Conocer el enfoque <ArrowDown size={17} /></a>
          </div>
          <p className="prototype-note"><span>ESTADO DEL CONTENIDO</span> Prototipo sujeto a revisión de especialistas Sordos antes de publicación.</p>
        </div>
        <CommunicationCanvas />
      </section>

      <section className="visual-language-strip" aria-label="Dimensiones de la comunicación visual">
        <p>El mensaje ocurre en <strong>todo el campo visual.</strong></p>
        <div><span>MANOS</span><i /><span>MIRADA</span><i /><span>EXPRESIÓN</span><i /><span>ESPACIO</span></div>
      </section>

      <section className="approach-section" id="enfoque" aria-labelledby="approach-title">
        <header className="section-heading">
          <p className="landing-kicker">UN RECORRIDO PARA MIRAR CON ATENCIÓN</p>
          <h2 id="approach-title">La interfaz sigue<br />la lógica del <em>diálogo.</em></h2>
          <p>Primero orienta la atención. Después propone una práctica. Siempre devuelve el contenido a su contexto.</p>
        </header>
        <ol className="learning-sequence">
          {learningSequence.map(({ number, title, body, icon: Icon }) => <li key={number}>
            <span className="sequence-number">{number}</span>
            <span className="sequence-icon" aria-hidden="true"><Icon /></span>
            <div><h3>{title}</h3><p>{body}</p></div>
            <ArrowRight className="sequence-arrow" aria-hidden="true" />
          </li>)}
        </ol>
      </section>

      <section className="route-section" id="recorrido" aria-labelledby="route-title">
        <div className="route-index" aria-hidden="true"><span>RUTA</span><strong>01</strong><i /></div>
        <div className="route-copy">
          <p className="landing-kicker">PUNTO DE PARTIDA</p>
          <h2 id="route-title">Una ruta inicial,<br />paso a paso.</h2>
          <p>Explora el prototipo de cursos y práctica. Las lecciones visuales definitivas deberán usar video de cuerpo completo, controles de reproducción y validación lingüística.</p>
          <a className="landing-button primary" href="#/explorar">Ver el catálogo <ArrowRight size={18} /></a>
        </div>
        <div className="route-outline" aria-label="Estructura propuesta de la ruta">
          <p><span>01</span><strong>Atención visual</strong><small>Qué observar antes de imitar</small></p>
          <p><span>02</span><strong>Práctica guiada</strong><small>Repetir, comparar y ajustar</small></p>
          <p><span>03</span><strong>Uso en contexto</strong><small>Comprender intención y situación</small></p>
        </div>
      </section>

      <section className="culture-commitment" id="criterio" aria-labelledby="commitment-title">
        <div className="commitment-mark" aria-hidden="true"><span>VALIDACIÓN</span><strong>HUMANA</strong></div>
        <div>
          <p className="landing-kicker">CRITERIO DE PUBLICACIÓN</p>
          <h2 id="commitment-title">La Cultura Sorda no es una nota al margen.</h2>
          <p>Antes de publicar, el vocabulario, los ejemplos visuales y el enfoque cultural deben revisarse con personas Sordas especialistas en LSM. Esta versión documenta esa validación como pendiente; no la sustituye.</p>
        </div>
        <a href="#/comunidad">Ver espacio de comunidad <ArrowRight size={17} /></a>
      </section>

      <section className="final-cta" aria-labelledby="cta-title">
        <p className="landing-kicker">EXPLORA EL PROTOTIPO</p>
        <h2 id="cta-title">Mira el recorrido.<br /><em>Evalúa la experiencia.</em></h2>
        <p>Entra a la plataforma y conoce cómo se organizan cursos, práctica y comunidad.</p>
        <a className="landing-button primary" href="#/inicio">Entrar a Manos MX <ArrowRight size={18} /></a>
      </section>
    </main>

    <footer className="landing-footer">
      <LandingBrand />
      <p>Prototipo educativo de Lengua de Señas Mexicana.</p>
      <nav aria-label="Navegación de pie de página"><a href="#enfoque">Enfoque</a><a href="#recorrido">Recorrido</a><a href="#criterio">Validación</a></nav>
      <small>© {new Date().getFullYear()} Manos MX</small>
    </footer>
  </div>
}
