/**
 * Client-side application
 * Loads presentation JSON, builds it, and initializes Reveal.js
 */

import Reveal from "reveal.js";
import { buildPresentation } from "./index-browser.js";
import { validatePresentation } from "./validator/index.js";
import {
  createImportedDeckFileCatalog,
  rewriteImportedPresentationAssetPaths,
} from "./utils/local-deck.js";
import { markdownToHtml } from "./utils/markdown-browser.js";
import {
  buildRecommendations,
  calculateFitScore,
  createIssue,
  getFitSeverity,
  toIssueKey,
} from "./utils/fit-guidance.js";

// Get presentation path from URL parameter or fall back to the local deck launcher
const params = new URLSearchParams(window.location.search);
let presentationPath = params.get("presentation");
const exportMode = normalizeExportMode(params.get("export"));
const isExportMode = exportMode !== null;
const PRESENTATION_MODE_STORAGE_KEY = "agentic-presentation-mode";
const WARNINGS_VISIBILITY_STORAGE_KEY = "agentic-presentation-warnings";
const presentationRole = getPresentationRole();
let presentationSourceKind = presentationPath ? "remote" : "launcher";
let mermaidLoaderPromise = null;
let prismLoaderPromise = null;
let mathRendererPromise = null;
let presentationWarningsBySlide = new Map();
let latestPresentationValidation = null;
let latestPresentationAudit = null;
let presentationModeEnabled = getInitialPresentationMode();
let warningsVisible = getInitialWarningsVisibility();
let revealInstance = null;
let presentationSyncChannel = null;
let presenterSlides = [];
let localDeckObjectUrls = [];
window.__presentationValidation = null;
window.__presentationAudit = null;
window.__presentationAgentReport = null;
window.__presentationExport = {
  dimensions: null,
  format: exportMode,
  ready: false,
  totalSlides: 0,
};
window.__presentationMode = {
  enabled: presentationModeEnabled,
  mode: presentationModeEnabled ? "presentation" : "authoring",
  warningsVisible,
};
window.__presentationRole = presentationRole;
window.__getPresentationValidation = () => latestPresentationValidation;
window.__getPresentationAudit = () => latestPresentationAudit;
window.__getPresentationAgentReport = () => window.__presentationAgentReport;

/**
 * Load and render presentation
 */
async function loadAndRenderPresentation(
  presentationData = null,
  options = {},
) {
  try {
    if (options.presentationPath) {
      presentationPath = options.presentationPath;
    }

    if (options.sourceKind) {
      presentationSourceKind = options.sourceKind;
    }

    document.body.classList.toggle(
      "audience-screen",
      presentationRole === "audience",
    );
    document.body.classList.toggle("export-mode", isExportMode);
    document.body.dataset.exportFormat = exportMode || "";
    const loading = document.getElementById("loading");
    loading.style.display = "flex";
    loading.innerHTML = "<div>Loading presentation...</div>";

    const resolvedPresentationData =
      presentationData || (await loadPresentationFromUrl(presentationPath));
    const validationResult = validatePresentation(resolvedPresentationData);
    publishPresentationValidation(validationResult);
    presentationWarningsBySlide = indexWarningsBySlide(
      validationResult.warnings,
    );
    const built = buildPresentation(resolvedPresentationData);
    presenterSlides = buildPresenterSlides(resolvedPresentationData);

    document.title = built.metadata.title || "Presentation";

    if (presentationRole === "presenter") {
      renderPresenterView(built, presenterSlides);
      setupPresenterSync();
      loading.style.display = "none";
      return;
    }

    const styleEl = document.createElement("style");
    styleEl.textContent = built.themeCSS;
    document.head.appendChild(styleEl);

    const slidesContainer = document.querySelector(".reveal .slides");
    slidesContainer.innerHTML = built.slidesHTML;

    await hydrateRenderedImages(slidesContainer);

    loading.style.display = "none";

    const controls = built.metadata.controls || {
      slideNumbers: false,
      progress: true,
      showNotes: false,
    };

    await Reveal.initialize({
      hash: true,
      controls: presentationRole === "audience" || isExportMode ? false : true,
      progress:
        presentationRole === "audience" || isExportMode
          ? false
          : controls.progress,
      center: false,
      transition: "slide",
      slideNumber:
        presentationRole === "audience" || isExportMode
          ? false
          : controls.slideNumbers
            ? "c/t"
            : false,
      showNotes: isExportMode ? false : controls.showNotes,
      width: built.dimensions.width,
      height: built.dimensions.height,
      margin: 0.04,
      minScale: 0.3,
      maxScale: 1.5,
      overview: !isExportMode,
      fragments: !isExportMode,
      pdfSeparateFragments: false,
    });
    revealInstance = Reveal;
    window.Reveal = Reveal;

    await initializeMermaidIfNeeded(slidesContainer);
    await renderMathContent(slidesContainer);
    await highlightCodeIfNeeded(slidesContainer);

    if (isExportMode) {
      await prepareExportRendering(Reveal, slidesContainer, built);
    } else {
      createShortcutsHelp();

      const auditControls = createLayoutAuditControls();
      createSettingsControls(auditControls);
      applyPresentationMode(presentationModeEnabled, auditControls, {
        persist: false,
      });
      applyWarningsVisibility(warningsVisible, auditControls, {
        persist: false,
      });
      const scheduleLayoutAudit = createLayoutAuditScheduler(
        Reveal,
        auditControls,
      );

      bindLayoutAuditEvents(Reveal, scheduleLayoutAudit);
      setupPresentationSync(Reveal);
      scheduleLayoutAudit();
    }

    console.log("Presentation loaded successfully:", built.metadata.title);
  } catch (error) {
    console.error("Error loading presentation:", error);
    if (
      presentationSourceKind === "local" ||
      presentationSourceKind === "launcher"
    ) {
      renderLocalDeckLauncher(error.message);
      return;
    }

    document.getElementById("loading").innerHTML = `
      <div style="color: #DC2626; text-align: center;">
        <h2>Error Loading Presentation</h2>
        <p>${error.message}</p>
        <p><a href="/">Open the local deck picker</a></p>
        <p><a href="?presentation=./examples/hello-world.json">Try hello-world example</a></p>
      </div>
    `;
  }
}

