import { existsSync } from "node:fs";
import { readFile, mkdir } from "node:fs/promises";
import { dirname, resolve as resolvePath, basename } from "node:path";
import { JSDOM } from "jsdom";
import PptxGenJS from "pptxgenjs";
import { markdownToHtml } from "../utils/markdown.js";

/**
 * Native PPTX exporter.
 *
 * Maps the presentation JSON schema directly to PowerPoint objects
 * (text runs, bullets, shapes, tables, images) instead of embedding
 * slide screenshots. Mermaid diagrams are rendered to PNG via a caller-
 * provided renderer when present; otherwise they fall back to a code-
 * style placeholder.
 */

const FONT_SIZE_MAP = {
  xxl: 54,
  xl: 40,
  large: 28,
  medium: 20,
  small: 14,
};

const PTS_PER_INCH = 72;
const MIN_FONT_SIZE = 8;

const DEFAULT_TEXT_COLOR = "1E293B";

const CALLOUT_STYLES = {
  info: { bg: "DBEAFE", border: "2563EB", title: "1E40AF", text: "1E293B" },
  success: { bg: "DCFCE7", border: "16A34A", title: "166534", text: "14532D" },
  warning: { bg: "FEF3C7", border: "D97706", title: "92400E", text: "451A03" },
  danger: { bg: "FEE2E2", border: "DC2626", title: "991B1B", text: "450A0A" },
  note: { bg: "F1F5F9", border: "64748B", title: "334155", text: "1E293B" },
};

const TRANSITION_MAP = {
  none: null,
  slide: "push",
  fade: "fade",
  convex: "cover",
  concave: "uncover",
  zoom: "zoom",
};

