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

## Showcase auto-rotation and video

Set `metadata.controls.autoRotate` to `true` to expose the **Start auto-rotate**
button. Playback is always off at load. `autoRotateInterval` optionally sets the
initial dwell time (5–120 seconds, default 15); the toolbar can change it during
presentation. At the final slide, playback loops to the first slide. Manual
slide or fragment navigation restarts a full interval. Pause stops the timer.

Rotation waits while a video on the current slide is playing, the page is hidden,
the deck is in overview/blackout, or the interval menu is focused. Resuming waits
a full interval; leaving a slide pauses its videos. A looping video holds the deck
until you pause it or navigate away. The controls are not shown on the synced
audience screen. Reduced-motion preference disables slide transitions.

Use a native video element for a click-to-play demonstration:

```json
{
  "type": "video",
  "src": "assets/walkthrough.mp4",
  "poster": "assets/walkthrough.jpg",
  "alt": "NEMAR dataset walkthrough",
  "controls": true,
  "loop": true,
  "muted": false,
  "width": "90%",
  "height": "650px",
  "caption": "Press play to watch the walkthrough."
}
```

Videos never autoplay. MP4 with H.264 is recommended for browser compatibility.
Keep native controls enabled for keyboard and touch access. Local-folder imports
resolve video and poster assets just like images. Caption text describes the clip;
spoken instructional videos should also provide an accessible transcript.

Auto-rotation controls live inside the existing Presentation Settings panel. No
extra hamburger is added. Settings collapse after 10 seconds of inactivity and
reopen via Settings, hover, or the comma keyboard shortcut. A focused control or
pointer inside the panel prevents auto-hide; Escape returns focus to Settings.
Collapsing settings does not change playback. Standalone integrations without a
Settings panel retain the accessible bottom-right fallback menu.