async function loadPresentationFromUrl(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load presentation: ${response.statusText}`);
  }

  return response.json();
}

function renderLocalDeckLauncher(errorMessage = "") {
  presentationSourceKind = "launcher";
  document.title = "Open Local Presentation";
  document.body.classList.remove("audience-screen");
  document.querySelector(".reveal .slides").innerHTML = "";
  document.getElementById("loading").style.display = "flex";
  document.getElementById("loading").innerHTML = `
    <div class="deck-launcher">
      <div class="deck-launcher-card">
        <p class="deck-launcher-kicker">Presentation Viewer</p>
        <h1>Open or paste a presentation</h1>
        <div class="deck-launcher-tabs">
          <button type="button" class="deck-launcher-tab active" data-tab="folder">Folder</button>
          <button type="button" class="deck-launcher-tab" data-tab="file">JSON File</button>
          <button type="button" class="deck-launcher-tab" data-tab="paste">Paste JSON</button>
        </div>
        ${errorMessage ? `<p class="deck-launcher-error">${escapeHtml(errorMessage)}</p>` : ""}
        <div class="deck-launcher-panel active" data-panel="folder">
          <p class="deck-launcher-copy">
            Choose the folder that contains your JSON deck and any relative assets. The browser will import the deck,
            rewrite local image and background paths, and render it.
          </p>
          <div class="deck-launcher-actions">
            <button type="button" id="open-local-deck-btn">Choose Deck Folder</button>
            <a href="?presentation=./examples/hello-world.json" class="deck-launcher-link">Open hello-world example</a>
          </div>
          <p class="deck-launcher-hint">
            Relative <code>image.src</code> and <code>slide.background</code> paths are resolved against the selected JSON file inside that folder.
          </p>
          <input id="local-deck-folder-input" type="file" webkitdirectory directory multiple hidden>
          <div id="local-deck-selection"></div>
        </div>
        <div class="deck-launcher-panel" data-panel="file">
          <p class="deck-launcher-copy">
            Upload a single <code>.json</code> presentation file. Images with relative paths will not load; use absolute URLs in your JSON for hosted viewing.
          </p>
          <div class="deck-launcher-actions">
            <button type="button" id="upload-json-btn">Upload JSON File</button>
          </div>
          <input id="json-file-input" type="file" accept=".json,application/json" hidden>
        </div>
        <div class="deck-launcher-panel" data-panel="paste">
          <p class="deck-launcher-copy">
            Paste your presentation JSON below. Images with relative paths will not load; use absolute URLs for hosted viewing.
          </p>
          <textarea id="json-paste-input" class="deck-launcher-textarea" placeholder='{"presentation":{"metadata":{"title":"My Deck"},"slides":[...]}}'></textarea>
          <div class="deck-launcher-actions">
            <button type="button" id="render-pasted-json-btn">Present</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.querySelectorAll(".deck-launcher-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".deck-launcher-tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".deck-launcher-panel").forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      const panel = document.querySelector(`.deck-launcher-panel[data-panel="${tab.dataset.tab}"]`);
      if (panel) panel.classList.add("active");
    });
  });

  document
    .getElementById("open-local-deck-btn")
    ?.addEventListener("click", async () => {
      try {
        if (typeof window.showDirectoryPicker === "function") {
          const directoryHandle = await window.showDirectoryPicker();
          const files = await collectLocalDeckFiles(
            directoryHandle,
            directoryHandle.name,
          );
          await handleLocalDeckFiles(files);
          return;
        }
      } catch (error) {
        if (error?.name !== "AbortError") {
          renderLocalDeckLauncher(error.message);
        }
        return;
      }

      document.getElementById("local-deck-folder-input")?.click();
    });

  document
    .getElementById("local-deck-folder-input")
    ?.addEventListener("change", async (event) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) {
        return;
      }

      await handleLocalDeckFiles(files);
    });

  document
    .getElementById("upload-json-btn")
    ?.addEventListener("click", () => {
      document.getElementById("json-file-input")?.click();
    });

  document
    .getElementById("json-file-input")
    ?.addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        presentationPath = `upload:${file.name}`;
        presentationSourceKind = "paste";
        await loadAndRenderPresentation(data, {
          presentationPath,
          sourceKind: "paste",
        });
      } catch (error) {
        renderLocalDeckLauncher(error.message);
      }
    });

  document
    .getElementById("render-pasted-json-btn")
    ?.addEventListener("click", async () => {
      const textarea = document.getElementById("json-paste-input");
      const text = textarea?.value?.trim();
      if (!text) {
        renderLocalDeckLauncher("Paste your presentation JSON first.");
        return;
      }
      try {
        const data = JSON.parse(text);
        presentationPath = "paste:inline";
        presentationSourceKind = "paste";
        await loadAndRenderPresentation(data, {
          presentationPath,
          sourceKind: "paste",
        });
      } catch (error) {
        renderLocalDeckLauncher(error.message);
      }
    });
}

async function handleLocalDeckFiles(files) {
  const { filesByPath, jsonFiles } = createImportedDeckFileCatalog(files);

  if (jsonFiles.length === 0) {
    renderLocalDeckLauncher("No JSON files were found in the selected folder.");
    return;
  }

  if (jsonFiles.length === 1) {
    await loadImportedPresentation(filesByPath, jsonFiles[0]);
    return;
  }

  const selection = document.getElementById("local-deck-selection");
  if (!selection) {
    return;
  }

  selection.innerHTML = `
    <div class="deck-launcher-select">
      <label for="local-deck-json-select">Choose a JSON deck from the selected folder</label>
      <select id="local-deck-json-select">
        ${jsonFiles.map((path) => `<option value="${escapeHtml(path)}">${escapeHtml(path)}</option>`).join("")}
      </select>
      <button type="button" id="load-selected-local-deck">Load Deck</button>
    </div>
  `;

  selection
    .querySelector("#load-selected-local-deck")
    ?.addEventListener("click", async () => {
      const selectedPath = selection.querySelector(
        "#local-deck-json-select",
      )?.value;
      if (!selectedPath) {
        return;
      }

      await loadImportedPresentation(filesByPath, selectedPath);
    });
}

async function loadImportedPresentation(filesByPath, jsonRelativePath) {
  const jsonFile = filesByPath.get(jsonRelativePath);
  if (!jsonFile) {
    renderLocalDeckLauncher(
      `Could not find ${jsonRelativePath} in the selected folder.`,
    );
    return;
  }

  try {
    revokeLocalDeckObjectUrls();
    const fileContent = await jsonFile.text();
    const presentationData = JSON.parse(fileContent);
    const rewrittenPresentation = rewriteImportedPresentationAssetPaths(
      presentationData,
      {
        createObjectUrl: (file) => URL.createObjectURL(file),
        filesByPath,
        jsonRelativePath,
      },
    );

    localDeckObjectUrls = rewrittenPresentation.objectUrls;
    presentationPath = `local:${jsonRelativePath}`;
    presentationSourceKind = "local";

    if (rewrittenPresentation.unresolvedAssets.length > 0) {
      console.warn(
        "Some imported local assets could not be resolved:",
        rewrittenPresentation.unresolvedAssets,
      );
    }

    await loadAndRenderPresentation(rewrittenPresentation.presentationData, {
      presentationPath,
      sourceKind: "local",
    });
  } catch (error) {
    revokeLocalDeckObjectUrls();
    renderLocalDeckLauncher(error.message);
  }
}

async function collectLocalDeckFiles(directoryHandle, pathPrefix = "") {
  const files = [];

  for await (const [entryName, entryHandle] of directoryHandle.entries()) {
    const relativePath = pathPrefix ? `${pathPrefix}/${entryName}` : entryName;

    if (entryHandle.kind === "file") {
      const file = await entryHandle.getFile();
      files.push({ file, relativePath });
      continue;
    }

    if (entryHandle.kind === "directory") {
      files.push(...(await collectLocalDeckFiles(entryHandle, relativePath)));
    }
  }

  return files;
}

function revokeLocalDeckObjectUrls() {
  localDeckObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  localDeckObjectUrls = [];
}

/**
 * Normalize Mermaid SVG output so large diagrams scale predictably inside slides.
 */
function normalizeMermaidDiagrams() {
  document.querySelectorAll(".mermaid svg").forEach((svg) => {
    const width = Number.parseFloat(svg.getAttribute("width"));
    const height = Number.parseFloat(svg.getAttribute("height"));

    if (
      !svg.getAttribute("viewBox") &&
      Number.isFinite(width) &&
      Number.isFinite(height)
    ) {
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    }

    svg.removeAttribute("width");
    svg.removeAttribute("height");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.style.width = "100%";
    svg.style.height = "auto";
    svg.style.maxWidth = "100%";
  });
}

