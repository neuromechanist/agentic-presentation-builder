# Online Viewer

Try the presentation engine directly in your browser without installing anything.

**[Open the Viewer](https://neuromechanist.github.io/agentic-presentation-builder/viewer/){ .md-button .md-button--primary }**

## How to use

The viewer offers three ways to load a presentation:

### Paste JSON

1. Open the viewer link above
2. Click the **Paste JSON** tab
3. Paste your presentation JSON into the textarea
4. Click **Present**

This is the fastest way to preview a deck. Works on any device with a modern browser.

### Upload a JSON file

1. Click the **JSON File** tab
2. Click **Upload JSON File** and pick a `.json` file from your machine
3. The presentation renders immediately

### Upload a folder

1. Click the **Folder** tab
2. Click **Choose Deck Folder** and pick the folder containing your JSON and assets
3. Relative image paths (`./images/photo.png`) are resolved against the selected folder

!!! note "Image paths in hosted mode"
    When using **Paste JSON** or **JSON File** mode, relative image paths like `./images/photo.png` will not resolve because the viewer has no access to your local filesystem. Use absolute URLs (e.g., `https://example.com/photo.png`) for images, or use the **Folder** upload mode which imports assets alongside the JSON.

## Minimal test deck

Copy and paste this into the viewer to verify it works:

```json
{
  "presentation": {
    "metadata": { "title": "Quick Test", "theme": "default" },
    "slides": [
      {
        "id": "s1",
        "layout": "title",
        "elements": [
          {
            "type": "text",
            "content": "# It works!",
            "style": { "fontSize": "xxl", "alignment": "center" },
            "position": { "area": "center" }
          }
        ]
      }
    ]
  }
}
```

## Keyboard shortcuts

Once a presentation is rendered:

- **Arrow keys** / **Space**: navigate slides
- **Escape**: overview mode
- **S**: presenter notes
- **F**: fullscreen
