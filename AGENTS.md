# Repository Guidelines

## Project Structure & Module Organization
- Root HTML entry points: `index.html`, `about.html`, `portfolio.html`.
- Source assets: `src/` (CSS in `src/css/style.css`, JS modules in `src/js/`, media in `src/media/`).
- Public static assets served as-is: `public/` (e.g., `public/vendor/gsap/`).
- Build output (if generated): `dist/`.

## Build, Test, and Development Commands
- `npm run dev`: Start the Vite dev server for local development.
- `npm run build`: Create a production build in `dist/`.
- `npm run preview`: Preview the production build locally.
- There is no dedicated `test` script in `package.json` at this time.

## Coding Style & Naming Conventions
- Indentation: 2 spaces in HTML/CSS/JS files.
- JavaScript: ES modules (imports from `src/js/`), class-based utilities like `ScrollManager`.
- CSS: BEM-style naming (`block__element--modifier`), with utility classes mixed in.
- Formatting/linting: no automated formatter or linter is configured.

## Testing Guidelines
- No automated tests are configured in this repository.
- If you add tests, document the framework and add a script in `package.json`.

## Commit & Pull Request Guidelines
- Commit messages are short, imperative, and descriptive (e.g., “Add GSAP scroll-triggered reveals”).
- Keep commits scoped to a single change set when possible.
- PRs should include: a concise summary, relevant screenshots for visual changes, and any manual test notes (e.g., pages and browsers verified).

## Security & Configuration Tips
- Keep secrets in `.env` and avoid committing credentials.
- When adding third-party libraries, prefer vendored assets in `public/` to keep local builds deterministic.