async function renderMathContent(root) {
  const mathTargets = Array.from(
    root.querySelectorAll(
      [
        ".text-element",
        ".bullet-list",
        ".callout-content",
        ".callout-title",
        ".image-caption",
        ".table-caption",
        ".code-caption",
      ].join(", "),
    ),
  ).filter((element) => containsMathSyntax(element.textContent));

  if (mathTargets.length === 0) {
    return;
  }

  const renderMathInElement = await loadMathRenderer();

  mathTargets.forEach((element) => {
    renderMathInElement(element, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\(", right: "\\)", display: false },
        { left: "\\[", right: "\\]", display: true },
      ],
      throwOnError: false,
      strict: "ignore",
      ignoredTags: [
        "script",
        "noscript",
        "style",
        "textarea",
        "pre",
        "code",
        "option",
      ],
    });
  });
}

async function initializeMermaidIfNeeded(root) {
  if (!root.querySelector(".mermaid")) {
    return;
  }

  const mermaid = await loadMermaid();
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: "base",
    themeVariables: {
      primaryColor: "#2563EB",
      primaryTextColor: "#1E293B",
      primaryBorderColor: "#E2E8F0",
      lineColor: "#64748B",
      background: "#F8FAFC",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    flowchart: {
      htmlLabels: true,
      curve: "basis",
      useMaxWidth: true,
      padding: 20,
    },
  });

  await mermaid.run({
    querySelector: ".mermaid",
  });

  normalizeMermaidDiagrams();
}

async function highlightCodeIfNeeded(root) {
  const codeBlocks = Array.from(
    root.querySelectorAll(
      'code[class^="language-"], code[class*=" language-"]',
    ),
  );
  if (codeBlocks.length === 0) {
    return;
  }

  const Prism = await loadPrism();
  Prism.highlightAll();
}

function containsMathSyntax(text = "") {
  return /(\$\$[\s\S]+?\$\$)|(\$(?!\s)[^$\n]+\$)|(\\\([\s\S]+?\\\))|(\\\[[\s\S]+?\\\])/.test(
    text,
  );
}

async function loadMermaid() {
  if (!mermaidLoaderPromise) {
    mermaidLoaderPromise = import("mermaid").then((module) => module.default);
  }

  return mermaidLoaderPromise;
}

async function loadPrism() {
  if (!prismLoaderPromise) {
    prismLoaderPromise = (async () => {
      const Prism = (await import("prismjs")).default;
      await Promise.all([
        import("prismjs/components/prism-javascript"),
        import("prismjs/components/prism-typescript"),
        import("prismjs/components/prism-python"),
        import("prismjs/components/prism-java"),
        import("prismjs/components/prism-go"),
        import("prismjs/components/prism-rust"),
        import("prismjs/components/prism-json"),
        import("prismjs/components/prism-css"),
        import("prismjs/components/prism-markup"),
      ]);
      return Prism;
    })();
  }

  return prismLoaderPromise;
}

async function loadMathRenderer() {
  if (!mathRendererPromise) {
    mathRendererPromise = (async () => {
      await import("katex/dist/katex.min.css");
      const module = await import("katex/contrib/auto-render/auto-render.js");
      return module.default;
    })();
  }

  return mathRendererPromise;
}

/**
 * Resolve image metadata before the deck becomes visible.
 */
async function hydrateRenderedImages(root) {
  const images = Array.from(root.querySelectorAll(".image-element img"));

  if (isExportMode) {
    images.forEach((img) => {
      img.loading = "eager";
    });
    await Promise.all(images.map(prepareRenderedImage));
    return;
  }

  const initialSlide = getInitialSlideElement(root);
  const initialImages = initialSlide
    ? Array.from(initialSlide.querySelectorAll(".image-element img"))
    : [];
  const deferredImages = images.filter((img) => !initialImages.includes(img));

  initialImages.forEach((img) => {
    img.loading = "eager";
  });

  deferredImages.forEach((img) => {
    void prepareRenderedImage(img);
  });

  await Promise.all(initialImages.map(prepareRenderedImage));
}

async function prepareRenderedImage(img) {
  await waitForImageReady(img);

  if (!img.naturalWidth || !img.naturalHeight) {
    return;
  }

  img.setAttribute("width", String(img.naturalWidth));
  img.setAttribute("height", String(img.naturalHeight));

  const figure = img.closest(".image-element");
  if (figure) {
    figure.dataset.imageReady = "true";
    figure.style.setProperty("--image-natural-width", `${img.naturalWidth}px`);
    figure.style.setProperty(
      "--image-natural-height",
      `${img.naturalHeight}px`,
    );
  }
}

function waitForImageReady(img) {
  if (img.complete && img.naturalWidth > 0) {
    return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
  }

  return new Promise((resolve) => {
    const finish = () => resolve();
    img.addEventListener("load", finish, { once: true });
    img.addEventListener("error", finish, { once: true });
  });
}

async function prepareExportRendering(reveal, slidesContainer, built) {
  await waitForDocumentFonts();

  if (exportMode === "pdf") {
    await waitForPdfPages(reveal);
  } else {
    await preloadExportSlides(reveal, slidesContainer);
  }

  await waitForAnimationFrames(2);
  markExportReady(reveal, built);
}

async function preloadExportSlides(reveal, root) {
  const totalSlides =
    typeof reveal.getTotalSlides === "function"
      ? reveal.getTotalSlides()
      : root.querySelectorAll(".reveal .slides > section").length;
  const initialState =
    typeof reveal.getState === "function"
      ? reveal.getState()
      : { indexf: 0, indexh: 0, indexv: 0 };
  const images = Array.from(root.querySelectorAll(".image-element img"));

  for (let index = 0; index < totalSlides; index += 1) {
    reveal.slide(index);
    await waitForAnimationFrames(2);
  }

  await Promise.all(images.map(prepareRenderedImage));
  reveal.slide(initialState.indexh, initialState.indexv, initialState.indexf);
}

function waitForDocumentFonts() {
  if (document.fonts?.ready) {
    return document.fonts.ready.catch(() => {});
  }

  return Promise.resolve();
}

async function waitForPdfPages(reveal) {
  const totalSlides =
    typeof reveal.getTotalSlides === "function" ? reveal.getTotalSlides() : 0;
  const deadline = Date.now() + 10000;

  while (Date.now() < deadline) {
    const pdfPageCount = document.querySelectorAll(
      ".reveal .slides .pdf-page",
    ).length;
    if (pdfPageCount >= totalSlides && totalSlides > 0) {
      return;
    }

    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }

  throw new Error("Timed out while preparing Reveal print pages.");
}

