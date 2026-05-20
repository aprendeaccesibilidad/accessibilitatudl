# A11yEvaluaBasico

Bookmarklet de evaluación accesible basado en W3C Easy Checks. Muestra switches por comprobación, filtros inferiores por discapacidad y marcas visibles sobre la página actual.

## Cambios de esta versión

- Lista limitada a comprobaciones W3C Easy Checks y evaluaciones de formulario WCAG relacionadas.
- Cada comprobación se activa o desactiva con un switch.
- La parte superior informa de posibles errores observados y su tipo.
- La estructura de encabezados se muestra como árbol tipo HeadingsMap.
- Las imágenes, landmarks, skip links, videos y formularios se marcan directamente en la página.
- Los filtros por discapacidad están en la parte inferior.
- Preparado para GitHub Pages.

## Ver en local

```bash
python3 -m http.server 8000
```

Abre:

```text
http://localhost:8000
```

Arrastra el botón **A11yEvaluaBasico** a la barra de favoritos.

## Publicar en GitHub Pages

1. Sube estos archivos a la raíz de un repositorio público.
2. Ve a **Settings → Pages**.
3. Selecciona **Deploy from branch → main → /root**.
4. Abre la URL publicada.
5. Arrastra el botón a la barra de favoritos.

## Archivos

```text
index.html
A11yEvaluaBasico.js
README.md
```
