# QA visual — Máster Loop 01

## Antes

### Problema

La primera impresión era pulida pero genérica: hero SaaS a dos columnas, fotografía stock, tarjetas flotantes y promesas no acreditadas. La relación con LSM dependía más del copy y del icono de mano que de la comunicación visual.

### Evidencia

- Stock de Unsplash en hero y comunidad.
- Tarjeta “Presentarte en LSM” con progreso 68% sin función real.
- “Comenzar gratis”, “Comunidad que acompaña” y beneficios sin fuente.
- Grid repetitivo de tres tarjetas.

### Hipótesis

Si la propia composición demuestra atención, dirección, espacio y diálogo —sin fingir una seña— y declara el estado real del contenido, la landing será más específica, memorable y confiable.

## Alcance y criterios

- Rediseñar la landing completa sin cambiar el enrutado ni la app autenticada.
- No usar stock, testimonios, métricas, personas o señas inventadas.
- Mantener paleta y marca reconocibles.
- Responsive en 360, 390, 768, 1366 y 1440 px.
- HTML semántico, teclado, foco visible y reduced motion.
- Sin errores de consola ni overflow horizontal.

## Riesgos

- Confundir el diagrama con enseñanza de una seña.
- Exceso de advertencias que reduzca conversión.
- Divergencia tipográfica entre landing editorial y dashboard.

## Cambios implementados

- Hero editorial asimétrico y canvas propio de comunicación.
- Copy orientado a mirada, espacio y diálogo.
- Estado de prototipo y validación Sorda pendientes en primer viewport.
- Sustitución de cards por lista secuencial y ruta tipográfica.
- Sección de criterio cultural como requisito de publicación.
- Eliminación de fotografías y dependencias visuales remotas de la landing.
- Skip link, foco para enlaces, Escape en menú y reduced motion.

## Pruebas

| Prueba | Resultado |
|---|---|
| Chrome real, 5 viewports | aprobado |
| Overflow DOM en 5 viewports | `false` en todos |
| Consola (errores/warnings de app) | 0 |
| Controles sin nombre accesible | 0 |
| Menú móvil | abre (`aria-expanded=true`) y Escape cierra |
| `npm run lint` | aprobado |
| `npm run typecheck` | aprobado |
| `npm run build` | aprobado |
| `npm test` | 3 archivos, 19 tests aprobados |

## Resultado visual

Capturas finales en `docs/design/screenshots/iteration-01/`. El hero mantiene legibilidad y prioridad del CTA en móvil; en escritorio el campo visual completa el primer viewport sin competir con el titular. A 768 px la narrativa se apila y conserva respiración.

## Problemas encontrados

- La primera captura reveló fallback serif implícito por carga de fuente; se convirtió en decisión explícita usando Georgia local para estabilizar la dirección editorial.
- La plataforma interna conserva stock y contenido de demostración no etiquetado.
- No existe suite E2E ni axe instalada.

## Puntuación final: 82/100

| Dimensión | Peso | Resultado |
|---|---:|---:|
| Claridad y jerarquía | 20 | 18 |
| Pertinencia visual para LSM | 20 | 18 |
| Confianza y honestidad | 15 | 13 |
| Accesibilidad | 20 | 15 |
| Responsive | 15 | 13 |
| Rendimiento/mantenimiento | 10 | 5 |

No se asigna 90+: faltan validación con Comunidad Sorda, pruebas con usuarios, auditoría WCAG formal y limpieza del contenido simulado en rutas internas.

## Siguiente acción

P1: retirar o marcar como demostración todas las señas, identidades, eventos, cifras y afirmaciones no validadas dentro de las rutas de producto; sustituir primero el reto de práctica que atribuye significado a una ilustración genérica.
