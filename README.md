# Agentic Presentation Builder

LLM-friendly JSON-based presentation engine that renders beautiful, interactive presentations using Reveal.js.

## Vision

Enable AI agents and LLMs to create professional presentations by generating simple JSON files. The engine handles all the complexity of rendering, styling, animations, and interactivity.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:3000
```

View example presentations:
- `http://localhost:3000/?presentation=./examples/hello-world.json`
- `http://localhost:3000/?presentation=./examples/advanced-features-demo.json`

## Features

### Content Elements

**Text & Formatting**
- ✅ Markdown support for rich text formatting
- ✅ Multiple font sizes (small, medium, large, xl, xxl)
- ✅ Text alignment (left, center, right, justify)
- ✅ Custom colors and font weights
- ✅ Headings, bold, italic, links, blockquotes

**Lists**
- ✅ Bullet points (disc, circle, square, none)
- ✅ Numbered lists
- ✅ Nested lists with multiple levels
- ✅ Markdown formatting within list items

**Images**
- ✅ Local and remote images
- ✅ Custom width and height
- ✅ Image captions with markdown support
- ✅ Alt text for accessibility

**Diagrams**
- ✅ Mermaid.js integration
- ✅ Flowcharts, sequence diagrams, Gantt charts
- ✅ Git graphs and state diagrams
- ✅ Customizable themes

**Callout Boxes**
- ✅ Five types: tip, warning, important, note, info
- ✅ Optional titles
- ✅ Markdown content support
- ✅ Distinct color schemes

**Code Blocks**
- ✅ Syntax highlighting for 9+ languages
  - JavaScript, TypeScript, Python
  - Java, Go, Rust
  - HTML, CSS, JSON
- ✅ Optional line numbers
- ✅ Code captions
- ✅ Prism.js powered highlighting

**Tables**
- ✅ Headers and data rows
- ✅ Optional captions
- ✅ Zebra striping
- ✅ Hover effects
- ✅ Responsive overflow handling

### Layout System

**Layout Types**
- ✅ **Single-column**: Standard vertical layout
- ✅ **Two-column**: Side-by-side content
- ✅ **Title**: Centered content for title slides
- ✅ **Blank**: Custom positioning

**Positioning Areas**
- ✅ Header, Content, Footer
- ✅ Left, Right (for two-column)
- ✅ Center (for title slides)
- ✅ Element ordering within areas

### Animations

**Element Animations**
- ✅ Fragment-based progressive reveal
- ✅ Animation types: fade, slide-up, slide-down, zoom
- ✅ Custom animation order with indices
- ✅ Per-element animation control

**Slide Transitions**
- ✅ Five transition styles: slide, fade, convex, concave, zoom
- ✅ Per-slide transition overrides
- ✅ Smooth, hardware-accelerated animations

### Presentation Controls

**Navigation**
- ✅ Keyboard navigation (arrows, space)
- ✅ Touch/swipe support
- ✅ Overview mode (press Escape)
- ✅ Slide numbers (current/total format)
- ✅ Progress bar

**Overview Mode**
- ✅ Grid view of all slides
- ✅ Vertical scrolling support
- ✅ Slide titles displayed underneath
- ✅ Click to navigate to any slide
- ✅ Hover effects with scaling

**Presenter Features**
- ✅ Speaker notes (press 's' to view)
- ✅ Notes hidden from audience
- ✅ Per-slide notes support
- ✅ Configurable notes display

### Theming

**Built-in Themes**
- ✅ Default, Light, Dark, Academic, Minimal

**Custom Themes**
- ✅ Custom color palettes (primary, background, text, accent)
- ✅ Custom fonts (heading and body)
- ✅ CSS variable system
- ✅ Per-presentation theme overrides

**Styling**
- ✅ Responsive design (16:9 and 4:3 aspect ratios)
- ✅ Print-friendly styles
- ✅ High-DPI display support

## Usage

### 1. Create a JSON Presentation

