# Agentic Presentation Builder

LLM-friendly JSON-based presentation engine that renders beautiful, interactive presentations using Reveal.js.

## Vision

Enable AI agents and LLMs to create professional presentations by generating simple JSON files. The engine handles all the complexity of rendering, styling, animations, and interactivity.

## Quick Start

```bash
npm install
npm run dev
# Open http://localhost:3000/?presentation=./examples/hello-world.json

# For your own files use the public directory or a local server
# e.g. http://localhost:3000/?presentation=./public/my-presentation.json

```

## Documentation

This repository now ships a full MkDocs Material documentation site under [`docs/`](docs/).

```bash
# Preview the docs locally with uv
npm run docs:serve

# Build the docs site
npm run docs:build
```

Key pages:

- `docs/index.md` for the product overview
- `docs/getting-started.md` for first-run setup
- `docs/json-authoring.md` for the JSON contract and authoring patterns
- `docs/agent-workflow.md` for validation, warnings, audit, and browser automation
- `docs/presenting.md` for presentation, presenter, and audience modes
- `docs/schema-reference.md` for field-level reference

## Agent Workflow

Use the repository in two passes when an agent is iterating on a deck:

```bash
npm run validate -- examples/image-demo.json --json
```

This returns machine-readable schema errors and author warnings with `code`, `path`, `message`, and `suggestion`.

Then open the deck in a browser and read:

- `window.__presentationValidation` for the same validation payload available from the CLI
- `window.__presentationAudit` for rendered slide-fit findings
- `window.__presentationAgentReport` for both in one object

The browser audit contains per-slide `fitScore`, `fitSeverity`, `layoutFindings`, `authorWarnings`, and recommendations based on the actual rendered layout at presentation size.

## Features Overview

