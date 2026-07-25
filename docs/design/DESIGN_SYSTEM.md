# Sistema de diseño — iteración 01

## Fundamentos

### Color

| Token local | Valor | Uso |
|---|---|---|
| `--landing-cream` | `#f3f0e7` | Fondo editorial |
| `--landing-ink` | `#123f3a` | Texto, planos principales y foco estructural |
| `--landing-coral` | `#ee6c54` | Énfasis y estado de revisión |
| `--landing-lime` | `#d8f080` | Acción primaria y puntos de atención |
| Mint | `#bde5d4` | Participante/foco secundario |

Se conserva la familia cromática original para no romper el producto existente.

### Tipografía

- Titulares editoriales: `Georgia`, con fallback serif local; no necesita descarga.
- UI y cuerpo: heredan DM Sans/sans-serif del producto.
- Etiquetas: mayúsculas, 7–10 px, tracking amplio; solo para metadatos, nunca para párrafos.

### Escala y espacio

- Contenedor principal: máximo 1320 px.
- Contenedor de lectura: máximo 1180 px.
- Ritmo de secciones: 85–126 px en función del viewport.
- Breakpoints de la landing: 980 px y 620 px.

## Componentes

- **CTA primario:** fondo lima, sombra sólida verde y texto explícito. Funciona sin hover.
- **CTA textual:** subrayado/borde persistente; no depende de cambio de color.
- **Kicker:** etiqueta contextual con línea coral.
- **Communication canvas:** figura semántica con título y leyenda; el diagrama interno es decorativo.
- **Learning sequence:** lista ordenada, no tarjetas.
- **Prototype note:** estado editorial visible, no disclaimer oculto.

## Estados

- Foco: outline coral de 3 px y offset de 4 px en enlaces y botones.
- Hover: refuerzo visual, nunca único indicador de acción.
- Menú móvil: `aria-expanded`, `aria-controls`, cierre por selección y Escape.
- Movimiento reducido: transiciones y animaciones se reducen a `0.01ms`.