function waitForAnimationFrames(count = 1) {
  let remaining = Math.max(count, 1);

  return new Promise((resolve) => {
    const tick = () => {
      remaining -= 1;

      if (remaining <= 0) {
        resolve();
        return;
      }

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  });
}

function markExportReady(reveal, built) {
  const totalSlides =
    typeof reveal.getTotalSlides === "function" ? reveal.getTotalSlides() : 0;

  window.__presentationExport = {
    dimensions: built.dimensions,
    format: exportMode,
    ready: true,
    totalSlides,
  };
  document.body.dataset.exportReady = "true";
}

function getInitialSlideElement(root) {
  const hash = window.location.hash.replace(/^#\/?/, "");
  if (!hash) {
    return root.querySelector("section");
  }

  return (
    root.querySelector(`section#${CSS.escape(decodeURIComponent(hash))}`) ||
    root.querySelector("section")
  );
}

/**
 * Create keyboard shortcuts help button and overlay.
 */
function createShortcutsHelp() {
  if (document.getElementById("shortcuts-btn")) {
    return;
  }

  const shortcuts = [
    { key: ",", description: "Open presentation settings" },
    { key: "P", description: "Toggle presentation mode" },
    {
      key: "S",
      description: canOpenCompanionViews()
        ? "Open presenter view"
        : "Presenter view (URL-backed decks only)",
    },
    { key: "O", description: "Slide overview" },
    { key: "F", description: "Fullscreen" },
    { key: "Esc", description: "Exit overview / pause" },
    { key: "\u2190 \u2192", description: "Navigate slides" },
    { key: "Home", description: "First slide" },
    { key: "End", description: "Last slide" },
    { key: "B / .", description: "Blackout screen" },
    { key: "?", description: "Toggle this help" },
  ];

  const overlay = document.createElement("div");
  overlay.id = "shortcuts-overlay";
  overlay.innerHTML = `
    <div class="shortcuts-panel">
      <h3>Keyboard Shortcuts</h3>
      <dl>
        ${shortcuts
          .map(
            (shortcut) => `
          <div class="shortcut-row">
            <dt><kbd>${shortcut.key}</kbd></dt>
            <dd>${shortcut.description}</dd>
          </div>
        `,
          )
          .join("")}
      </dl>
      <p class="shortcuts-dismiss">Press <kbd>?</kbd> or <kbd>Esc</kbd> to close</p>
    </div>
  `;
  document.body.appendChild(overlay);

  const button = document.createElement("button");
  button.id = "shortcuts-btn";
  button.type = "button";
  button.setAttribute("aria-label", "Keyboard shortcuts");
  button.textContent = "?";
  document.body.appendChild(button);

  function toggle() {
    const visible = overlay.classList.toggle("visible");
    button.classList.toggle("active", visible);
  }

  function hide() {
    overlay.classList.remove("visible");
    button.classList.remove("active");
  }

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    toggle();
  });

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      hide();
    }
  });

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "?" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        event.preventDefault();
        event.stopPropagation();
        toggle();
      } else if (
        event.key === "Escape" &&
        overlay.classList.contains("visible")
      ) {
        hide();
      }
    },
    true,
  );
}

function createSettingsControls(auditControls) {
  if (presentationRole === "audience") {
    return null;
  }

  const existingButton = document.getElementById("settings-btn");
  const existingPanel = document.getElementById("settings-panel");
  if (existingButton && existingPanel) {
    syncSettingsControls();
    return { button: existingButton, panel: existingPanel };
  }

  const button = document.createElement("button");
  button.id = "settings-btn";
  button.type = "button";
  button.setAttribute("aria-label", "Presentation settings");
  button.textContent = "Settings";
  document.body.appendChild(button);

  const panel = document.createElement("div");
  panel.id = "settings-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "false");
  panel.innerHTML = `
    <div class="settings-panel-card">
      <h3>Presentation Settings</h3>
      <div class="settings-section">
        <p class="settings-section-title">Mode</p>
        <label class="settings-choice">
          <input type="radio" name="presentation-mode" value="authoring">
          <span>Authoring</span>
        </label>
        <label class="settings-choice">
          <input type="radio" name="presentation-mode" value="presentation">
          <span>Presentation</span>
        </label>
      </div>
      <div class="settings-section">
        <p class="settings-section-title">Diagnostics</p>
        <label class="settings-toggle">
          <input type="checkbox" id="settings-warnings-toggle">
          <span>Show warnings and fit overlays</span>
        </label>
      </div>
      <div class="settings-section">
        <p class="settings-section-title">Presenter Tools</p>
        <button type="button" data-settings-action="presenter">Open Presenter View</button>
        <button type="button" data-settings-action="audience">Open Audience Screen</button>
        <button type="button" data-settings-action="shortcuts">Keyboard Shortcuts</button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  const closeSettings = () => {
    panel.classList.remove("visible");
    button.classList.remove("active");
  };

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    panel.classList.toggle("visible");
    button.classList.toggle("active", panel.classList.contains("visible"));
    syncSettingsControls();
  });

  panel.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  panel.querySelectorAll('input[name="presentation-mode"]').forEach((input) => {
    input.addEventListener("change", (event) => {
      applyPresentationMode(
        event.target.value === "presentation",
        auditControls,
      );
    });
  });

  panel
    .querySelector("#settings-warnings-toggle")
    .addEventListener("change", (event) => {
      applyWarningsVisibility(event.target.checked, auditControls);
    });

  panel
    .querySelector('[data-settings-action="presenter"]')
    .addEventListener("click", () => {
      closeSettings();
      applyPresentationMode(true, auditControls);
      openPresenterView();
    });

  panel
    .querySelector('[data-settings-action="audience"]')
    .addEventListener("click", () => {
      closeSettings();
      openAudienceScreen();
    });

  panel
    .querySelector('[data-settings-action="shortcuts"]')
    .addEventListener("click", () => {
      closeSettings();
      document.getElementById("shortcuts-btn")?.click();
    });

  document.addEventListener("click", (event) => {
    if (!panel.contains(event.target) && event.target !== button) {
      closeSettings();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key.toLowerCase() === "p" &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      event.preventDefault();
      applyPresentationMode(!presentationModeEnabled, auditControls);
    } else if (
      event.key.toLowerCase() === "s" &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      event.preventDefault();
      closeSettings();
      applyPresentationMode(true, auditControls);
      openPresenterView();
    } else if (
      event.key === "," &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      event.preventDefault();
      panel.classList.toggle("visible");
      button.classList.toggle("active", panel.classList.contains("visible"));
      syncSettingsControls();
    } else if (event.key === "Escape" && panel.classList.contains("visible")) {
      closeSettings();
    }
  });

  syncSettingsControls();
  return { button, panel };
}

function applyPresentationMode(enabled, auditControls, options = {}) {
  const { persist = true } = options;
  presentationModeEnabled = enabled;
  document.body.classList.toggle("presentation-mode", enabled);
  document.body.dataset.presentationMode = enabled
    ? "presentation"
    : "authoring";
  syncSettingsControls();

  if (persist) {
    window.localStorage.setItem(
      PRESENTATION_MODE_STORAGE_KEY,
      enabled ? "presentation" : "authoring",
    );
  }

  if (enabled && auditControls?.overlay) {
    auditControls.overlay.classList.remove("visible");
  }

  publishPresentationState();
  publishAgentReport();

  if (auditControls) {
    updateLayoutAudit(auditControls);
  }
}

function applyWarningsVisibility(enabled, auditControls, options = {}) {
  const { persist = true } = options;
  warningsVisible = enabled;
  document.body.classList.toggle("warnings-hidden", !enabled);
  syncSettingsControls();

  if (persist) {
    window.localStorage.setItem(
      WARNINGS_VISIBILITY_STORAGE_KEY,
      enabled ? "visible" : "hidden",
    );
  }

  if (!enabled && auditControls?.overlay) {
    auditControls.overlay.classList.remove("visible");
  }

  publishPresentationState();
  publishAgentReport();

  if (auditControls) {
    updateLayoutAudit(auditControls);
  }
}

function syncSettingsControls() {
  const button = document.getElementById("settings-btn");
  const panel = document.getElementById("settings-panel");
  if (!button || !panel) {
    return;
  }

  button.classList.toggle("active", panel.classList.contains("visible"));
  button.title = presentationModeEnabled
    ? "Presentation mode is active. Open settings to change delivery options."
    : "Authoring mode is active. Open settings to change delivery options.";

  const modeValue = presentationModeEnabled ? "presentation" : "authoring";
  panel.querySelectorAll('input[name="presentation-mode"]').forEach((input) => {
    input.checked = input.value === modeValue;
  });

  const warningsToggle = panel.querySelector("#settings-warnings-toggle");
  if (warningsToggle) {
    warningsToggle.checked = warningsVisible;
    warningsToggle.disabled = presentationRole === "audience";
  }

  const companionViewsAvailable = canOpenCompanionViews();
  panel
    .querySelectorAll(
      '[data-settings-action="presenter"], [data-settings-action="audience"]',
    )
    .forEach((buttonEl) => {
      buttonEl.disabled = !companionViewsAvailable;
      buttonEl.title = companionViewsAvailable
        ? ""
        : "Companion presenter and audience windows are only available when the deck is loaded from a URL.";
    });
}

function openPresenterView() {
  if (!canOpenCompanionViews()) {
    window.alert(
      "Presenter view is only available for URL-backed decks. Use a served URL or the CLI when you need companion windows.",
    );
    return;
  }
  const presenterUrl = buildCompanionPresentationURL("presenter");
  const presenterWindow = window.open(
    presenterUrl.toString(),
    "agentic-presenter-view",
  );
  if (!presenterWindow) {
    window.alert(
      "Presenter view popup failed to open. Please allow popups and try again.",
    );
  }
}

function openAudienceScreen() {
  if (!canOpenCompanionViews()) {
    window.alert(
      "Audience screen is only available for URL-backed decks. Use a served URL or the CLI when you need companion windows.",
    );
    return;
  }
  const audienceUrl = buildCompanionPresentationURL("audience");
  window.open(audienceUrl.toString(), "agentic-audience-screen");
}

function buildCompanionPresentationURL(role) {
  const url = new URL(window.location.href);
  url.searchParams.set("presentation", presentationPath);
  url.searchParams.set("role", role);
  url.searchParams.set("mode", "presentation");
  url.searchParams.set("warnings", "hidden");

  const currentState = revealInstance?.getState?.();
  if (currentState && Number.isInteger(currentState.indexh)) {
    const parts = [currentState.indexh, currentState.indexv || 0];
    if (Number.isInteger(currentState.indexf) && currentState.indexf >= 0) {
      parts.push(currentState.indexf);
    }
    url.hash = `#/${parts.join("/")}`;
  } else if (window.location.hash) {
    url.hash = window.location.hash;
  }

  return url;
}

