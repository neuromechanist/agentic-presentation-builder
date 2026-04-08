# Development

## Project structure

```text
src/
  parser/       JSON normalization
  renderer/     HTML generation
  validator/    schema validation and advisory warnings
  utils/        markdown, theme, and helper logic
  app.js        browser runtime, audit, and delivery modes
  index.js      Node-facing entry point
examples/       sample decks and assets
schema/         JSON schema contract
scripts/        CLI validation utilities
docs/           MkDocs Material site
```

## Core commands

```bash
npm install
npm run dev
npm run build
npm test
npm run validate -- examples/hello-world.json --json
npm run validate:examples
npm run docs:serve
npm run docs:build
```

## CI

Current GitHub Actions cover:

- Node validation, tests, example validation, and production build
- typo checking
- docs site build with MkDocs Material

## Documentation maintenance

When behavior changes, update the docs in the same pull request if it affects:

- JSON schema or authoring rules
- validation codes or suggestions
- agent-facing browser globals
- presentation, presenter, or audience behavior
- keyboard shortcuts or settings UI
