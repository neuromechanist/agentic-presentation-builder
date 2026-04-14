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