function canOpenCompanionViews() {
  return presentationSourceKind === "remote";
}

function renderPresenterView(built, slides) {
  document.body.classList.add("presenter-screen");
  document.body.innerHTML = `
    <div id="presenter-root">
      <section class="presenter-preview-panel">
        <div class="presenter-toolbar">
          <div>
            <p class="presenter-kicker">Presenter View</p>
            <h1>${escapeHtml(built.metadata.title || "Presentation")}</h1>
          </div>
          <div class="presenter-toolbar-meta">
            <div class="presenter-status" data-presenter-slide-status>Slide 1 of ${slides.length}</div>
            <div class="presenter-status" data-presenter-fragment-status>Fragment 0</div>
          </div>
        </div>
        <div class="presenter-preview-frame" style="aspect-ratio: ${built.dimensions.width} / ${built.dimensions.height};">
          <iframe
            src="${escapeHtml(buildCompanionPresentationURL("audience").toString())}"
            title="Live presentation preview"
            data-presenter-preview
          ></iframe>
        </div>
      </section>
      <aside class="presenter-sidebar">
        <section class="presenter-card">
          <p class="presenter-card-label">Current Slide</p>
          <h2 data-presenter-current-title></h2>
        </section>
        <section class="presenter-card">
          <p class="presenter-card-label">Speaker Notes</p>
          <div class="presenter-notes" data-presenter-notes></div>
        </section>
        <section class="presenter-card">
          <p class="presenter-card-label">Up Next</p>
          <div class="presenter-up-next" data-presenter-next></div>
        </section>
      </aside>
    </div>
  `;

  updatePresenterView(getPresentationStateFromHash(window.location.hash));
}

function buildPresenterSlides(presentationData) {
  const slides = presentationData?.presentation?.slides || [];

  return slides.map((slide, index) => ({
    number: index + 1,
    title: derivePresenterSlideTitle(slide, index),
    notesHtml: slide.speakerNotes?.trim()
      ? markdownToHtml(slide.speakerNotes)
      : '<p class="presenter-empty-notes">No speaker notes for this slide.</p>',
  }));
}

function derivePresenterSlideTitle(slide, index) {
  if (slide?.title?.trim()) {
    return slide.title.trim();
  }

  const firstTextElement = slide?.elements?.find(
    (element) => element.type === "text" && typeof element.content === "string",
  );
  const fallbackText = stripMarkdown(firstTextElement?.content || "").trim();
  return fallbackText || `Slide ${index + 1}`;
}

function stripMarkdown(text) {
  return text
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_>#-]/g, " ")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ");
}

