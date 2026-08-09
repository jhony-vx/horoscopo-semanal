# Ranking Zodiacal

Sitio estático de horóscopo semanal en español, construido con Astro, TypeScript y Markdown. Cada edición contiene el ranking de los 12 signos y una lectura individual para cada uno.

## Desarrollo local

Requiere Node.js 22.12.0 o superior.

```bash
npm install
npm run dev
```

Validación y build:

```bash
npm run check
npm run build
npm run test
```

## Contenido semanal

El contenido vive en:

- `src/content/weeks/`: una edición semanal por archivo.
- `src/content/horoscopes/`: una predicción por signo y semana.
- `.pages.yml`: configuración para editar el contenido desde Pages CMS.

Una semana publicada debe tener exactamente 12 signos y puestos únicos del 1 al 12. Las semanas usan el formato lunes a domingo y la zona editorial de Lima.

## Despliegue

Cloudflare Pages:

- Build command: `npm run build`
- Output directory: `dist`
- Production branch: `main`
- Node.js: `22.12.0` (definido en `.nvmrc`)

Pages CMS edita los archivos del repositorio mediante GitHub. Cada commit de contenido puede activar un nuevo despliegue automático.

### Publicación diaria

El workflow `.github/workflows/publish-daily.yml` genera y publica automáticamente los 12 signos de `today` y los 12 de `tomorrow` usando America/Lima. Se ejecuta diariamente a las 05:00 (10:00 UTC), valida con `npm run check`, `npm run build` y `npm run test:e2e`, y solo hace commit si ambos grupos están completos. También puede ejecutarse manualmente desde la pestaña **Actions** de GitHub.

Los workflows `.github/workflows/publish-weekly.yml` y `.github/workflows/publish-monthly.yml` aplican el mismo proceso para la nueva edición semanal de cada lunes y el nuevo grupo mensual el primer día de cada mes. Todos comparten una cola de publicación para evitar commits simultáneos.