export async function exportNativePptx({
  presentationPath,
  outputPath,
  mermaidRenderer = null,
}) {
  const raw = await readFile(presentationPath, "utf-8");
  const data = JSON.parse(raw);
  const presentation = data.presentation;
  const meta = presentation.metadata || {};
  const is4x3 = meta.aspectRatio === "4:3";
  const slideDims = is4x3
    ? { w: 10, h: 7.5 }
    : { w: 13.333, h: 7.5 };

  const pptx = new PptxGenJS();
  pptx.layout = is4x3 ? "LAYOUT_4x3" : "LAYOUT_WIDE";
  pptx.author = meta.author || "";
  pptx.company = "Casual-Vibers";
  pptx.subject = meta.description || "";
  pptx.title = meta.title || basename(outputPath);

  const baseDir = dirname(resolvePath(presentationPath));
  const ctx = { baseDir, mermaidRenderer, dims: slideDims };

  for (let slideIndex = 0; slideIndex < presentation.slides.length; slideIndex += 1) {
    const slide = presentation.slides[slideIndex];
    const pptxSlide = pptx.addSlide();

    applyBackground(pptxSlide, slide.background);
    applyTransition(pptxSlide, slide.transition);

    await renderSlideElements(pptxSlide, slide, slideIndex, ctx);

    const notes = slide.speakerNotes ? extractSpeakerNotesText(slide.speakerNotes) : "";
    if (notes) {
      pptxSlide.addNotes(notes);
    }
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await pptx.writeFile({ fileName: outputPath });
}

function applyBackground(slide, background) {
  if (!background) return;
  if (typeof background === "string") {
    const hex = normalizeHex(background);
    if (hex) {
      slide.background = { color: hex };
    }
  }
}

function applyTransition(slide, transitionKey) {
  if (!transitionKey) return;
  const mapped = TRANSITION_MAP[transitionKey];
  if (!mapped) return;
  // pptxgenjs exposes slide.transition in recent versions; ignore if unsupported.
  try {
    slide.transition = { type: mapped, speed: "medium" };
  } catch (error) {
    console.warn(`Slide transition skipped (${transitionKey}): ${error.message}`);
  }
}

async function renderSlideElements(slide, slideData, slideIndex, ctx) {
  const elements = slideData.elements || [];
  const grouped = groupElementsByArea(elements);
  const layoutRects = computeAreaRects(slideData.layout, grouped, ctx.dims);

  for (const [area, elems] of Object.entries(grouped)) {
    const areaRect = layoutRects[area] || layoutRects.content || null;
    if (!areaRect) continue;

    const distributed = distributeRects(areaRect, elems);
    for (let i = 0; i < elems.length; i += 1) {
      const element = elems[i];
      const rect = distributed[i];
      // eslint-disable-next-line no-await-in-loop
      await addElement(slide, element, rect, { ...ctx, slideIndex });
    }
  }
}

function groupElementsByArea(elements) {
  const grouped = {};
  for (const element of elements) {
    const area = element.position?.area || "content";
    if (!grouped[area]) grouped[area] = [];
    grouped[area].push(element);
  }
  for (const area of Object.keys(grouped)) {
    grouped[area].sort(
      (a, b) => (a.position?.order || 0) - (b.position?.order || 0),
    );
  }
  return grouped;
}

function computeAreaRects(layout, grouped, dims) {
  const { w, h } = dims;
  const pad = 0.5;
  const headerH = 1.1;
  const footerH = 0.5;

  const hasHeader = Boolean(grouped.header?.length);
  const hasFooter = Boolean(grouped.footer?.length);

  const contentY = hasHeader ? headerH + 0.2 : pad;
  const contentBottom = h - (hasFooter ? footerH + 0.2 : pad);
  const contentH = Math.max(contentBottom - contentY, 1);

  const base = {
    header: { x: pad, y: pad / 2, w: w - 2 * pad, h: headerH },
    footer: { x: pad, y: h - footerH - pad / 2, w: w - 2 * pad, h: footerH },
  };

  if (layout === "title") {
    base.center = { x: pad, y: pad, w: w - 2 * pad, h: h - 2 * pad };
  } else if (layout === "two-column") {
    const columnW = (w - 2 * pad - 0.4) / 2;
    base.left = { x: pad, y: contentY, w: columnW, h: contentH };
    base.right = {
      x: pad + columnW + 0.4,
      y: contentY,
      w: columnW,
      h: contentH,
    };
    base.content = { x: pad, y: contentY, w: w - 2 * pad, h: contentH };
  } else if (layout === "blank") {
    base.content = { x: pad, y: pad, w: w - 2 * pad, h: h - 2 * pad };
  } else {
    // single-column (default)
    base.content = { x: pad, y: contentY, w: w - 2 * pad, h: contentH };
    base.center = { x: pad, y: contentY, w: w - 2 * pad, h: contentH };
  }

  return base;
}

function distributeRects(areaRect, elements) {
  if (elements.length === 0) return [];
  const weights = elements.map(elementHeightWeight);
  const total = weights.reduce((sum, n) => sum + n, 0) || 1;
  let y = areaRect.y;
  return elements.map((_, i) => {
    const h = (areaRect.h * weights[i]) / total;
    const rect = { x: areaRect.x, y, w: areaRect.w, h };
    y += h;
    return rect;
  });
}

function elementHeightWeight(element) {
  switch (element.type) {
    case "text": {
      const size = element.style?.fontSize || "medium";
      if (size === "xxl") return 2.5;
      if (size === "xl") return 2;
      if (size === "large") return 1.4;
      if (size === "small") return 0.9;
      return 1.2;
    }
    case "bullets":
      return Math.max(2, (element.items?.length || 1) * 0.7);
    case "image":
    case "mermaid":
      return 5;
    case "code":
      return 3;
    case "table":
      return Math.max(2, (element.rows?.length || 1) + 1);
    case "callout":
      return 2;
    default:
      return 1;
  }
}

function fitFontSize(idealPt, rectHeightInches, lineCount) {
  const availablePts = rectHeightInches * PTS_PER_INCH;
  const lineSpacing = 1.35;
  const padding = 0.15 * PTS_PER_INCH;
  const maxForLines = (availablePts - padding) / (lineCount * lineSpacing);
  return Math.max(MIN_FONT_SIZE, Math.min(idealPt, Math.round(maxForLines)));
}

function countBulletLines(items) {
  let count = 0;
  for (const raw of items) {
    count += 1;
    const item = typeof raw === "string" ? { children: [] } : raw;
    if (item.children?.length) {
      count += countBulletLines(item.children);
    }
  }
  return count;
}

function countTextLines(markdown) {
  if (!markdown) return 1;
  const explicit = (markdown.match(/\n/g) || []).length + 1;
  return Math.max(1, explicit);
}

async function addElement(slide, element, rect, ctx) {
  switch (element.type) {
    case "text":
      addTextElement(slide, element, rect);
      break;
    case "bullets":
      addBulletsElement(slide, element, rect);
      break;
    case "image":
      addImageElement(slide, element, rect, ctx.baseDir);
      break;
    case "callout":
      addCalloutElement(slide, element, rect);
      break;
    case "code":
      addCodeElement(slide, element, rect);
      break;
    case "table":
      addTableElement(slide, element, rect);
      break;
    case "mermaid":
      await addMermaidElement(slide, element, rect, ctx);
      break;
    default:
      break;
  }
}

function addTextElement(slide, element, rect) {
  const runs = markdownToTextRuns(element.content || "");
  if (runs.length === 0) return;

  const style = element.style || {};
  const idealSize = FONT_SIZE_MAP[style.fontSize] || FONT_SIZE_MAP.medium;
  const lineCount = countTextLines(element.content);
  const fontSize = fitFontSize(idealSize, rect.h, lineCount);
  const align = style.alignment || "left";
  const color = normalizeHex(style.color) || DEFAULT_TEXT_COLOR;
  const bold = style.fontWeight === "bold";

  applyBaseOptions(runs, { fontSize, color, bold });

  slide.addText(runs, {
    x: rect.x,
    y: rect.y,
    w: rect.w,
    h: rect.h,
    align,
    valign: "top",
    fontSize,
    color,
    bold,
    shrinkText: true,
  });
}

function addBulletsElement(slide, element, rect) {
  const style = element.style || {};
  const idealSize = FONT_SIZE_MAP[style.fontSize] || FONT_SIZE_MAP.medium;
  const lineCount = countBulletLines(element.items || []);
  const fontSize = fitFontSize(idealSize, rect.h, lineCount);
  const color = normalizeHex(style.color) || DEFAULT_TEXT_COLOR;
  const bulletStyle = element.bulletStyle === "number"
    ? { type: "number" }
    : true;

  const paragraphs = flattenBullets(element.items || [], 0, bulletStyle, fontSize, color);
  if (paragraphs.length === 0) return;

  const paraSpace = Math.max(2, Math.min(6, Math.round(fontSize * 0.3)));
  slide.addText(paragraphs, {
    x: rect.x,
    y: rect.y,
    w: rect.w,
    h: rect.h,
    valign: "top",
    fontSize,
    color,
    paraSpaceAfter: paraSpace,
    shrinkText: true,
  });
}

function flattenBullets(items, indentLevel, bulletStyle, fontSize, color) {
  const paragraphs = [];
  for (const raw of items) {
    const item = typeof raw === "string"
      ? { text: raw, children: [] }
      : raw;
    const runs = markdownToTextRuns(item.text || "");
    if (runs.length === 0) {
      runs.push({ text: "", options: {} });
    }
    runs[0].options = {
      ...runs[0].options,
      bullet: bulletStyle,
      indentLevel,
      fontSize,
      color,
    };
    runs[runs.length - 1].options = {
      ...runs[runs.length - 1].options,
      breakLine: true,
    };
    paragraphs.push(...runs);

    const children = item.children || [];
    if (children.length > 0) {
      paragraphs.push(
        ...flattenBullets(children, indentLevel + 1, bulletStyle, fontSize, color),
      );
    }
  }
  return paragraphs;
}

function addImageElement(slide, element, rect, baseDir) {
  if (!element.src) return;
  const imagePath = resolveAssetPath(element.src, baseDir);
  const imageH = rect.h - (element.caption ? 0.4 : 0);

  if (!isRemoteUrl(imagePath) && !existsSync(imagePath)) {
    console.warn(`Warning: image not found "${element.src}" (resolved to ${imagePath})`);
    renderMissingImagePlaceholder(slide, element, rect, imageH);
  } else {
    try {
      slide.addImage({
        path: imagePath,
        x: rect.x,
        y: rect.y,
        w: rect.w,
        h: imageH,
        sizing: { type: "contain", w: rect.w, h: imageH },
      });
    } catch (error) {
      console.warn(`Warning: failed to add image "${element.src}": ${error.message}`);
      renderMissingImagePlaceholder(slide, element, rect, imageH);
    }
  }

  if (element.caption) {
    const captionRuns = markdownToTextRuns(element.caption);
    applyBaseOptions(captionRuns, { fontSize: 14, italic: true, color: "64748B" });
    slide.addText(captionRuns, {
      x: rect.x,
      y: rect.y + rect.h - 0.4,
      w: rect.w,
      h: 0.4,
      align: "center",
      valign: "top",
      fontSize: 14,
      italic: true,
      color: "64748B",
    });
  }
}

function renderMissingImagePlaceholder(slide, element, rect, imageH) {
  slide.addShape("rect", {
    x: rect.x,
    y: rect.y,
    w: rect.w,
    h: imageH,
    fill: { color: "F1F5F9" },
    line: { color: "CBD5E1", width: 1, dashType: "dash" },
  });
  slide.addText(`[image missing: ${element.src}]`, {
    x: rect.x,
    y: rect.y,
    w: rect.w,
    h: imageH,
    align: "center",
    valign: "middle",
    fontSize: 14,
    italic: true,
    color: "94A3B8",
  });
}

function addCalloutElement(slide, element, rect) {
  const type = element.calloutType || "info";
  const palette = CALLOUT_STYLES[type] || CALLOUT_STYLES.info;

  slide.addShape("roundRect", {
    x: rect.x,
    y: rect.y,
    w: rect.w,
    h: rect.h,
    fill: { color: palette.bg },
    line: { color: palette.border, width: 2 },
    rectRadius: 0.1,
  });

  const innerH = rect.h - 0.4;
  const titleLines = element.title ? 1 : 0;
  const contentLines = countTextLines(element.content);
  const totalLines = titleLines + contentLines;
  const titleSize = fitFontSize(20, innerH, totalLines);
  const bodySize = fitFontSize(18, innerH, totalLines);

  const runs = [];
  if (element.title) {
    runs.push({
      text: element.title,
      options: {
        bold: true,
        fontSize: titleSize,
        color: palette.title,
        breakLine: true,
      },
    });
  }
  const contentRuns = markdownToTextRuns(element.content || "");
  applyBaseOptions(contentRuns, { fontSize: bodySize, color: palette.text });
  runs.push(...contentRuns);

  if (runs.length === 0) return;

  slide.addText(runs, {
    x: rect.x + 0.25,
    y: rect.y + 0.2,
    w: rect.w - 0.5,
    h: innerH,
    valign: "top",
    shrinkText: true,
  });
}

function addCodeElement(slide, element, rect) {
  const code = element.code || "";
  const caption = element.caption || "";
  const captionH = caption ? 0.4 : 0;
  const codeH = rect.h - captionH;
  const codeLines = (code.match(/\n/g) || []).length + 1;
  const fontSize = fitFontSize(14, codeH - 0.2, codeLines);

  if (caption) {
    const captionSize = fitFontSize(14, captionH, 1);
    slide.addText(caption, {
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: captionH,
      fontSize: captionSize,
      italic: true,
      color: "64748B",
    });
  }

  slide.addShape("rect", {
    x: rect.x,
    y: rect.y + captionH,
    w: rect.w,
    h: codeH,
    fill: { color: "F1F5F9" },
    line: { color: "CBD5E1", width: 1 },
  });

  slide.addText(code, {
    x: rect.x + 0.15,
    y: rect.y + captionH + 0.1,
    w: rect.w - 0.3,
    h: codeH - 0.2,
    fontFace: "Courier New",
    fontSize,
    color: "0F172A",
    valign: "top",
    paraSpaceAfter: 0,
    shrinkText: true,
  });
}

function addTableElement(slide, element, rect) {
  const headers = element.headers || [];
  const rows = element.rows || [];
  if (headers.length === 0 && rows.length === 0) return;

  const headerRow = headers.map((cell) => ({
    text: String(cell),
    options: {
      bold: true,
      color: "FFFFFF",
      fill: { color: "1E293B" },
      align: "left",
      fontSize: 14,
    },
  }));
  const bodyRows = rows.map((row, rowIdx) =>
    row.map((cell) => ({
      text: String(cell),
      options: {
        fontSize: 14,
        color: DEFAULT_TEXT_COLOR,
        fill: { color: rowIdx % 2 === 0 ? "FFFFFF" : "F8FAFC" },
        align: "left",
      },
    })),
  );

  const tableData = headerRow.length > 0 ? [headerRow, ...bodyRows] : bodyRows;
  const captionH = element.caption ? 0.4 : 0;

  if (element.caption) {
    slide.addText(element.caption, {
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: captionH,
      fontSize: 14,
      italic: true,
      color: "64748B",
    });
  }

  slide.addTable(tableData, {
    x: rect.x,
    y: rect.y + captionH,
    w: rect.w,
    h: rect.h - captionH,
    border: { pt: 1, color: "E2E8F0" },
    autoPage: false,
  });
}

async function addMermaidElement(slide, element, rect, ctx) {
  if (ctx.mermaidRenderer) {
    try {
      const pngPath = await ctx.mermaidRenderer({
        diagram: element.diagram,
        theme: element.theme || "default",
        slideIndex: ctx.slideIndex,
      });
      if (pngPath) {
        slide.addImage({
          path: pngPath,
          x: rect.x,
          y: rect.y,
          w: rect.w,
          h: rect.h,
          sizing: { type: "contain", w: rect.w, h: rect.h },
        });
        return;
      }
    } catch (error) {
      console.warn(`Mermaid render failed for slide ${ctx.slideIndex + 1}: ${error.message}`);
    }
  }

  slide.addShape("rect", {
    x: rect.x,
    y: rect.y,
    w: rect.w,
    h: rect.h,
    fill: { color: "F8FAFC" },
    line: { color: "CBD5E1", width: 1 },
  });
  slide.addText(element.diagram || "[mermaid diagram]", {
    x: rect.x + 0.15,
    y: rect.y + 0.15,
    w: rect.w - 0.3,
    h: rect.h - 0.3,
    fontFace: "Courier New",
    fontSize: 12,
    color: "475569",
    valign: "top",
  });
}

function markdownToTextRuns(markdown) {
  const source = (markdown || "").trim();
  if (!source) return [];

  const html = markdownToHtml(source).trim();
  const dom = new JSDOM(`<div id="root">${html}</div>`);
  const root = dom.window.document.getElementById("root");
  const runs = [];
  const blockTags = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "div", "blockquote"]);

  const walk = (node, state) => {
    const children = Array.from(node.childNodes);
    for (let i = 0; i < children.length; i += 1) {
      const child = children[i];
      const lastChild = i === children.length - 1;

      if (child.nodeType === 3) {
        const text = child.textContent;
        if (!text) continue;
        if (node === root && !text.trim()) continue;
        runs.push({
          text,
          options: {
            bold: state.bold,
            italic: state.italic,
            underline: state.underline ? { style: "sng" } : undefined,
            fontFace: state.code ? "Courier New" : undefined,
          },
        });
      } else if (child.nodeType === 1) {
        const tag = child.tagName.toLowerCase();
        const nextState = { ...state };
        if (tag === "strong" || tag === "b") nextState.bold = true;
        if (/^h[1-6]$/.test(tag)) nextState.bold = true;
        if (tag === "em" || tag === "i") nextState.italic = true;
        if (tag === "u") nextState.underline = true;
        if (tag === "code") nextState.code = true;
        if (tag === "br") {
          const lastRun = runs[runs.length - 1];
          if (lastRun) {
            lastRun.options = { ...lastRun.options, breakLine: true };
          }
          continue;
        }
        walk(child, nextState);
        if (blockTags.has(tag) && !lastChild) {
          const lastRun = runs[runs.length - 1];
          if (lastRun) {
            lastRun.options = { ...lastRun.options, breakLine: true };
          }
        }
      }
    }
  };

  walk(root, { bold: false, italic: false, underline: false, code: false });
  return runs;
}