```json
{
  "presentation": {
    "metadata": {
      "title": "My Presentation",
      "author": "Your Name",
      "description": "A brief description",
      "theme": "default",
      "aspectRatio": "16:9",
      "controls": {
        "slideNumbers": true,
        "progress": true,
        "showNotes": false
      }
    },
    "slides": [
      {
        "id": "intro",
        "title": "Introduction",
        "layout": "title",
        "elements": [
          {
            "type": "text",
            "content": "# Welcome",
            "style": {
              "fontSize": "xxl",
              "alignment": "center"
            },
            "position": {
              "area": "center"
            }
          }
        ]
      },
      {
        "id": "content",
        "title": "Main Content",
        "layout": "single-column",
        "speakerNotes": "Remember to pause here for questions",
        "elements": [
          {
            "type": "text",
            "content": "## Key Points",
            "position": {
              "area": "header"
            }
          },
          {
            "type": "bullets",
            "items": [
              "First point",
              "Second point",
              "Third point"
            ],
            "position": {
              "area": "content"
            },
            "animation": {
              "fragment": true,
              "type": "fade"
            }
          }
        ]
      }
    ]
  }
}
```

### 2. View Your Presentation

Place your JSON file in `examples/` and open:
```
http://localhost:3000/?presentation=./examples/your-file.json
```

### 3. Navigate

- **Arrow keys**: Navigate between slides
- **Space**: Next slide
- **Escape**: Toggle overview mode
- **S**: Show speaker notes
- **F**: Fullscreen mode

## Examples

The `examples/` directory contains several demonstration presentations:

- **hello-world.json**: Minimal example showing basic structure
- **advanced-features-demo.json**: Comprehensive showcase of all features including code blocks, tables, animations, and speaker notes

## Schema Documentation

### Complete Element Type Reference

#### Text Element
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

#### Bullets Element
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
  "style": {
    "fontSize": "medium"
  },
  "animation": {
    "fragment": true,
    "type": "slide-up",
    "index": 1
  }
}
```

#### Image Element
```json
{
  "type": "image",
  "src": "./images/diagram.png",
  "alt": "System architecture diagram",
  "width": "50%",
  "height": "auto",
  "caption": "**Figure 1:** System Architecture",
  "position": {
    "area": "content"
  },
  "animation": {
    "fragment": true,
    "type": "zoom"
  }
}
```

#### Mermaid Diagram Element
```json
{
  "type": "mermaid",
  "diagram": "graph TD\n  A[Start] --> B[Process]\n  B --> C[End]",
  "theme": "default",
  "position": {
    "area": "content"
  }
}
```

#### Callout Element
```json
{
  "type": "callout",
  "calloutType": "tip",
  "title": "Pro Tip",
  "content": "Use **keyboard shortcuts** for faster navigation",
  "position": {
    "area": "content"
  },
  "animation": {
    "fragment": true,
    "type": "fade"
  }
}
```
**Callout Types:** `tip` (green), `warning` (yellow), `important` (red), `note` (blue), `info` (gray)

#### Code Element
```json
{
  "type": "code",
  "code": "function hello() {\n  console.log('Hello, World!');\n}",
  "language": "javascript",
  "caption": "example.js",
  "lineNumbers": true,
  "position": {
    "area": "content"
  }
}
```
**Supported Languages:** javascript, typescript, python, java, go, rust, html, css, json

#### Table Element
```json
{
  "type": "table",
  "headers": ["Name", "Age", "City"],
  "rows": [
    ["Alice", "30", "NYC"],
    ["Bob", "25", "LA"]
  ],
  "caption": "**Table 1:** User Data",
  "position": {
    "area": "content"
  }
}
```

### Slide Configuration

#### Slide Properties
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

**Layout Types:**
- `single-column`: Standard vertical layout
- `two-column`: Side-by-side with left/right areas
- `title`: Centered content for title slides
- `blank`: Custom positioning

**Transitions:** `slide`, `fade`, `convex`, `concave`, `zoom`

### Presentation Metadata

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

### Animation System

**Progressive Reveal with Fragments:**
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
- `fade`: Fade in
- `slide-up`: Slide up from bottom
- `slide-down`: Slide down from top
- `zoom`: Zoom in
- `none`: No animation

**Fragment Order:**
- Elements with `fragment: false` appear immediately
- Elements with `fragment: true` appear on click/space
- `index` controls the order (0, 1, 2, ...)
- Multiple elements can share the same index (appear together)

## Validation Guide

### Using the Built-in Validator

The project includes an Ajv-based validator that checks your JSON against the schema:

```javascript
import { validatePresentation, getValidationReport } from './src/validator/index.js';

