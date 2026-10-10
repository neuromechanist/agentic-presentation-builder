# Getting Started

## Requirements

- Bun 1.4.3 for package management and the zero-clone CLI
- Node.js 20+ for the Node-backed package scripts and CLI
- `uv` for docs work

## Install and run

```bash
bun install
bun run dev
```

The Vite app runs on `http://localhost:3000`.

## Run as a CLI (no clone)

The engine exposes an `apb` command, so you can validate, present, and export decks straight
from the repository with `bunx`, without cloning or a registry publish. Pin to a release tag
for reproducibility:

```bash
bunx github:neuromechanist/agentic-presentation-builder#v0.1.6 validate deck.json --json
bunx github:neuromechanist/agentic-presentation-builder#v0.1.6 present deck.json --open
bunx github:neuromechanist/agentic-presentation-builder#v0.1.6 export deck.json --format pdf
```

`apb <command> --help` prints each command's options. The `validate`, `present`, and
`export` subcommands are the same code paths as the `bun run` scripts below. For
repeated authoring, clone once (`bun install`) and use the scripts directly to
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
bun run present -- ~/slides/demo.json
```

Repo-hosted deck from `public/`:

```text
http://localhost:3000/?presentation=./public/my-deck.json
```

## Validate before opening

```bash
bun run validate -- examples/image-demo.json
bun run validate -- examples/image-demo.json --json
```

Use `--json` when an agent or script needs structured output.

## Build production output

```bash
bun run build
bun run preview
```

## Build the docs site

```bash
bun run docs:serve
bun run docs:build
```

Both commands use `uvx` and MkDocs Material. The generated site is written to `site/`.

## Docs theme

The documentation site includes:

- light mode
- dark mode
- a system-following mode via the palette toggle in the header
