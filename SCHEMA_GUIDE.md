# Agentic Presentation Builder - Schema Guide

**Version:** 1.0
**Audience:** LLMs and AI Agents creating presentations

## Overview

This guide explains how to create presentations using the Agentic Presentation Builder JSON schema. The format is designed to be intuitive for AI agents while remaining human-readable.

## Quick Start

Minimum valid presentation:

```json
{
  "presentation": {
    "metadata": {
      "title": "My Presentation"
    },
    "slides": [
      {
        "elements": [
          {
            "type": "text",
            "content": "# Hello World"
          }
        ]
      }
    ]
  }
}
```

## Structure

### Top Level

Every presentation must have a `presentation` object containing:
- `metadata` (required): Presentation information
- `slides` (required): Array of slide definitions

### Metadata

```json
"metadata": {
  "title": "string (required)",
  "author": "string (optional)",
  "description": "string (optional)",
  "theme": "default | light | dark | academic | minimal (optional, default: default)",
  "aspectRatio": "16:9 | 4:3 (optional, default: 16:9)",
  "customTheme": {
    "colors": {
      "primary": "#HEX",
      "background": "#HEX",
      "text": "#HEX",
      "accent": "#HEX"
    },
    "fonts": {
      "heading": "Font Name, fallback",
      "body": "Font Name, fallback"
    }
  }
}
```

**Recommended Resolutions:**
- 16:9 aspect ratio: 1920x1080 (Full HD)
- 4:3 aspect ratio: 1024x768 (Classic)

### Slides

Each slide requires an `elements` array. Optional properties:

```json
{
  "id": "unique-identifier (optional)",
  "layout": "single-column | two-column | title | blank (optional, default: single-column)",
  "background": "#HEX or image path (optional)",
  "transition": "slide | fade | convex | concave | zoom (optional, default: slide)",
  "elements": []
}
```

## Element Types

### 1. Text Element

Supports full markdown syntax.

```json
{
  "type": "text",
  "content": "Text with **markdown** support",
  "style": {
    "fontSize": "small | medium | large | xl | xxl (optional, default: medium)",
    "alignment": "left | center | right | justify (optional, default: left)",
    "color": "#HEX (optional)",
    "fontWeight": "normal | bold | light (optional, default: normal)"
  },
  "position": {
    "area": "header | content | footer | left | right | center (optional, default: content)",
    "order": 0 (optional, default: 0)
  }
}
```

**Markdown Examples:**
- Headings: `# H1`, `## H2`, `### H3`
- Bold: `**bold text**`
- Italic: `*italic text*`
- Bold+Italic: `***bold italic***`
- Code: `` `inline code` ``
- Line breaks: Use `\n`

### 2. Bullets Element

For lists with optional nesting.

```json
{
  "type": "bullets",
  "items": [
    "Simple bullet (supports markdown)",
    {
      "text": "Nested bullet",
      "children": [
        "Sub-item 1",
        "Sub-item 2"
      ]
    }
  ],
  "bulletStyle": "disc | circle | square | number | none (optional, default: disc)",
  "style": { /* same as text style */ },
  "position": { /* same as text position */ }
}
```

### 3. Image Element

Display images with captions.

```json
{
  "type": "image",
  "src": "./path/to/image.png or https://url",
  "alt": "Descriptive alt text (optional but recommended)",
  "width": "50% | 400px | auto (optional, default: auto)",
  "height": "50% | 300px | auto (optional, default: auto)",
  "caption": "**Figure 1:** Description (optional, supports markdown)",
  "position": { /* same as above */ }
}
```

**Image Path Guidelines:**
- Use relative paths: `./images/diagram.png`
- Or absolute URLs: `https://example.com/image.jpg`
- Supported formats: PNG, JPG, SVG, GIF

### 4. Mermaid Diagram Element

Render diagrams using Mermaid syntax.

```json
{
  "type": "mermaid",
  "diagram": "graph LR\n    A-->B\n    B-->C",
  "theme": "default | dark | forest | neutral (optional, default: default)",
  "position": { /* same as above */ }
}
```

**Mermaid Examples:**

Flowchart:
```
graph LR
    A[Start] --> B{Decision}
    B -->|Yes| C[Action]
    B -->|No| D[Alternative]
```

Sequence Diagram:
```
sequenceDiagram
    Alice->>Bob: Hello
    Bob->>Alice: Hi there!
```

Git Graph:
```
gitGraph
    commit
    branch feature
    checkout feature
    commit
    checkout main
    merge feature
```

## Layout Types

### single-column (default)
All elements stack vertically in order.

### two-column
Split slide into left and right areas. Use `position.area: "left"` or `"right"`.

### title
Centered layout for title slides.

### blank
No predefined layout, maximum flexibility.

## Positioning System

