# Atajos interactivos de lectores de pantalla

Versión v7: mejora la visibilidad de búsqueda, categoría y filtro por tecla mediante una barra de filtros activos.

Miniaplicación HTML local para explorar atajos de JAWS, NVDA y VoiceOver con una experiencia visual inspirada en SHRTCTS.

## Cómo abrirlo

1. Descomprime el paquete.
2. Abre `index.html` en cualquier navegador moderno.
3. No requiere servidor local ni dependencias externas.

## Cambios de esta versión

- Paso 2 prioriza la lista de shortcuts: búsqueda y categorías quedan ocultas en un acordeón cerrado por defecto.
- La lista de funciones se muestra en tarjetas más compactas para ver más elementos sin scroll.
- En escritorio, la lista aprovecha más ancho y puede organizarse en dos columnas.
- Cada tarjeta muestra de forma rápida la función y la combinación de teclas.
- El teclado visual sigue marcando claramente las teclas del shortcut seleccionado.
- El filtro por tecla se mantiene, pero con una etiqueta más comprensible.

## Accesibilidad

- HTML semántico con `header`, `main`, `section`, `aside`, `nav`, listas y botones reales.
- Enlace de salto al contenido principal.
- Foco visible.
- Estados con `aria-pressed` y `aria-current`.
- Mensajes actualizados con `aria-live`.
- La identificación del atajo no depende solo del color: incluye número, texto y descripción.
- La lista de funciones permite navegación con flechas arriba/abajo, Home y End.
- Si hay búsqueda, categoría o tecla filtrando la lista, se muestra un mensaje visible con opción para quitar cada filtro o todos.
- Respeta `prefers-reduced-motion`.

## Archivos

- `index.html`: estructura semántica.
- `styles.css`: diseño visual, teclado, estados y responsive.
- `app.js`: datos, filtros, selección, renderizado del teclado y comportamiento interactivo.

## Cambios v6

- Paso 2 vuelve a un ancho estrecho similar al diseño original.
- La lista del paso 2 se muestra en una sola columna.
- Cada shortcut muestra solo la función y la combinación de teclas.
- La descripción completa queda reservada para el paso 3 al seleccionar una función.
