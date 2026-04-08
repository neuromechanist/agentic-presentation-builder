# Repository Guidelines

## Project Structure & Module Organization
`src/` contains the presentation engine. Use `src/parser/` for JSON normalization, `src/validator/` for schema checks, `src/renderer/` for HTML generation, and `src/utils/` for shared helpers such as theme and markdown handling. `src/app.js` boots the browser app, while `src/index.js` exposes the Node-facing entry point. Keep sample decks in `examples/`, shared sample media in `examples/assets/`, and the JSON contract in `schema/presentation.schema.json`. Root files like `index.html` and `vite.config.js` drive the Vite app; `scripts/validate.js` is the CLI validator.

## Build, Test, and Development Commands
Run `npm install` once to install dependencies. Use `npm run dev` to start the local Vite server on port `3000`, `npm run build` to create a production bundle in `dist/`, and `npm run preview` to inspect that build locally. Run `npm run validate -- examples/hello-world.json` to check a presentation against the JSON schema before committing changes. `npm test` runs Node's built-in test runner, `npm run lint` checks `src/` with ESLint, and `npm run format` applies Prettier to JS, JSON, CSS, and HTML sources.

## Coding Style & Naming Conventions
This codebase uses ES modules, 2-space indentation, semicolons, and single quotes in JavaScript. Prefer small, focused modules and preserve the current separation between validation, parsing, and rendering. Use `camelCase` for functions and variables, `kebab-case` for JSON example filenames such as `hello-world.json`, and keep presentation schema fields aligned with existing names like `speakerNotes`, `customTheme`, and `slideNumbers`.

## Testing Guidelines
There is no dedicated `test/` directory yet, but `npm test` is already wired up. Add new tests as `*.test.js` files near the module they cover or under a new top-level `test/` folder. Prioritize coverage for schema validation, parsing edge cases, and renderer output for new element types or layouts. When changing the schema or examples, run both `npm test` and `npm run validate -- <file>`.

## Commit & Pull Request Guidelines
Recent history favors short, imperative commit subjects such as `Add speaker notes plugin and keyboard shortcuts help`; occasional typed prefixes like `fix:` are also acceptable. Keep commits focused and easy to scan. Pull requests should explain the user-visible change, note any schema updates, link related issues, and include screenshots or a sample presentation path for UI or rendering changes.