function getPresentationStateFromHash(hash) {
  const match = hash.match(/^#\/(\d+)(?:\/(\d+))?(?:\/(\d+))?/);
  if (!match) {
    return { indexh: 0, indexv: 0, indexf: -1 };
  }

  return {
    indexh: Number.parseInt(match[1], 10) || 0,
    indexv: Number.parseInt(match[2] || "0", 10) || 0,
    indexf: Number.parseInt(match[3] || "-1", 10),
  };
}

function updatePresenterView(state = { indexh: 0, indexv: 0, indexf: -1 }) {
  if (presentationRole !== "presenter" || presenterSlides.length === 0) {
    return;
  }

  const slideIndex = Math.min(
    Math.max(state.indexh || 0, 0),
    presenterSlides.length - 1,
  );
  const currentSlide = presenterSlides[slideIndex];
  const nextSlide = presenterSlides[slideIndex + 1] || null;
  const currentTitle = document.querySelector("[data-presenter-current-title]");
  const notes = document.querySelector("[data-presenter-notes]");
  const next = document.querySelector("[data-presenter-next]");
  const slideStatus = document.querySelector("[data-presenter-slide-status]");
  const fragmentStatus = document.querySelector(
    "[data-presenter-fragment-status]",
  );

  if (currentTitle) {
    currentTitle.textContent = currentSlide.title;
  }

  if (notes) {
    notes.innerHTML = currentSlide.notesHtml;
  }

  if (next) {
    next.innerHTML = nextSlide
      ? `<strong>${escapeHtml(nextSlide.title)}</strong><span>Slide ${nextSlide.number}</span>`
      : '<span class="presenter-empty-notes">End of deck</span>';
  }

  if (slideStatus) {
    slideStatus.textContent = `Slide ${currentSlide.number} of ${presenterSlides.length}`;
  }

  if (fragmentStatus) {
    fragmentStatus.textContent =
      state.indexf >= 0 ? `Fragment ${state.indexf + 1}` : "Fragment 0";
  }
}

function setupPresenterSync() {
  if (!window.BroadcastChannel) {
    return;
  }

  const channelName = `agentic-presentation-sync:${presentationPath}`;
  presentationSyncChannel = new BroadcastChannel(channelName);
  presentationSyncChannel.addEventListener("message", (event) => {
    const payload = event.data;
    if (payload?.type !== "state" || !payload.state) {
      return;
    }

    updatePresenterView(payload.state);
  });
}

/**
 * Build the author-facing layout audit UI.
 */
function createLayoutAuditControls() {
  const existingButton = document.getElementById("layout-audit-btn");
  const existingOverlay = document.getElementById("layout-audit-overlay");

  if (existingButton && existingOverlay) {
    return {
      button: existingButton,
      overlay: existingOverlay,
      summary: existingOverlay.querySelector("[data-layout-audit-summary]"),
      list: existingOverlay.querySelector("[data-layout-audit-list]"),
    };
  }

  const button = document.createElement("button");
  button.id = "layout-audit-btn";
  button.type = "button";
  button.hidden = true;
  button.setAttribute("aria-label", "Open presentation audit");
  document.body.appendChild(button);

  const overlay = document.createElement("div");
  overlay.id = "layout-audit-overlay";
  overlay.innerHTML = `
    <div class="layout-audit-panel" role="dialog" aria-modal="true" aria-labelledby="layout-audit-title">
      <h3 id="layout-audit-title">Presentation Audit</h3>
      <p data-layout-audit-summary>No layout issues or author warnings detected.</p>
      <div class="layout-audit-list" data-layout-audit-list></div>
    </div>
  `;
  document.body.appendChild(overlay);

  const summary = overlay.querySelector("[data-layout-audit-summary]");
  const list = overlay.querySelector("[data-layout-audit-list]");

  button.addEventListener("click", () => {
    overlay.classList.add("visible");
  });

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      overlay.classList.remove("visible");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && overlay.classList.contains("visible")) {
      overlay.classList.remove("visible");
    }
  });

  return { button, overlay, summary, list };
}

/**
 * Schedule layout audit work into a single animation frame.
 */
function createLayoutAuditScheduler(revealInstance, controls) {
  let frame = null;

  return function scheduleLayoutAudit() {
    if (frame !== null) {
      cancelAnimationFrame(frame);
    }

    frame = requestAnimationFrame(() => {
      frame = null;
      updateResponsiveMediaLayout();
      revealInstance.layout();
      updateResponsiveMediaLayout();
      updateLayoutAudit(controls);
    });
  };
}

/**
 * Re-run layout checks when Reveal state or media changes.
 */
function bindLayoutAuditEvents(revealInstance, scheduleLayoutAudit) {
  revealInstance.on("ready", scheduleLayoutAudit);
  revealInstance.on("slidechanged", scheduleLayoutAudit);
  revealInstance.on("overviewshown", scheduleLayoutAudit);
  revealInstance.on("overviewhidden", scheduleLayoutAudit);
  window.addEventListener("resize", scheduleLayoutAudit);

  document.querySelectorAll("img").forEach((image) => {
    if (!image.complete) {
      image.addEventListener("load", scheduleLayoutAudit, { once: true });
      image.addEventListener("error", scheduleLayoutAudit, { once: true });
    }
  });

  if (document.fonts?.ready) {
    document.fonts.ready.then(scheduleLayoutAudit).catch(() => {});
  }
}

/**
 * Inspect slides for overflow and dense text blocks.
 */
function updateLayoutAudit(controls) {
  const slides = Array.from(
    document.querySelectorAll(".reveal .slides > section"),
  );
  const allSlideAudits = slides.map((section, index) =>
    inspectSlide(section, index),
  );
  const issues = allSlideAudits
    .filter((result) => result.issues.length > 0 || result.warnings.length > 0)
    .sort((a, b) => {
      if (a.score !== b.score) {
        return a.score - b.score;
      }
      return b.warnings.length - a.warnings.length;
    });

  renderLayoutAudit(controls, issues, allSlideAudits);
}

function inspectSlide(section, slideIndex) {
  const shell = section.querySelector(".slide-shell") || section;
  const issues = [];
  const warnings = presentationWarningsBySlide.get(slideIndex) || [];

  const verticalOverflow = Math.ceil(shell.scrollHeight - shell.clientHeight);
  const horizontalOverflow = Math.ceil(shell.scrollWidth - shell.clientWidth);

  if (verticalOverflow > 2) {
    issues.push(
      createIssue(
        "slide-overflow-vertical",
        `Content exceeds slide height by ${verticalOverflow}px.`,
        34,
      ),
    );
  }

  if (horizontalOverflow > 2) {
    issues.push(
      createIssue(
        "slide-overflow-horizontal",
        `Content exceeds slide width by ${horizontalOverflow}px.`,
        28,
      ),
    );
  }

  issues.push(
    ...findOverflowingContainers(section, ".mermaid-frame", "Mermaid diagram"),
  );
  issues.push(...findOverflowingContainers(section, ".table-element", "Table"));
  issues.push(
    ...findOverflowingContainers(section, ".code-element pre", "Code block"),
  );
  issues.push(...findDenseTextBlocks(section, shell.clientHeight));
  issues.push(...findDenseMediaCompositions(section));

  if (issues.length > 0) {
    section.dataset.slideOverflow = "true";
  } else {
    delete section.dataset.slideOverflow;
  }

  const findings = issues.map((issue) => ({
    ...issue,
    code: issue.kind,
    severity: issue.penalty >= 28 ? "error" : "warning",
    suggestion: getLayoutSuggestion(issue.kind),
  }));
  const score = calculateFitScore(findings);
  const severity = getFitSeverity(score);
  const recommendations = buildRecommendations(findings);

  section.dataset.fitScore = String(score);
  section.dataset.fitSeverity = severity;

  return {
    slideId: section.id || `slide-${slideIndex + 1}`,
    slideIndex,
    number: section.dataset.slideNumber || "?",
    title: section.dataset.slideTitle || section.id || "Untitled slide",
    issues: findings,
    warnings,
    score,
    severity,
    overflow: findings.some((issue) => issue.code.startsWith("slide-overflow")),
    recommendations,
  };
}

function findOverflowingContainers(section, selector, label) {
  const issues = [];

  section.querySelectorAll(selector).forEach((container) => {
    const overflowY = Math.ceil(
      container.scrollHeight - container.clientHeight,
    );
    const overflowX = Math.ceil(container.scrollWidth - container.clientWidth);
    const toleranceY = getOverflowTolerance(container.clientHeight);
    const toleranceX = getOverflowTolerance(container.clientWidth);

    if (overflowY > toleranceY || overflowX > toleranceX) {
      const parts = [];
      if (overflowY > toleranceY) {
        parts.push(`${overflowY}px vertically`);
      }
      if (overflowX > toleranceX) {
        parts.push(`${overflowX}px horizontally`);
      }
      issues.push(
        createIssue(
          `${toIssueKey(label)}-overflow`,
          `${label} exceeds its frame by ${parts.join(" and ")}.`,
          18,
        ),
      );
    }
  });

  return issues;
}