function applyBaseOptions(runs, base) {
  for (const run of runs) {
    run.options = {
      ...base,
      ...run.options,
      bold: run.options.bold || base.bold || false,
      italic: run.options.italic || base.italic || false,
    };
    if (!run.options.color && base.color) {
      run.options.color = base.color;
    }
    if (!run.options.fontSize && base.fontSize) {
      run.options.fontSize = base.fontSize;
    }
  }
}

function extractSpeakerNotesText(markdown) {
  if (!markdown) return "";
  const html = markdownToHtml(markdown);
  const dom = new JSDOM(`<div>${html}</div>`);
  return dom.window.document.body.textContent.trim();
}

function resolveAssetPath(src, baseDir) {
  if (isRemoteUrl(src)) return src;

  if (src.startsWith("/")) {
    const trimmed = src.replace(/^\/+/, "");
    const candidates = [
      resolvePath(process.cwd(), trimmed),
      resolvePath(baseDir, trimmed),
      resolvePath(baseDir, "..", trimmed),
    ];
    for (const candidate of candidates) {
      if (existsSync(candidate)) return candidate;
    }
    console.warn(`Warning: asset "${src}" not found in any candidate location`);
    return candidates[0];
  }

  return resolvePath(baseDir, src);
}

function isRemoteUrl(src) {
  return /^https?:\/\//i.test(src) || /^data:/i.test(src);
}

function normalizeHex(color) {
  if (!color || typeof color !== "string") return null;
  const trimmed = color.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("#")) {
    const hex = trimmed.slice(1);
    if (hex.length === 3) {
      return hex.split("").map((c) => c + c).join("").toUpperCase();
    }
    if (hex.length === 6 || hex.length === 8) {
      return hex.slice(0, 6).toUpperCase();
    }
  }
  // Accept bare hex
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toUpperCase();
  return null;
}
