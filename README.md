# Ranking Zodiacal

Sitio estático de horóscopo semanal en español, construido con Astro, TypeScript y Markdown. Cada edición contiene el ranking de los 12 signos y una lectura individual para cada uno.

## Desarrollo local

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

Pages CMS edita los archivos del repositorio mediante GitHub. Cada commit de contenido puede activar un nuevo despliegue automático.