function findDenseTextBlocks(section, slideHeight) {
  const issues = [];
  const blocks = section.querySelectorAll(
    ".text-element, .bullet-list, .callout-content",
  );

  blocks.forEach((block, index) => {
    const lineCount = estimateLineCount(block);
    const height = block.getBoundingClientRect().height;

    if (lineCount >= 12 || height > slideHeight * 0.45) {
      issues.push(
        createIssue(
          "dense-text",
          `Text block ${index + 1} is dense (${lineCount} lines).`,
          12,
        ),
      );
    }
  });

  return issues.slice(0, 2);
}

function findDenseMediaCompositions(section) {
  const issues = [];
  const groups = section.querySelectorAll(
    ".slide-content, .column-left, .column-right",
  );

  groups.forEach((group, index) => {
    const children = Array.from(group.children);
    const mediaBlocks = children.filter(
      (child) =>
        child.classList.contains("image-element") ||
        child.classList.contains("mermaid-element") ||
        child.classList.contains("code-element") ||
        child.classList.contains("table-element"),
    );

    if (mediaBlocks.length === 0) {
      return;
    }

    const totalHeight = children.reduce(
      (sum, child) => sum + child.getBoundingClientRect().height,
      0,
    );
    const mediaHeight = mediaBlocks.reduce(
      (sum, child) => sum + child.getBoundingClientRect().height,
      0,
    );
    const groupHeight =
      group.clientHeight || group.getBoundingClientRect().height;

    if (mediaBlocks.length >= 2 && mediaHeight > groupHeight * 0.68) {
      issues.push(
        createIssue(
          "dense-media",
          `Content area ${index + 1} is visually dense: multiple media blocks dominate the slide.`,
          24,
        ),
      );
    } else if (children.length >= 5 && totalHeight > groupHeight * 0.9) {
      issues.push(
        createIssue(
          "dense-media",
          `Content area ${index + 1} is visually dense and may read as crowded.`,
          18,
        ),
      );
    }
  });

  return issues.slice(0, 1);
}

function estimateLineCount(element) {
  const computed = window.getComputedStyle(element);
  const lineHeight = Number.parseFloat(computed.lineHeight);

  if (!Number.isFinite(lineHeight) || lineHeight <= 0) {
    return 0;
  }

  return Math.round(element.getBoundingClientRect().height / lineHeight);
}

function getOverflowTolerance(size) {
  return Math.max(8, Math.round(size * 0.05));
}

function updateResponsiveMediaLayout() {
  document
    .querySelectorAll(".image-element")
    .forEach(updateResponsiveImageLayout);
  document
    .querySelectorAll(".mermaid-element, .code-element, .table-element")
    .forEach(updateResponsiveMediaBudget);
}

function updateResponsiveImageLayout(figure) {
  const frame = figure.querySelector(".image-frame");
  const img = figure.querySelector("img");

  if (!frame || !img || !img.naturalWidth || !img.naturalHeight) {
    return;
  }

  const { width: availableWidth, height: availableHeight } =
    measureAvailableSpace(figure);
  const requestedWidth = parseRequestedSize(
    frame.dataset.requestedWidth,
    availableWidth,
  );
  const requestedHeight = parseRequestedSize(
    frame.dataset.requestedHeight,
    availableHeight,
  );

  let targetWidth = requestedWidth ?? img.naturalWidth;
  let targetHeight = requestedHeight ?? img.naturalHeight;

  if (requestedWidth !== null && requestedHeight === null) {
    targetHeight = img.naturalHeight * (targetWidth / img.naturalWidth);
  } else if (requestedWidth === null && requestedHeight !== null) {
    targetWidth = img.naturalWidth * (targetHeight / img.naturalHeight);
  }

  const scale = Math.min(
    1,
    availableWidth / targetWidth,
    availableHeight / targetHeight,
  );

  const displayWidth = Math.max(1, Math.round(targetWidth * scale));
  const displayHeight = Math.max(1, Math.round(targetHeight * scale));

  frame.style.width = `${displayWidth}px`;
  frame.style.height = `${displayHeight}px`;
  frame.style.setProperty("--image-frame-max-height", `${displayHeight}px`);

  img.style.width = `${displayWidth}px`;
  img.style.height = `${displayHeight}px`;
}

function updateResponsiveMediaBudget(element) {
  const target = element.classList.contains("mermaid-element")
    ? element.querySelector(".mermaid-frame")
    : element.matches(".code-element, .table-element")
      ? element
      : null;

  if (!target) {
    return;
  }

  const { height } = measureAvailableSpace(element);
  target.style.setProperty("--media-frame-max-height", `${height}px`);
  target.style.setProperty(
    "--media-svg-max-height",
    `${Math.max(160, height - 24)}px`,
  );
}

function measureAvailableSpace(element) {
  const parent = element.parentElement;

  if (!parent) {
    return { width: 0, height: 0 };
  }

  const styles = window.getComputedStyle(parent);
  const gap = Number.parseFloat(styles.rowGap || styles.gap) || 0;
  const siblings = Array.from(parent.children).filter(
    (child) => child !== element,
  );
  const occupiedHeight = siblings.reduce(
    (sum, child) => sum + child.getBoundingClientRect().height,
    0,
  );

  return {
    width: Math.max(160, parent.clientWidth),
    height: Math.max(
      180,
      parent.clientHeight - occupiedHeight - gap * siblings.length,
    ),
  };
}

