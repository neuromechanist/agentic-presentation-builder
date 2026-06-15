# Getting Started

## Requirements

- Node.js 20+
- npm, or Bun (`bunx`) for the zero-clone CLI below
- `uv` for docs work

## Install and run

```bash
npm install
npm run dev
```

The Vite app runs on `http://localhost:3000`.

## Run as a CLI (no clone)

The engine exposes an `apb` command, so you can validate, present, and export decks straight
from the repository with `bunx`/`npx`, without cloning or an npm publish. Pin to a release tag
for reproducibility:

```bash
bunx github:neuromechanist/agentic-presentation-builder#v0.1.6 validate deck.json --json
bunx github:neuromechanist/agentic-presentation-builder#v0.1.6 present deck.json --open
bunx github:neuromechanist/agentic-presentation-builder#v0.1.6 export deck.json --format pdf
```

`npx github:neuromechanist/agentic-presentation-builder#v0.1.6 <command>` works the same way,
and `apb <command> --help` prints each command's options. The `validate`, `present`, and
`export` subcommands are the same code paths as the `npm run` / `bun run` scripts below. For
repeated authoring, clone once (`npm install` or `bun install`) and use the scripts directly to
avoid re-resolving the git package on each call.

## Open a deck from your computer

Open `http://localhost:3000` and use the local deck loader.

Choose the folder that contains:

- your presentation JSON
- any relative images or background assets used by that JSON

If the selected folder contains multiple JSON files, the app will let you choose which one to open.

## Open a URL-backed deck

Built-in example:

```text
http://localhost:3000/?presentation=./examples/hello-world.json
```

CLI-backed local file:

```bash
npm run present -- ~/slides/demo.json
```

Repo-hosted deck from `public/`:

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
