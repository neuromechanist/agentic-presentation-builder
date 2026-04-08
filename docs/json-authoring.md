# JSON Authoring

## Top-level shape

Every deck starts with a `presentation` object containing `metadata` and `slides`.

```json
{
  "presentation": {
    "metadata": {
      "title": "Quarterly Review",
      "theme": "default"
    },
    "slides": []
  }
}
```

## Metadata

Common metadata fields:

- `title`: required deck title
- `author`, `description`: optional descriptive metadata
- `theme`: `default`, `light`, `dark`, `academic`, `minimal`
- `aspectRatio`: `16:9` or `4:3`
- `controls.slideNumbers`, `controls.progress`, `controls.showNotes`
- `customTheme.colors` and `customTheme.fonts`

## Slides

Each slide can define:

- `id`: stable identifier for deep links and audit output
- `title`: overview title
- `layout`: `single-column`, `two-column`, `title`, or `blank`
- `background`: hex color or image path
- `transition`: `slide`, `fade`, `convex`, `concave`, or `zoom`
- `speakerNotes`: presenter notes
- `elements`: slide content

## Element types

- `text`: Markdown-rich prose and headings
- `bullets`: flat or nested lists
- `image`: image with `src`, `alt`, optional `caption`, `width`, and `height`
- `mermaid`: inline Mermaid diagrams
- `callout`: highlighted content blocks
- `code`: syntax-highlighted code blocks
- `table`: structured tabular data

## Authoring guidance

- Prefer percentage image widths such as `55%` on shared media slides.
- Keep `alt` text on every image.
- Use `speakerNotes` for delivery notes instead of embedding presenter-only copy in slide text.
- Keep fragment counts low. Heavy reveal sequences are flagged by advisory warnings.

## Markdown support

`text`, `bullets`, `callout`, `caption`, and similar content fields support Markdown. The renderer also supports:

- fenced code blocks
- inline code
- GitHub-style alerts such as `> [!TIP]`
- inline and display LaTeX math

## Example

```json
{
  "id": "architecture",
  "title": "Architecture Overview",
  "layout": "two-column",
  "speakerNotes": "Walk the audience left to right.",
  "elements": [
    {
      "type": "bullets",
      "items": ["Parser", "Validator", "Renderer", "Browser audit"],
      "position": { "area": "left" }
    },
    {
      "type": "mermaid",
      "diagram": "graph TD\n  A[JSON] --> B[Validate]\n  B --> C[Render]",
      "position": { "area": "right" }
    }
  ]
}
```