function parseRequestedSize(value, reference) {
  if (!value || value === "auto") {
    return null;
  }

  if (value.endsWith("%")) {
    const percent = Number.parseFloat(value);
    return Number.isFinite(percent) ? reference * (percent / 100) : null;
  }

  if (value.endsWith("px")) {
    const pixels = Number.parseFloat(value);
    return Number.isFinite(pixels) ? pixels : null;
  }

  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function renderLayoutAudit(controls, issues, allSlideAudits) {
  const { button, summary, list } = controls;

  if (issues.length === 0) {
    button.hidden = true;
    button.textContent = "Presentation Audit";
    summary.textContent = "No layout issues or author warnings detected.";
    list.innerHTML = "";
    publishPresentationAudit(allSlideAudits);
    return;
  }

  const issueCount = issues.filter((issue) => issue.issues.length > 0).length;
  const warningCount = issues.filter(
    (issue) => issue.warnings.length > 0,
  ).length;
  const worstScore =
    issueCount > 0 ? Math.min(...issues.map((issue) => issue.score)) : 100;
  button.hidden =
    presentationModeEnabled ||
    !warningsVisible ||
    presentationRole === "audience";
  button.textContent = `${issues.length} Slide${issues.length === 1 ? " Needs" : "s Need"} Review`;
  summary.textContent = buildAuditSummary(issueCount, warningCount, worstScore);

  list.innerHTML = issues
    .map(
      (issue) => `
    <div class="layout-audit-item">
      <strong>Slide ${escapeHtml(issue.number)}: ${escapeHtml(issue.title)}</strong>
      <div class="layout-audit-meta">
        <span class="layout-audit-score layout-audit-score-${issue.severity}">Fit ${issue.score}</span>
        <span class="layout-audit-severity">${escapeHtml(issue.severity)}</span>
        ${issue.warnings.length > 0 ? `<span class="layout-audit-warning-badge">${issue.warnings.length} warning${issue.warnings.length === 1 ? "" : "s"}</span>` : ""}
      </div>
      ${
        issue.recommendations.length > 0
          ? `
        <p class="layout-audit-recommendation">${escapeHtml(issue.recommendations[0])}</p>
      `
          : ""
      }
      ${
        issue.issues.length > 0
          ? `
        <p class="layout-audit-section-title">Layout findings</p>
        ${renderAuditFindings(issue.issues)}
      `
          : ""
      }
      ${
        issue.warnings.length > 0
          ? `
        <p class="layout-audit-section-title">Author warnings</p>
        ${renderAuditFindings(issue.warnings)}
      `
          : ""
      }
    </div>
  `,
    )
    .join("");

  publishPresentationAudit(allSlideAudits);
}

function buildAuditSummary(issueCount, warningCount, worstScore) {
  if (issueCount === 0) {
    return `${warningCount} slide${warningCount === 1 ? " has" : "s have"} author warnings. No blocking layout issues detected.`;
  }

  const issueText = `${issueCount} slide${issueCount === 1 ? " needs" : " need"} layout changes`;
  const warningText =
    warningCount > 0
      ? ` ${warningCount} slide${warningCount === 1 ? " has" : "s have"} author warnings.`
      : "";

  return `${issueText}.${warningText} Worst fit score: ${worstScore}/100.`;
}

function getLayoutSuggestion(code) {
  const suggestions = {
    "slide-overflow-vertical":
      "Reduce total content height or move one block to a new slide.",
    "slide-overflow-horizontal":
      "Narrow wide content, shorten long strings, or switch to a more suitable layout.",
    "mermaid-diagram-overflow":
      "Simplify the Mermaid diagram or dedicate a full slide to it.",
    "table-overflow":
      "Reduce the number of rows or columns, or summarize the table.",
    "code-block-overflow":
      "Trim the code sample or move details to an appendix slide.",
    "dense-text":
      "Shorten the copy, reduce bullets, or split the narrative across slides.",
    "dense-media":
      "Reduce one media block or give the largest visual its own slide.",
  };

  return (
    suggestions[code] ||
    "Adjust this slide so the content fits more comfortably."
  );
}

function renderAuditFindings(findings) {
  return `<ul>
    ${findings
      .map(
        (finding) => `
      <li class="layout-audit-finding">
        <span class="layout-audit-code">${escapeHtml(finding.code)}</span>
        <span class="layout-audit-message">${escapeHtml(finding.message)}</span>
        ${finding.suggestion ? `<span class="layout-audit-hint">${escapeHtml(finding.suggestion)}</span>` : ""}
      </li>
    `,
      )
      .join("")}
  </ul>`;
}

function publishPresentationValidation(result) {
  latestPresentationValidation = {
    presentationPath,
    generatedAt: new Date().toISOString(),
    valid: result.valid,
    summary: {
      errorCount: result.errors?.length || 0,
      warningCount: result.warnings.length,
    },
    errors: result.errors || [],
    warnings: result.warnings,
  };

  window.__presentationValidation = latestPresentationValidation;
  publishPresentationState();
  publishAgentReport();
}

function publishPresentationAudit(issues) {
  const summary = {
    slideCount: issues.length,
    layoutIssueCount: issues.filter((issue) => issue.issues.length > 0).length,
    warningSlideCount: issues.filter((issue) => issue.warnings.length > 0)
      .length,
    worstFitScore:
      issues.length > 0 ? Math.min(...issues.map((issue) => issue.score)) : 100,
  };

  latestPresentationAudit = {
    presentationPath,
    generatedAt: new Date().toISOString(),
    summary,
    slides: issues.map((issue) => ({
      slideId: issue.slideId,
      slideIndex: issue.slideIndex,
      slideNumber: issue.number,
      title: issue.title,
      fitScore: issue.score,
      fitSeverity: issue.severity,
      overflow: issue.overflow,
      recommendations: issue.recommendations,
      layoutFindings: issue.issues,
      authorWarnings: issue.warnings,
    })),
  };

  window.__presentationAudit = latestPresentationAudit;
  publishPresentationState();
  publishAgentReport();
  window.dispatchEvent(
    new CustomEvent("presentation-audit-updated", {
      detail: latestPresentationAudit,
    }),
  );
}

function publishAgentReport() {
  window.__presentationAgentReport = {
    presentationPath,
    role: presentationRole,
    mode: window.__presentationMode,
    validation: latestPresentationValidation,
    audit: latestPresentationAudit,
  };
}

function publishPresentationState() {
  window.__presentationMode = {
    enabled: presentationModeEnabled,
    mode: presentationModeEnabled ? "presentation" : "authoring",
    warningsVisible,
  };
}

function getInitialPresentationMode() {
  if (presentationRole === "audience" || presentationRole === "presenter") {
    return true;
  }

  const mode = params.get("mode");
  if (mode === "present" || mode === "presentation") {
    return true;
  }
  if (mode === "author" || mode === "authoring") {
    return false;
  }

  return (
    window.localStorage.getItem(PRESENTATION_MODE_STORAGE_KEY) ===
    "presentation"
  );
}

function getInitialWarningsVisibility() {
  if (presentationRole === "audience" || presentationRole === "presenter") {
    return false;
  }

  const warnings = params.get("warnings");
  if (warnings === "off" || warnings === "hidden") {
    return false;
  }
  if (warnings === "on" || warnings === "visible") {
    return true;
  }

  const stored = window.localStorage.getItem(WARNINGS_VISIBILITY_STORAGE_KEY);
  return stored !== "hidden";
}

function getPresentationRole() {
  const role = params.get("role");
  if (role === "audience") {
    return "audience";
  }
  if (role === "presenter") {
    return "presenter";
  }
  return "controller";
}

function setupPresentationSync(reveal) {
  if (!window.BroadcastChannel) {
    return;
  }

  const channelName = `agentic-presentation-sync:${presentationPath}`;
  presentationSyncChannel = new BroadcastChannel(channelName);

  if (presentationRole === "audience") {
    presentationSyncChannel.addEventListener("message", (event) => {
      const payload = event.data;
      if (payload?.type !== "state" || !payload.state) {
        return;
      }

      if (typeof reveal.setState === "function") {
        reveal.setState(payload.state);
        return;
      }

      reveal.slide(
        payload.state.indexh,
        payload.state.indexv,
        payload.state.indexf,
      );
    });
    return;
  }

  const broadcastState = () => {
    presentationSyncChannel.postMessage({
      type: "state",
      state: reveal.getState(),
    });
  };

  reveal.on("ready", broadcastState);
  reveal.on("slidechanged", broadcastState);
  reveal.on("fragmentshown", broadcastState);
  reveal.on("fragmenthidden", broadcastState);
  broadcastState();
}

function indexWarningsBySlide(warnings) {
  return warnings.reduce((map, warning) => {
    const match = warning.path.match(/\/presentation\/slides\/(\d+)/);
    if (!match) {
      return map;
    }

    const slideIndex = Number.parseInt(match[1], 10);
    const existing = map.get(slideIndex) || [];
    existing.push(warning);
    map.set(slideIndex, existing);
    return map;
  }, new Map());
}

function escapeHtml(text) {
  if (!text) {
    return "";
  }

  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };

  return text.replace(/[&<>"']/g, (match) => map[match]);
}

function normalizeExportMode(value) {
  if (value === "pdf" || value === "pptx") {
    return value;
  }

  return null;
}

// Load presentation when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApplication);
} else {
  initializeApplication();
}

window.addEventListener("beforeunload", revokeLocalDeckObjectUrls);

function initializeApplication() {
  if (presentationPath) {
    loadAndRenderPresentation();
    return;
  }

  renderLocalDeckLauncher();
}
