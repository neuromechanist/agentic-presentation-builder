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

# Build for production
npm run build
```

## Project Structure

```
agent-presentation/
├── src/              # Source code
│   ├── parser/       # JSON schema parser
│   ├── renderer/     # Reveal.js HTML generator
│   └── validator/    # Schema validation
├── examples/         # Example presentations in JSON
├── public/           # Static assets
└── docs/            # Documentation
```

## Features

✅ **JSON-based presentation definition** - Simple, LLM-friendly format
✅ **Multiple element types** - Text, bullets, images, Mermaid diagrams
✅ **Flexible layouts** - Single-column, two-column, title, blank
✅ **Markdown support** - Rich text formatting in text and bullets
✅ **Theme system** - Customizable colors, fonts, and styles
✅ **Position control** - Header, content, footer, left, right, center areas
✅ **Interactive diagrams** - Mermaid.js integration for flowcharts and diagrams

## Usage

1. Create a JSON presentation file:

```json
{
  "presentation": {
    "metadata": {
      "title": "My Presentation",
      "theme": "default",
      "aspectRatio": "16:9"
    },
    "slides": [...]
  }
}
```

2. Place it in the `examples/` directory

3. View at: `http://localhost:3000/?presentation=./examples/your-file.json`

See `SCHEMA_GUIDE.md` for complete documentation.

## Development Phases

### Phase 1: Foundation ✅ COMPLETE
- [x] JSON schema for basic elements (text, bullets, images, Mermaid)
- [x] Basic renderer with Reveal.js integration
- [x] Position system with multiple areas
- [x] Example presentations (hello-world, comprehensive-demo, github-course-demo, image-demo)

### Phase 2: Styling & Themes (In Progress)
- [ ] Enhanced theme system
- [ ] Typography controls
- [ ] Layout templates
- [ ] Custom CSS variables

### Phase 3: Animation System
- [ ] Element animations
- [ ] Slide transitions
- [ ] Timing controls

### Phase 4: Advanced Features
- [ ] Code highlighting
- [ ] Interactive elements
- [ ] Speaker notes
- [ ] Export options

## JSON Schema Preview

```json
{
  "presentation": {
    "metadata": {
      "title": "My Presentation",
      "author": "AI Agent",
      "theme": "default"
    },
    "slides": [
      {
        "layout": "single-column",
        "elements": [
          {
            "type": "text",
            "content": "Hello World",
            "fontSize": "large",
            "alignment": "center"
          }
        ]
      }
    ]
  }
}
```

## Contributing

This project follows atomic commit practices. Each commit should be a single logical change. See `.rules/git.md` for details.

## License

Copyright (c) 2025 Casual-Vibers. All Rights Reserved.

This is proprietary software. See LICENSE file for details.
