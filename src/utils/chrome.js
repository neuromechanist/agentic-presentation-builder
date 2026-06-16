import { existsSync } from "node:fs";

/**
 * Candidate paths for a Chrome-compatible browser, in priority order. Shared by
 * the export and shoot subcommands so a new location only needs adding once.
 */
export const DEFAULT_CHROME_PATHS = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
].filter(Boolean);

/**
 * Resolve a Chrome/Edge executable. Honors an explicit path when given,
 * otherwise probes the default locations.
 */
export function resolveChromeExecutablePath(explicitPath) {
  if (explicitPath) {
    if (!existsSync(explicitPath)) {
      throw new Error(`Chrome executable not found at ${explicitPath}`);
    }
    return explicitPath;
  }

  for (const candidate of DEFAULT_CHROME_PATHS) {
    if (candidate && existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    "Could not find a Chrome-compatible browser. Pass --chrome-path to a local Chrome or Edge executable.",
  );
}
