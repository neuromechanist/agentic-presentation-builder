# Schema Reference

The source of truth is `schema/presentation.schema.json` in the repository root.

## Presentation metadata

| Field | Type | Notes |
| --- | --- | --- |
| `title` | `string` | Required |
| `author` | `string` | Optional |
| `description` | `string` | Optional |
| `theme` | `string` | `default`, `light`, `dark`, `academic`, `minimal` |
| `aspectRatio` | `string` | `16:9` or `4:3` |
| `controls.slideNumbers` | `boolean` | Slide number visibility |
| `controls.progress` | `boolean` | Progress bar visibility |
| `controls.showNotes` | `boolean` | Enables speaker notes support |
| `customTheme.colors.*` | `string` | Hex colors only |
| `customTheme.fonts.*` | `string` | CSS font-family values |

## Slide fields

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `string` | Stable slide identifier |
| `title` | `string` | Overview label |
| `layout` | `string` | `single-column`, `two-column`, `title`, `blank` |
| `background` | `string` | Hex color or image path |
| `transition` | `string` | `slide`, `fade`, `convex`, `concave`, `zoom` |
| `speakerNotes` | `string` | Presenter notes |
| `elements` | `array` | Slide content |

## Shared element fields

### `style`

| Field | Type | Allowed values |
| --- | --- | --- |
| `fontSize` | `string` | `small`, `medium`, `large`, `xl`, `xxl` |
| `alignment` | `string` | `left`, `center`, `right`, `justify` |
| `color` | `string` | Hex color |
| `fontWeight` | `string` | `normal`, `bold`, `light` |

### `position`

| Field | Type | Allowed values |
| --- | --- | --- |
| `area` | `string` | `header`, `content`, `footer`, `left`, `right`, `center` |
| `order` | `integer` | `0` or greater |

### `animation`

| Field | Type | Allowed values |
| --- | --- | --- |
| `type` | `string` | `fade`, `slide-up`, `slide-down`, `zoom`, `none` |
| `fragment` | `boolean` | Progressive reveal toggle |
| `index` | `integer` | Reveal order |

## Element-specific fields

### `text`

- required: `type`, `content`
- supports Markdown, alerts, and LaTeX

### `bullets`

- required: `type`, `items`
- `bulletStyle`: `disc`, `circle`, `square`, `number`, `none`
- items can be strings or nested `{ text, children }` objects

### `image`

- required: `type`, `src`
- optional: `alt`, `width`, `height`, `caption`
- width and height support `%`, `px`, or `auto`

### `mermaid`

- required: `type`, `diagram`
- `theme`: `default`, `dark`, `forest`, `neutral`

### `callout`

- required: `type`, `content`
- `calloutType`: `tip`, `warning`, `important`, `note`, `info`
- optional `title`

### `code`

- required: `type`, `code`
- optional `language`, `caption`, `lineNumbers`

### `table`

- required: `type`, `headers`, `rows`
- optional `caption`
