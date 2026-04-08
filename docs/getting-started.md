# Getting Started

## Requirements

- Node.js 20+
- npm
- `uv` for docs work

## Install and run

```bash
npm install
npm run dev
```

The Vite app runs on `http://localhost:3000`.

## Open a deck

Built-in example:

```text
http://localhost:3000/?presentation=./examples/hello-world.json
```

Local deck from `public/`:

```text
http://localhost:3000/?presentation=./public/my-deck.json
```

## Validate before opening

```bash
npm run validate -- examples/image-demo.json
npm run validate -- examples/image-demo.json --json
```

Use `--json` when an agent or script needs structured output.

## Build production output

```bash
npm run build
npm run preview
```

## Build the docs site

```bash
npm run docs:serve
npm run docs:build
```

Both commands use `uvx` and MkDocs Material. The generated site is written to `site/`.

## Docs theme

The documentation site includes:

- light mode
- dark mode
- a system-following mode via the palette toggle in the header
