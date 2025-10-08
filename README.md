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

## Development Phases

### Phase 1: Foundation (Current)
- [ ] JSON schema for basic elements (text, bullets, images, Mermaid)
- [ ] Basic renderer
- [ ] Simple positioning system
- [ ] Example presentations

### Phase 2: Styling & Themes
- [ ] Theme system (colors, fonts, backgrounds)
- [ ] Typography controls
- [ ] Layout templates

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

MIT