**7 Element Types:** [Text](#text-element) • [Bullets](#bullets-element) • [Images](#image-element) • [Mermaid Diagrams](#mermaid-diagram-element) • [Callouts](#callout-element) • [Code Blocks](#code-element) • [Tables](#table-element)

**Layouts:** [4 layout types](#slide-configuration) (single-column, two-column, title, blank) with flexible positioning

**Animations:** [Progressive reveal system](#animation-system) with 5 animation types + fragment ordering

**Transitions:** [5 slide transitions](#slide-configuration) (slide, fade, convex, concave, zoom)

**Themes:** [5 built-in + custom](#presentation-metadata) themes with colors and fonts

**Navigation:** Keyboard, touch, [overview mode](#navigation) (Escape), speaker notes (S)

## Minimal Example

Single slide presentation:

```json
{
  "presentation": {
    "metadata": {
      "title": "Hello World",
      "theme": "default"
    },
    "slides": [
      {
        "title": "Welcome",
        "layout": "title",
        "elements": [
          {
            "type": "text",
            "content": "# Hello World\nWelcome to Agentic Presentation Builder",
            "style": { "fontSize": "xxl", "alignment": "center" },
            "position": { "area": "center" }
          }
        ]
      }
    ]
  }
}
```

View: `http://localhost:3000/?presentation=./examples/your-file.json`

## Navigation

- **Arrow keys** / **Space**: Navigate slides
- **Escape**: Toggle overview mode (grid view with slide titles)
- **S**: Show speaker notes
- **F**: Fullscreen

## Examples

- `examples/hello-world.json` - Minimal structure
- `examples/advanced-features-demo.json` - All features showcase

---

# Complete Schema Documentation

## Element Types Reference

### Text Element
```json
{
  "type": "text",
  "content": "# Heading\nThis is **bold** and *italic* text",
  "style": {
    "fontSize": "large",
    "alignment": "center",
    "color": "#1E293B",
    "fontWeight": "bold"
  },
  "position": {
    "area": "header",
    "order": 0
  },
  "animation": {
    "fragment": true,
    "type": "fade",
    "index": 0
  }
}
```
**Font Sizes:** `small`, `medium`, `large`, `xl`, `xxl`
**Alignment:** `left`, `center`, `right`, `justify`
**Font Weight:** `normal`, `bold`, `light`

### Bullets Element
```json
{
  "type": "bullets",
  "items": [
    "Simple bullet point",
    {
      "text": "Parent item",
      "children": ["Nested item 1", "Nested item 2"]
    }
  ],
  "bulletStyle": "disc",
  "style": { "fontSize": "medium" },
  "animation": {
    "fragment": true,
    "type": "slide-up",
    "index": 1
  }
}
```
**Bullet Styles:** `disc`, `circle`, `square`, `number`, `none`

### Image Element
```json
{
  "type": "image",
  "src": "./images/diagram.png",
  "alt": "System architecture diagram",
  "width": "50%",
  "height": "auto",
  "caption": "**Figure 1:** System Architecture",
  "position": { "area": "content" },
  "animation": { "fragment": true, "type": "zoom" }
}
```
**Width/Height:** Percentage (`50%`), pixels (`400px`), or `auto`

### Mermaid Diagram Element
```json
{
  "type": "mermaid",
  "diagram": "graph TD\n  A[Start] --> B[Process]\n  B --> C[End]",
  "theme": "default",
  "position": { "area": "content" }
}
```
**Themes:** `default`, `dark`, `forest`, `neutral`
**Diagram Types:** flowcharts, sequence, Gantt, git graphs, state diagrams

### Callout Element
```json
{
  "type": "callout",
  "calloutType": "tip",
  "title": "Pro Tip",
  "content": "Use **keyboard shortcuts** for faster navigation",
  "position": { "area": "content" },
  "animation": { "fragment": true, "type": "fade" }
}
```
**Types:** `tip` (green), `warning` (yellow), `important` (red), `note` (blue), `info` (gray)

### Code Element
```json
{
  "type": "code",
  "code": "function hello() {\n  console.log('Hello, World!');\n}",
  "language": "javascript",
  "caption": "example.js",
  "lineNumbers": true,
  "position": { "area": "content" }
}
```
**Languages:** `javascript`, `typescript`, `python`, `java`, `go`, `rust`, `html`, `css`, `json`

### Table Element
```json
{
  "type": "table",
  "headers": ["Name", "Age", "City"],
  "rows": [
    ["Alice", "30", "NYC"],
    ["Bob", "25", "LA"]
  ],
  "caption": "**Table 1:** User Data",
  "position": { "area": "content" }
}
```

## Slide Configuration

### Slide Properties
```json
{
  "id": "unique-slide-id",
  "title": "Slide Title (shown in overview)",
  "layout": "single-column",
  "background": "#F8FAFC",
  "transition": "fade",
  "speakerNotes": "Remember to emphasize key points",
  "elements": [...]
}
```

**Layouts:**
- `single-column` - Standard vertical layout
- `two-column` - Side-by-side with left/right areas
- `title` - Centered content for title slides
- `blank` - Custom positioning

**Transitions:** `slide`, `fade`, `convex`, `concave`, `zoom`

**Position Areas:**
- `header`, `content`, `footer` (all layouts)
- `left`, `right` (two-column only)
- `center` (title layout)

## Presentation Metadata

```json
{
  "presentation": {
    "metadata": {
      "title": "Presentation Title",
      "author": "Author Name",
      "description": "Brief description",
      "theme": "default",
      "aspectRatio": "16:9",
      "controls": {
        "slideNumbers": true,
        "progress": true,
        "showNotes": false
      },
      "customTheme": {
        "colors": {
          "primary": "#2563EB",
          "background": "#FFFFFF",
          "text": "#1E293B",
          "accent": "#10B981"
        },
        "fonts": {
          "heading": "Inter, sans-serif",
          "body": "Inter, sans-serif"
        }
      }
    },
    "slides": [...]
  }
}
```

**Built-in Themes:** `default`, `light`, `dark`, `academic`, `minimal`
**Aspect Ratios:** `16:9`, `4:3`

## Animation System

### Progressive Reveal with Fragments
```json
{
  "elements": [
    {
      "type": "text",
      "content": "First (appears immediately)",
      "animation": { "fragment": false }
    },
    {
      "type": "bullets",
      "items": ["Second (appears on click)"],
      "animation": {
        "fragment": true,
        "type": "fade",
        "index": 0
      }
    },
    {
      "type": "text",
      "content": "Third (appears after bullets)",
      "animation": {
        "fragment": true,
        "type": "slide-up",
        "index": 1
      }
    }
  ]
}
```

**Animation Types:**
- `fade` - Fade in
- `slide-up` - Slide up from bottom
- `slide-down` - Slide down from top
- `zoom` - Zoom in
- `none` - No animation

**Fragment Rules:**
- `fragment: false` → appears immediately
- `fragment: true` → appears on click/space
- `index` controls order (0, 1, 2, ...)
- Multiple elements can share same index (appear together)

---

# Validation Guide

## Command-Line Validation

```bash
# Validate a specific file
node scripts/validate.js examples/your-presentation.json

# Or use npm command
npm run validate examples/your-presentation.json
```

## Common Validation Errors

**Missing Required Fields:**
```
Error: Missing required field: title
Fix: Add "title" to metadata
```

**Invalid Enum Value:**
```
Error: Invalid value. Must be one of: fade, slide, convex, concave, zoom
Fix: Use one of the allowed transition types
```

**Type Mismatch:**
```
Error: Expected boolean but got string
Fix: Change "slideNumbers": "true" to "slideNumbers": true
```

**Invalid Color Format:**
```
Error: Value does not match required format (e.g., hex color: #FFFFFF)
Fix: Use proper hex format: "#1E293B" not "blue"
```

## Validation Checklist

**Required Fields:**
- ✅ `presentation.metadata.title` exists
- ✅ `presentation.slides` array has ≥ 1 slide
- ✅ Each slide has `elements` array
- ✅ Each element has `type` and required fields

**Valid Values:**
- ✅ Theme: `default`, `light`, `dark`, `academic`, `minimal`
- ✅ Layout: `single-column`, `two-column`, `title`, `blank`
- ✅ Transition: `slide`, `fade`, `convex`, `concave`, `zoom`
- ✅ Colors: hex format `#RRGGBB` or `#RGB`
- ✅ Font sizes: `small`, `medium`, `large`, `xl`, `xxl`

**Element-Specific:**
- ✅ Text/Bullets: `content`/`items` not empty
- ✅ Image: `src` is valid path/URL
- ✅ Code: `code` not empty, `language` supported
- ✅ Table: `headers` and `rows` not empty
- ✅ Mermaid: `diagram` has valid syntax

**Animation:**
- ✅ Fragment indices are integers ≥ 0
- ✅ Animation type is valid

## Programmatic Validation

```javascript
import { validatePresentation, getValidationReport } from './src/validator/index.js';

const presentation = { /* your JSON */ };

// Get validation result
const result = validatePresentation(presentation);
if (result.valid) {
  console.log('Valid!');
} else {
  console.error('Errors:', result.errors);
}

// Get human-readable report
console.log(getValidationReport(presentation));
```

**Schema Location:** `schema/presentation.schema.json` (JSON Schema Draft-07 with Ajv validation)

---

# Development

## Commands

```bash
npm install        # Install dependencies
npm run dev        # Start dev server (http://localhost:3000)
npm run build      # Build for production
npm test           # Run tests
npm run validate   # Validate presentation file
```

## Project Structure

```
agent-presentation/
├── src/
│   ├── parser/           # JSON to structured data
│   ├── renderer/         # Structured data to HTML
│   ├── validator/        # JSON schema validation
│   ├── utils/            # Markdown, theme utilities
│   ├── app.js            # Client-side application
│   └── styles.css        # Custom styles
├── examples/             # Example presentations
├── schema/               # JSON schema definition
├── scripts/              # Validation scripts
└── index.html            # HTML template
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with touch support

## Technologies

- **Reveal.js** - Presentation framework
- **Mermaid.js** - Diagram rendering
- **Prism.js** - Syntax highlighting
- **Marked.js** - Markdown parsing
- **Ajv** - JSON schema validation
- **Vite** - Build tool and dev server

## Contributing

This project follows atomic commit practices:
- Each commit = single logical change
- Clear, descriptive commit messages
- Test changes before committing
- See `.rules/git.md` for guidelines

## License

This project is licensed under the BSD 3-Clause License. See `LICENSE` for the full text.
