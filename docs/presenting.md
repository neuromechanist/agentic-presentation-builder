# Presenting

## Modes

The runtime supports four practical delivery states:

- `authoring`: diagnostics and fit overlays available
- `presentation`: clean deck mode
- `presenter`: Reveal notes popup for speaker notes
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

- press `S` to open the presenter notes popup
- or use `Settings` -> `Open Presenter View`

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
- `S`: open speaker notes
- `O`: overview
- `F`: fullscreen
- `?`: keyboard shortcuts help
- `Esc`: close overlays or exit Reveal overview/pause states

## Query parameters

Useful runtime query parameters:

- `presentation=...`: JSON deck path
- `mode=presentation` or `mode=authoring`
- `role=audience`
- `warnings=visible` or `warnings=hidden`