Elements are positioned using named areas:

- **header**: Top of slide
- **content**: Main content area (default)
- **footer**: Bottom of slide
- **left**: Left column (two-column layout)
- **right**: Right column (two-column layout)
- **center**: Centered (title layout)

Use `order` property to control stacking within an area (0-based, default: 0).

## Color System

Colors must be hex format: `#RRGGBB` or `#RGB`

**Examples:**
- `#2563EB` (blue)
- `#10B981` (green)
- `#DC2626` (red)
- `#64748B` (gray)

## Best Practices for LLMs

### 1. Start Simple
Begin with basic text and bullets, add complexity as needed.

### 2. Use Semantic IDs
Give slides meaningful IDs: `"id": "intro-slide"`, not `"id": "slide-1"`

### 3. Leverage Markdown
Use markdown for formatting instead of multiple text elements:
```json
{
  "type": "text",
  "content": "### Title\n\nThis is **important** and *emphasized* text."
}
```

### 4. Position Logically
Use the position system to organize content:
- Headers at the top
- Main content in middle
- Callouts in footer

### 5. Color for Emphasis
Use colors sparingly:
- Red (`#DC2626`) for warnings
- Green (`#059669`) for success/tips
- Blue (`#2563EB`) for information
- Gray (`#64748B`) for secondary text

### 6. Two-Column for Comparisons
Use two-column layout for:
- Before/After
- Pros/Cons
- Side-by-side lists

### 7. Mermaid for Diagrams
Prefer Mermaid diagrams over images when possible:
- Workflows
- Architectures
- Processes
- Git operations

## Common Patterns

### Title Slide
```json
{
  "layout": "title",
  "elements": [
    {
      "type": "text",
      "content": "# Main Title",
      "style": {"fontSize": "xxl", "alignment": "center"},
      "position": {"area": "center"}
    },
    {
      "type": "text",
      "content": "Subtitle text",
      "style": {"fontSize": "large", "alignment": "center", "color": "#64748B"},
      "position": {"area": "center", "order": 1}
    }
  ]
}
```

### Content Slide with Header
```json
{
  "layout": "single-column",
  "elements": [
    {
      "type": "text",
      "content": "## Slide Title",
      "style": {"fontSize": "xl"},
      "position": {"area": "header"}
    },
    {
      "type": "bullets",
      "items": ["Point 1", "Point 2", "Point 3"],
      "position": {"area": "content"}
    }
  ]
}
```

### Slide with Diagram and Caption
```json
{
  "layout": "single-column",
  "elements": [
    {
      "type": "text",
      "content": "## Architecture Overview",
      "position": {"area": "header"}
    },
    {
      "type": "mermaid",
      "diagram": "graph LR\n    A-->B\n    B-->C",
      "position": {"area": "content"}
    },
    {
      "type": "text",
      "content": "*Figure 1: System flow diagram*",
      "style": {"alignment": "center", "color": "#64748B"},
      "position": {"area": "footer"}
    }
  ]
}
```

### Comparison Slide
```json
{
  "layout": "two-column",
  "elements": [
    {
      "type": "text",
      "content": "## Before vs After",
      "position": {"area": "header"}
    },
    {
      "type": "text",
      "content": "### Before",
      "style": {"color": "#DC2626"},
      "position": {"area": "left"}
    },
    {
      "type": "bullets",
      "items": ["Problem 1", "Problem 2"],
      "position": {"area": "left", "order": 1}
    },
    {
      "type": "text",
      "content": "### After",
      "style": {"color": "#059669"},
      "position": {"area": "right"}
    },
    {
      "type": "bullets",
      "items": ["Solution 1", "Solution 2"],
      "position": {"area": "right", "order": 1}
    }
  ]
}
```

## Validation

All presentations are validated against the JSON Schema. Common errors:

1. **Missing required fields**: Ensure `presentation`, `metadata.title`, and `slides` array exist
2. **Invalid colors**: Use hex format `#RRGGBB`
3. **Invalid enum values**: Check theme, layout, fontSize options
4. **Empty arrays**: `slides` must have at least one slide
5. **Invalid element type**: Must be `text`, `bullets`, `image`, or `mermaid`

## Examples

See the `examples/` directory for:
- `hello-world.json` - Minimal example
- `comprehensive-demo.json` - All features demonstrated
- `github-course-demo.json` - Real-world presentation

## Future Features (Not Yet Implemented)

The schema includes support for Phase 2 and 3 features:
- `animation` properties (fragment reveals, effects)
- `transition` overrides per slide
- Additional themes

These properties can be included but won't be rendered until future phases.

## Support

For questions or issues with the schema, please refer to:
- Schema file: `schema/presentation.schema.json`
- Examples: `examples/`
- Main documentation: `README.md`
