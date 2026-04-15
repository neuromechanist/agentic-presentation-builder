# Local Deck Loader

The app root at `http://localhost:3000` now acts as a local deck launcher.

## Why this exists

The old workflow assumed your deck JSON lived inside this repo or under `public/`. That is fine for examples, but awkward for real presentations that live elsewhere on disk.

The local deck loader fixes that by importing a folder from your machine directly in the browser.

## Recommended workflow

1. Run the app:

   ```bash
   npm install
   npm run dev
   ```

2. Open `http://localhost:3000`
3. Click `Choose Deck Folder`
4. Pick the folder that contains your deck JSON and any related assets
5. If the folder contains multiple JSON files, choose the one you want to render

## Relative asset behavior

When you import a folder, the app resolves relative paths against the selected JSON file:

- `image.src`
- `slide.background`

Example:

```text
slides/demo.json
slides/images/cover.png
slides/assets/logo.svg
```

If `demo.json` references `./images/cover.png` or `./assets/logo.svg`, the imported deck will render those assets correctly without copying anything into this repo.

## Limitations

- Companion presenter and audience windows still require a URL-backed deck
- The local loader currently rewrites `image.src` and `slide.background`; inline markdown image links are not remapped
- Browsers need local file access support for folder selection. On localhost this works well in Chromium-based browsers, and there is a file-input fallback when directory picker APIs are unavailable

## URL-backed alternative

If you want a shareable URL or presenter/audience companion windows, use the CLI:

```bash
npm run present -- ~/slides/demo.json
```
