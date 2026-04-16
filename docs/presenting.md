# Presenting

## Modes

The runtime supports four practical delivery states:

- `authoring`: diagnostics and fit overlays available
- `presentation`: clean deck mode
- `presenter`: dedicated presenter window with a live synced preview and speaker notes
- `audience`: synced external screen with authoring chrome removed

## Settings panel

The `Settings` button controls:

- authoring vs presentation mode
- warning and fit-overlay visibility
- presenter view launch
- audience screen launch
- keyboard shortcuts help

## Presenter notes

Use `speakerNotes` on each slide. In the browser:

- press `S` to open the presenter view
- or use `Settings` -> `Open Presenter View`

Presenter notes support Markdown, including paragraphs, bullet lists, and nested lists.

## Audience screen

The audience screen opens a second clean window and syncs slide state over `BroadcastChannel`.

The audience URL uses:

```text
?role=audience&mode=presentation
```

In audience mode:

- authoring chrome is hidden
- warnings are hidden
- presentation mode is forced on

## Exporting

Use the export CLI when you need a file for distribution or a conference handoff:

```bash
npm run export -- ~/slides/demo.json
npm run export -- ~/slides/demo.json --format pptx
npm run export -- ~/slides/demo.json --format pptx --pptx-mode=image
```

- `pdf` is the default export and uses the browser renderer, so Mermaid, KaTeX, code highlighting, and theme styling stay aligned with the live deck
- `pptx` uses **native mode** by default: slides become real editable PowerPoint objects (text runs, bullet lists, images, callout shapes, code blocks, tables) with speaker notes preserved. Font sizes scale proportionally to available space. Mermaid diagrams are rendered to PNG via headless Chrome and embedded as images
- `--pptx-mode=image` switches to the legacy screenshot mode where each slide is a full-slide PNG, useful when pixel-perfect fidelity to the browser render is more important than editability
- `--output <path>` overrides the default destination next to the source JSON file
- `--chrome-path <path>` points the exporter at a non-standard Chrome or Edge binary

Native PPTX limitations:

- Fragment animations are not yet mapped to PowerPoint entrance effects
- Mermaid diagrams need a Chrome binary; without one they fall back to source code placeholders
- Custom theme fonts are not embedded

There is no native ODP writer yet. If you need OpenDocument Presentation output, export to `pptx` first and convert that file in LibreOffice.

## Keyboard shortcuts

- `,`: open settings
- `P`: toggle presentation mode
- `S`: open presenter view
- `O`: overview
- `F`: fullscreen
- `?`: keyboard shortcuts help
- `Esc`: close overlays or exit Reveal overview/pause states

## Query parameters

Useful runtime query parameters:

- `presentation=...`: JSON deck path
- `mode=presentation` or `mode=authoring`
- `role=audience` or `role=presenter`
- `warnings=visible` or `warnings=hidden`
