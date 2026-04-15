import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { JSDOM } from "jsdom";
import PptxGenJS from "pptxgenjs";
import puppeteer from "puppeteer-core";
import { markdownToHtml } from "../utils/markdown.js";
import { startLocalPresentationServer } from "../utils/local-presentation-server.js";

const DEFAULT_CHROME_PATHS = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
].filter(Boolean);

export async function exportPresentation(options) {
  switch (options.format) {
    case "pdf":
      return exportPresentationToPdf(options);
    case "pptx":
      return exportPresentationToPptx(options);
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}

export async function exportPresentationToPdf(options) {
  return withBrowserExportRuntime(options, async (runtime) => {
    const exportUrl = buildExportUrl(runtime.presentationUrl, "pdf");

    await runtime.page.goto(exportUrl, { waitUntil: "load" });
    await waitForExportReady(runtime.page, options.waitMs);
    await runtime.page.emulateMediaType("print");
    await mkdir(dirname(options.outputPath), { recursive: true });

    await runtime.page.pdf({
      margin: {
        top: "0in",
        right: "0in",
        bottom: "0in",
        left: "0in",
      },
      path: options.outputPath,
      preferCSSPageSize: true,
      printBackground: true,
    });
  });
}

export async function exportPresentationToPptx(options) {
  return withBrowserExportRuntime(options, async (runtime) => {
    const exportUrl = buildExportUrl(runtime.presentationUrl, "pptx");
    const tempDirectory = await mkdtemp(
      join(tmpdir(), "agentic-presentation-export-"),
    );

    try {
      await runtime.page.goto(exportUrl, { waitUntil: "load" });
      await waitForExportReady(runtime.page, options.waitMs);

      const screenshots = await captureSlideScreenshots(
        runtime.page,
        tempDirectory,
        runtime.slideCount,
        options.waitMs,
      );
      await writePptxDeck({
        metadata: runtime.builtPresentation.metadata,
        outputPath: options.outputPath,
        screenshots,
        slides: runtime.presentationData.presentation.slides,
      });
    } finally {
      await rm(tempDirectory, { force: true, recursive: true });
    }
  });
}

async function withBrowserExportRuntime(options, callback) {
  const presentationData = JSON.parse(
    await readFile(options.presentationPath, "utf-8"),
  );
  const builtPresentation = {
    dimensions: getAspectRatioDimensions(
      presentationData.presentation?.metadata?.aspectRatio,
    ),
    metadata: presentationData.presentation?.metadata || {},
  };
  const browser = await puppeteer.launch({
    args: ["--disable-dev-shm-usage", "--hide-scrollbars"],
    executablePath: resolveChromeExecutablePath(options.chromePath),
    headless: true,
  });

  const runtime = await startLocalPresentationServer({
    host: options.host,
    port: options.port,
    presentationPath: options.presentationPath,
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({
      deviceScaleFactor: 1,
      height: builtPresentation.dimensions.height,
      width: builtPresentation.dimensions.width,
    });

    runtime.page = page;
    runtime.builtPresentation = builtPresentation;
    runtime.slideCount = runtime.presentationData.presentation.slides.length;

    await callback(runtime);
  } finally {
    await runtime.server.close();
    await browser.close();
  }
}

function resolveChromeExecutablePath(explicitPath) {
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

function buildExportUrl(presentationUrl, format) {
  const url = new URL(presentationUrl);
  url.searchParams.set("export", format);

  if (format === "pdf") {
    url.searchParams.set("print-pdf", "1");
  }

  return url.toString();
}

async function waitForExportReady(page, waitMs) {
  await page.waitForFunction(
    () => window.__presentationExport?.ready === true,
    {
      timeout: 20000,
    },
  );

  if (waitMs > 0) {
    await delay(waitMs);
  }
}

async function captureSlideScreenshots(
  page,
  tempDirectory,
  slideCount,
  waitMs,
) {
  const screenshots = [];

  for (let index = 0; index < slideCount; index += 1) {
    await page.evaluate((slideIndex) => {
      window.Reveal.slide(slideIndex);
    }, index);
    await page.waitForFunction(
      (expectedIndex) => window.Reveal.getIndices().h === expectedIndex,
      {},
      index,
    );
    await page.evaluate(async () => {
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
    });

    if (waitMs > 0) {
      await delay(waitMs);
    }

    const screenshotPath = join(
      tempDirectory,
      `slide-${String(index + 1).padStart(3, "0")}.png`,
    );

    await page.screenshot({
      path: screenshotPath,
      type: "png",
    });

    screenshots.push(screenshotPath);
  }

  return screenshots;
}

async function writePptxDeck({ metadata, outputPath, screenshots, slides }) {
  const pptx = new PptxGenJS();
  pptx.layout = metadata.aspectRatio === "4:3" ? "LAYOUT_4x3" : "LAYOUT_WIDE";
  pptx.author = metadata.author || "";
  pptx.company = "Casual-Vibers";
  pptx.subject = metadata.description || "";
  pptx.title = metadata.title || basename(outputPath);

  for (let index = 0; index < screenshots.length; index += 1) {
    const slide = pptx.addSlide();
    slide.addImage({
      path: screenshots[index],
      x: 0,
      y: 0,
      w: "100%",
      h: "100%",
    });

    const notes = toSpeakerNotes(slides[index]?.speakerNotes);
    if (notes) {
      slide.addNotes(notes);
    }
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await pptx.writeFile({ fileName: outputPath });
}

function toSpeakerNotes(markdown) {
  if (!markdown) {
    return "";
  }

  const html = markdownToHtml(markdown);
  const document = new JSDOM(html).window.document;
  const blocks = [];

  document.body.childNodes.forEach((node) => {
    const text = node.textContent?.trim();
    if (text) {
      blocks.push(text);
    }
  });

  return blocks.join("\n\n");
}

function getAspectRatioDimensions(aspectRatio) {
  if (aspectRatio === "4:3") {
    return { width: 1024, height: 768 };
  }

  return { width: 1920, height: 1080 };
}

function delay(waitMs) {
  return new Promise((resolve) => setTimeout(resolve, waitMs));
}
