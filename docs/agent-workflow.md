# Agent Workflow

This system is designed for iterative JSON authoring by an agent.

## Recommended loop

1. Generate or edit a deck JSON file.
2. Run structured validation.
3. Fix blocking errors and advisory warnings.
4. Open the deck and inspect rendered audit output.
5. Use browser automation only after the structured issues are resolved.

## CLI validation

Human-readable output:

```bash
npm run validate -- examples/image-demo.json
```

Machine-readable output:

```bash
npm run validate -- examples/image-demo.json --json
```

The payload includes:

- `valid`
- `summary.errorCount`
- `summary.warningCount`
- `errors[]`
- `warnings[]`

Each issue includes stable fields such as `code`, `severity`, `path`, `message`, and `suggestion`.

## Browser-side audit

When a deck is loaded, the app publishes three browser globals:

- `window.__presentationValidation`
- `window.__presentationAudit`
- `window.__presentationAgentReport`

`__presentationAudit` includes per-slide:

- `slideId`
- `slideIndex`
- `fitScore`
- `fitSeverity`
- `overflow`
- `layoutFindings`
- `authorWarnings`
- `recommendations`

## When to use browser automation

Use Puppeteer or a similar browser tool for:

- checking final layout at `1920x1080`
- verifying Mermaid rendering
- testing fragment timing and navigation
- confirming presentation and audience modes

Do not use browser automation as the first validation pass. The structured validator is faster and easier to iterate against.

## Warning model

Current advisory warnings include:

- `dense-copy`
- `dense-bullets`
- `dense-media`
- `fixed-image-sizing`
- `fragment-overuse`
- `missing-image-alt`
- `complex-mermaid`

These warnings do not block rendering, but they are intended to improve slide quality.
