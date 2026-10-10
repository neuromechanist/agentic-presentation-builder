# Repository Guidelines

## Project Structure & Module Organization
`src/` contains the presentation engine. Use `src/parser/` for JSON normalization, `src/validator/` for schema checks, `src/renderer/` for HTML generation, and `src/utils/` for shared helpers such as theme and markdown handling. `src/app.js` boots the browser app, while `src/index.js` exposes the Node-facing entry point. Keep sample decks in `examples/`, shared sample media in `examples/assets/`, and the JSON contract in `schema/presentation.schema.json`. Root files like `index.html` and `vite.config.js` drive the Vite app; `scripts/validate.js` is the CLI validator.

## Build, Test, and Development Commands
Run `bun install` once to install dependencies. Use `bun run dev` to start the local Vite server on port `3000`, `bun run build` to create a production bundle in `dist/`, and `bun run preview` to inspect that build locally. Run `bun run validate -- examples/hello-world.json` to check a presentation against the JSON schema before committing changes. `bun run test` runs Node's built-in test runner, `bun run lint` checks `src/` with ESLint, and `bun run format` applies Prettier to JS, JSON, CSS, and HTML sources.

The repo also exposes an `apb` CLI (the `bin` entry in `package.json`, dispatcher at `bin/apb.js`) so it can run via `bunx github:neuromechanist/agentic-presentation-builder#<tag> <command>` without publishing to a package registry. The subcommands `validate`, `present`, and `export` reuse the same `main()` exported from `scripts/{validate,present,export}.js` as the matching `bun run` scripts, so behaviour stays identical between the two invocation styles. `vite` is a runtime dependency (not a devDependency) because `present` needs it after a production-only `bunx` install.

## Coding Style & Naming Conventions
This codebase uses ES modules, 2-space indentation, semicolons, and single quotes in JavaScript. Prefer small, focused modules and preserve the current separation between validation, parsing, and rendering. Use `camelCase` for functions and variables, `kebab-case` for JSON example filenames such as `hello-world.json`, and keep presentation schema fields aligned with existing names like `speakerNotes`, `customTheme`, and `slideNumbers`.

## Testing Guidelines
Tests live in `test/`, and `bun run test` invokes Node's built-in test runner. Add new tests as `*.test.js` files near the module they cover or in `test/`. Prioritize coverage for schema validation, parsing edge cases, and renderer output for new element types or layouts. When changing the schema or examples, run both `bun run test` and `bun run validate -- <file>`.

## Commit & Pull Request Guidelines
Recent history favors short, imperative commit subjects such as `Add speaker notes plugin and keyboard shortcuts help`; occasional typed prefixes like `fix:` are also acceptable. Keep commits focused and easy to scan. Pull requests should explain the user-visible change, note any schema updates, link related issues, and include screenshots or a sample presentation path for UI or rendering changes.

## Releases & Citation
The repository is archived to Zenodo on every GitHub release, which mints a versioned DOI under a stable concept DOI. When you bump the version in `package.json` for a release, also bump `version` (and `date-released`) in `CITATION.cff` and keep `.zenodo.json` metadata in sync, then create the matching `vX.Y.Z` tag and GitHub release. The concept DOI, once minted by the first Zenodo deposit, lives in `CITATION.cff` (`doi:`) and the README badge and does not change across versions.
