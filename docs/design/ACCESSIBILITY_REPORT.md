# Reporte de accesibilidad

## Implementado y verificado

- `html` ya declara `lang="es-MX"`.
- Un único H1 en landing y en cada ruta auditada.
- Landmarks semánticos: `header`, `nav`, `main`, `section`, `figure`, `footer`.
- Enlace “Saltar al contenido” visible al recibir foco.
- Todos los enlaces y botones de la landing tienen nombre accesible; verificación DOM: **0 controles sin nombre**.
- El canvas tiene `figure`, `aria-labelledby` y `figcaption`; su geometría interna usa `aria-hidden`.
- Foco visible para teclado en enlaces y botones.
- Menú móvil expone estado, abre sin hover y cierra con Escape.
- `prefers-reduced-motion: reduce` verificado: duración computada `0.00001s`.
- No se usan imágenes para representar señas; la landing final contiene **0 imágenes**.
- No se detectó overflow horizontal en 360, 390, 768, 1366 o 1440 px.

## Revisión manual de teclado

Se comprobó apertura/cierre del menú móvil y cierre por Escape mediante Chrome DevTools Protocol. Los CTA son enlaces nativos y conservan activación con Enter. La lectura no depende de hover.

## Pendiente / no certificado

- No se ejecutó axe-core porque no está instalado y no se agregó una dependencia.
- Falta prueba con lector de pantalla real (NVDA, VoiceOver o TalkBack).
- Falta comprobación formal de contraste de cada combinación y zoom al 200/400%.
- El foco no regresa explícitamente al botón al cerrar el menú con Escape; debe incorporarse si el menú evoluciona a diálogo modal.
- La accesibilidad lingüística para personas Sordas requiere video en LSM, subtítulos/transcripción y validación humana; no queda resuelta por esta iteración visual.

Conclusión: mejoras sustanciales, **no certificación WCAG**.