const presentation = { /* your JSON */ };

// Get validation result
const result = validatePresentation(presentation);
if (result.valid) {
  console.log('Valid presentation!');
} else {
  console.error('Validation errors:', result.errors);
}

// Get human-readable report
const report = getValidationReport(presentation);
console.log(report);
```

### Common Validation Errors

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

### Validation Checklist

Before using a presentation JSON:

1. **Required Fields:**
   - ✅ `presentation.metadata.title` exists
   - ✅ `presentation.slides` array has at least 1 slide
   - ✅ Each slide has `elements` array (can be empty)
   - ✅ Each element has `type` and required fields for that type

2. **Valid Values:**
   - ✅ Theme is one of: default, light, dark, academic, minimal
   - ✅ Layout is one of: single-column, two-column, title, blank
   - ✅ Transition is one of: slide, fade, convex, concave, zoom
   - ✅ Colors use hex format: #RRGGBB or #RGB
   - ✅ Font sizes use: small, medium, large, xl, xxl

3. **Element-Specific:**
   - ✅ Text/Bullets: `content`/`items` not empty
   - ✅ Image: `src` is valid path/URL
   - ✅ Code: `code` not empty, `language` is supported
   - ✅ Table: `headers` and `rows` arrays not empty
   - ✅ Mermaid: `diagram` contains valid Mermaid syntax

4. **Animation:**
   - ✅ Fragment indices are integers ≥ 0
   - ✅ Animation type is: fade, slide-up, slide-down, zoom, or none
   - ✅ Elements in same slide don't have duplicate fragment indices (unless intentional)

### Command-Line Validation

```bash
# Validate a presentation file
npm run validate-schema

# Or validate specific file (if custom script added)
node scripts/validate.js examples/your-presentation.json
```

### Online Schema Reference

Complete schema with all validation rules:
- **File**: `schema/presentation.schema.json`
- **$schema**: JSON Schema Draft-07
- **Validation**: Ajv with all errors enabled

## Project Structure

```
agent-presentation/
├── src/
│   ├── parser/           # JSON to structured data
│   ├── renderer/         # Structured data to HTML
│   ├── theme/           # Theme system
│   ├── utils/           # Markdown, validation
│   ├── app.js           # Client-side application
│   ├── index-browser.js # Browser entry point
│   └── styles.css       # Custom styles
├── examples/            # Example JSON presentations
├── schema/              # JSON schema definition
├── public/              # Static assets
├── index.html          # HTML template
└── package.json        # Dependencies
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with touch support

## Technologies

- **Reveal.js**: Presentation framework
- **Mermaid.js**: Diagram rendering
- **Prism.js**: Syntax highlighting
- **Marked.js**: Markdown parsing
- **Ajv**: JSON schema validation
- **Vite**: Build tool and dev server

## Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Validate schema
npm run validate-schema
```

## Contributing

This project follows atomic commit practices:
- Each commit should be a single logical change
- Write clear, descriptive commit messages
- Test changes before committing
- See `.rules/git.md` for detailed guidelines

## License

Copyright (c) 2025 Casual-Vibers. All Rights Reserved.

This is proprietary software. See LICENSE file for details.
