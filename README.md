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

For complete JSON schema documentation, see:
- **Schema file**: `schema/presentation.schema.json`
- Detailed validation rules
- All available element types and properties
- Theme customization options

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
