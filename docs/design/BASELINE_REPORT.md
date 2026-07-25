# Fase 0 — línea base

Fecha: 2026-07-25  
Alcance: repositorio completo para diagnóstico; `LandingPage` como P1 de esta iteración.

## Producto y restricciones observadas

- React 18 + TypeScript + Vite, sin router externo; las rutas se resuelven por `hash`.
- Landing pública en `/`; producto en `#/inicio`, `#/explorar`, `#/mis-cursos`, `#/practica` y `#/comunidad`.
- Sistema existente: verde profundo, crema, coral, amarillo, Manrope/DM Sans y Lucide.
- No había documentación de diseño. El estado Git estaba limpio sobre `main` antes de editar.
- La app se ejecutó antes de cualquier cambio con `npm run dev -- --host 127.0.0.1`.

## Auditoría de rutas

| Ruta | Estado | H1 | Overflow 1366 px | Hallazgo principal |
|---|---|---:|---:|---|
| `/` | funcional | 1 | no | Identidad cuidada, pero hero intercambiable de producto SaaS y fotografía stock sin valor lingüístico. |
| `#/inicio` | funcional | 1 | no | Buena jerarquía general; presenta métricas, identidad y nombres ficticios como si fueran datos reales. |
| `#/explorar` | funcional | 1 | no | Filtros claros; afirma participación de personas Sordas sin evidencia en el repositorio. |
| `#/mis-cursos` | funcional | 1 | no | Progreso comprensible; datos y fechas de demostración no están marcados como tales. |
| `#/practica` | funcional | 1 | no | P1 cultural: una mano genérica pretende representar señas concretas (“Gracias”, “Familia”). |
| `#/comunidad` | funcional | 1 | no | P1 de confianza: personas, evento, comentarios y cifras aparentan ser reales. |

También se revisaron las cinco rutas de producto a 390 × 844: sin overflow horizontal, sin errores de consola y con un H1 por vista.

## P1 seleccionado

**Landing pública: falta de identidad específica y de transparencia cultural.** Es la superficie de mayor alcance y la primera fuente de confianza. El hero anterior dependía de una fotografía genérica de amistades, una tarjeta de lección simulada y mensajes como “Comenzar gratis” o “Comunidad que acompaña” sin evidencia verificable.

## Evidencia visual inicial

Capturas en `docs/design/screenshots/baseline/`:

- `landing-360x800.png`
- `landing-390x844.png`
- `landing-768x1024.png`
- `landing-1366x768.png`
- `landing-1440x900.png`

## Puntuación de línea base: 63/100

| Dimensión | Peso | Resultado |
|---|---:|---:|
| Claridad y jerarquía | 20 | 16 |
| Pertinencia visual para LSM | 20 | 8 |
| Confianza y honestidad | 15 | 6 |
| Accesibilidad | 20 | 14 |
| Responsive | 15 | 13 |
| Rendimiento/mantenimiento | 10 | 6 |

La puntuación no es una certificación WCAG ni una medición de conversión; es la rúbrica interna de esta iteración.
