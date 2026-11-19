# Agent guide

Static Astro 7 site with weekly, daily and monthly horoscopes. Content is Markdown generated from real astronomy (`src/zodiac/`) and published by GitHub Actions. The README is the user-facing overview; this file lists what an agent needs to change the code safely.

## Commands

| Task | Command |
| --- | --- |
| Dev server (background) | `npm run dev`, then `astro dev status`, `astro dev logs`, `astro dev stop` |
| Unit tests | `npm run test:unit` |
| Types and content | `npm run check` |
| Build | `npm run build` |
| E2E (Chromium desktop and mobile) | `npm run test:e2e`; first time: `npx playwright install chromium` |
| Everything, before a PR | `npm run test` |
| Generate content | `npm run content -- prepare-day --date=AAAA-MM-DD` (also `publish-*`, `-week`, `-month`) |
| Social cards | `npm run social:cards` after changing the wheel, colors or sign data |

## Where things live

- `src/zodiac/`: pure TypeScript, no Astro imports, tested with `node --test`. Signs and accents (`signs.ts`), calendar in Lima time (`calendar.ts`), sky (`sky.ts`), scoring and ranking (`scoring.ts`), phrase bank (`texts.ts`), wheel geometry (`wheel.ts`), profiles, compatibility, Moon drawing and sky summary.
- `src/components/{layout,ui,shared,home,sign}/`: Astro components with scoped styles. Shared visual tokens are in `src/styles/tokens.css`; global rules in `src/styles/base.css`.
- `src/scripts/`: browser modules loaded by the layout. Component-specific behavior stays in the component's own `<script>`.
- `scripts/`: Node CLIs (`publish-content.ts`, `prune-forecasts.ts`, `render-social-cards.ts`).

## Conventions

- Commits: Conventional Commits with a short description in Spanish (`feat: agrega ...`). PR titles and descriptions in Spanish. No AI attribution.
- UI copy is Spanish (Peru); code, identifiers and comments are English.
- Node runs TypeScript with `--experimental-strip-types`: relative imports in `src/zodiac/` and `scripts/` need the `.ts` extension, and only erasable syntax is allowed (no enums, no parameter properties).
- Generated content is never overwritten: `prepare-*` only writes missing files. Do not hand-edit generated Markdown unless asked.

## UI rules

- No text arrow glyphs (→ ↗ ↓ ↩) in buttons or cards: the owner finds them generic. When an icon is really needed, draw it as an inline SVG.
- Sign pickers use `ui/SignSelect.astro` (accessible listbox), never a native `<select>`. Listen to its `sign-change` event and set it with a `sign-set` event.
- Check every change at 375 px wide: labels stay on one line, lists use a hanging indent, and nothing relies on hover.

## Animation rules

- Never hide content with CSS waiting for JavaScript. Scripts prepare only elements below the fold (`isBelowFold`) and restore them when done.
- Use `motion/mini` (WAAPI) with CSS individual transforms (`translate`, `scale`); the full `motion` entry adds about 25 KB.
- GSAP is imported dynamically in `WeeklyRanking.astro` only. Do not import it from the layout.
- Respect `prefers-reduced-motion`: check `prefersReducedMotion()` in scripts and keep the reduced-motion block in `base.css`.
- Write `animation-timeline` in its own rule, apart from the `animation` shorthand. The CSS minifier merges them into an invalid shorthand and the animation silently stops.
- `view-transition-name` must be unique per page: only ranking cards and the sign hero use `sign-<slug>`.

## Gotchas

- "Today" is computed at build time in `America/Lima`; the daily publish commit redeploys the site.
- `git` uses `autocrlf=true` here. Avoid `sed -i` over globs of untouched files: it rewrites line endings.
- A literal U+FE0E in source trips the watermark hook; write it as `String.fromCodePoint(0xfe0e)`.

## Astro documentation

Full docs: https://docs.astro.build. Relevant guides: [routing](https://docs.astro.build/en/guides/routing/), [components](https://docs.astro.build/en/basics/astro-components/), [content collections](https://docs.astro.build/en/guides/content-collections/), [styling](https://docs.astro.build/en/guides/styling/), [fonts](https://docs.astro.build/en/guides/fonts/).
