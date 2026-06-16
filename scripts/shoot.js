#!/usr/bin/env node
/**
 * apb shoot -- screenshot every slide of a deck at full HD for visual QC.
 *
 * `apb validate` passes decks that still render a blank mermaid or clipped code;
 * the only reliable QC is to look at every slide. This serves the deck (reusing
 * the present server) and drives headless Chrome through it, writing one PNG per
 * slide. Transitions and fragments are disabled during capture so an unsettled
 * slide-transform never fakes a right-edge clip and every animated element shows.
 *
 *   apb shoot deck.json --out ./qc
 *   apb shoot deck.json --out ./qc --width 1920 --height 1080
 */

import { existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import { startLocalPresentationServer } from "../src/utils/local-presentation-server.js";

const DEFAULT_CHROME_PATHS = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
].filter(Boolean);

const USAGE = [
  "Usage: apb shoot <deck.json> [options]",
  "",
  "Screenshot every slide at full resolution for visual QC.",
  "",
  "Options:",
  "  --out <dir>         Output directory for the slide images (default: ./apb-screenshots)",
  "  --width <px>        Viewport width (default: 1920)",
  "  --height <px>       Viewport height (default: 1080)",
  "  --wait <ms>         Settle delay per slide before capture (default: 800)",
  "  --chrome-path <p>   Path to a Chrome/Edge executable (else auto-detected)",
  "  --port <n>          Port for the temporary present server (default: ephemeral)",
  "  --host <h>          Host for the temporary present server",
  "  --help              Show this help",
].join("\n");

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function resolveChromeExecutablePath(explicitPath) {
  if (explicitPath) {
    if (!existsSync(explicitPath)) {
      throw new Error(`Chrome executable not found at ${explicitPath}`);
    }
    return explicitPath;
  }
  for (const candidate of DEFAULT_CHROME_PATHS) {
    if (candidate && existsSync(candidate)) return candidate;
  }
  throw new Error(
    "Could not find a Chrome-compatible browser. Pass --chrome-path to a local Chrome or Edge executable.",
  );
}

function parseArgs(argv) {
  const args = {
    presentationPath: undefined,
    out: "./apb-screenshots",
    width: 1920,
    height: 1080,
    wait: 800,
    chromePath: undefined,
    port: undefined,
    host: undefined,
    help: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = () => argv[(i += 1)];
    switch (a) {
      case "--help":
      case "-h": args.help = true; break;
      case "--out": args.out = next(); break;
      case "--width": args.width = Number(next()); break;
      case "--height": args.height = Number(next()); break;
      case "--wait": args.wait = Number(next()); break;
      case "--chrome-path": args.chromePath = next(); break;
      case "--port": args.port = Number(next()); break;
      case "--host": args.host = next(); break;
      default:
        if (a.startsWith("-")) throw new Error(`Unknown option: ${a}`);
        if (!args.presentationPath) args.presentationPath = a;
        else throw new Error(`Unexpected argument: ${a}`);
    }
  }
  return args;
}

export async function main(argv = process.argv.slice(2)) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (error) {
    console.error(`${error.message}\n`);
    console.error(USAGE);
    process.exit(1);
  }

  if (args.help) {
    console.log(USAGE);
    return;
  }
  if (!args.presentationPath) {
    console.error("Missing presentation JSON path.\n");
    console.error(USAGE);
    process.exit(1);
  }

  let runtime;
  try {
    runtime = await startLocalPresentationServer({
      host: args.host,
      open: false,
      port: args.port,
      presentationPath: args.presentationPath,
    });
  } catch (error) {
    if (error.validationResult) {
      console.error(`${error.message}\n`);
      error.validationResult.errors.forEach((e, idx) =>
        console.error(`${idx + 1}. ${e.path || "root"}: ${e.message}`),
      );
      process.exit(1);
    }
    throw error;
  }

  const { presentationUrl, presentationPath, server } = runtime;
  const outDir = resolve(args.out);
  mkdirSync(outDir, { recursive: true });
  console.log(`Shooting: ${presentationPath}`);
  console.log(`Output:   ${outDir}  (${args.width}x${args.height})`);

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: resolveChromeExecutablePath(args.chromePath),
      headless: true,
      args: ["--no-sandbox", "--force-device-scale-factor=1"],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: args.width, height: args.height, deviceScaleFactor: 1 });
    await page.goto(presentationUrl, { waitUntil: "load" });
    await page.waitForFunction(
      "window.Reveal && window.Reveal.isReady && window.Reveal.isReady()",
      { timeout: 20000 },
    );
    // Disable transitions (so an unsettled transform can't fake a clip) and
    // fragments (so every animated element is captured in one shot).
    await page.evaluate(() => window.Reveal.configure({ fragments: false, transition: "none" }));
    await delay(600);

    const total = await page.evaluate(() => window.Reveal.getTotalSlides());
    for (let i = 0; i < total; i += 1) {
      await page.evaluate((n) => window.Reveal.slide(n), i);
      await delay(args.wait);
      // mermaid renders asynchronously -- wait for its SVG before shooting
      await page
        .waitForFunction(
          () => {
            const sec =
              document.querySelector("section.present") || document.querySelector("section");
            const m = sec && sec.querySelector(".mermaid");
            return !m || !!m.querySelector("svg");
          },
          { timeout: 6000 },
        )
        .catch(() => {});
      await delay(400);
      const id = await page.evaluate(() => (window.Reveal.getCurrentSlide() || {}).id || "");
      const name = `slide-${String(i + 1).padStart(3, "0")}${id ? `-${id}` : ""}.png`;
      await page.screenshot({ path: join(outDir, name) });
      console.log(`  + ${name}`);
    }
    console.log(`\nWrote ${total} screenshots to ${outDir}`);
  } finally {
    try {
      await browser?.close();
    } catch (e) {
      console.warn(`Browser cleanup failed: ${e.message}`);
    }
    try {
      await server?.close();
    } catch (e) {
      console.warn(`Server cleanup failed: ${e.message}`);
    }
  }
}

const isEntrypoint =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isEntrypoint) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exit(1);
  });
}
