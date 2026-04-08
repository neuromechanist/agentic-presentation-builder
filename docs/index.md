# Agentic Presentation Builder

Agentic Presentation Builder is a JSON-first presentation system that renders interactive decks with Reveal.js. It is designed for two audiences:

- human authors who want predictable presentation behavior from structured JSON
- AI agents that need machine-readable validation, warnings, and rendered audit feedback

## What it does

- renders JSON decks into presentation-ready slides
- supports text, bullets, images, Mermaid, callouts, code blocks, and tables
- validates decks against a JSON Schema and emits non-fatal author warnings
- exposes browser-side audit data for fit scoring, overflow detection, and recommendations
- provides authoring, presentation, presenter, and audience delivery modes

## Core workflow

1. Author or generate a deck in JSON.
2. Run validation before opening the deck.
3. Review browser audit results at presentation size.
4. Present with notes, audience screen sync, or a clean deck mode.

## Fast start

```bash
npm install
npm run dev
npm run validate -- examples/hello-world.json --json
```

Open:

```text
http://localhost:3000/?presentation=./examples/hello-world.json
```

## Documentation map

- [Getting Started](getting-started.md): install, run, build, and preview a deck
- [JSON Authoring](json-authoring.md): deck structure, element types, and authoring rules
- [Agent Workflow](agent-workflow.md): CLI validation, browser audit, and automation hooks
- [Presenting](presenting.md): modes, notes, audience screen, and shortcuts
- [Schema Reference](schema-reference.md): field-level reference for the JSON contract
- [Examples And Themes](examples-and-themes.md): shipped demos and theme usage
- [Development](development.md): repo layout, commands, CI, and docs maintenance
