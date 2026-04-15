import { existsSync } from "node:fs";
import { basename, dirname, extname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_PRESENTATION_ROUTE = "/__agentic__/presentation.json";
export const DEFAULT_ASSET_ROUTE = "/__agentic__/asset";

export function parsePresentCliArgs(argv) {
  const options = {
    host: "localhost",
    open: false,
    port: 3000,
    presentationPath: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      return { ...options, help: true };
    }

    if (arg === "--open") {
      options.open = true;
      continue;
    }

    if (arg === "--port") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("Missing value for --port");
      }
      options.port = parsePort(value);
      index += 1;
      continue;
    }

    if (arg.startsWith("--port=")) {
      options.port = parsePort(arg.slice("--port=".length));
      continue;
    }

    if (arg === "--host") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("Missing value for --host");
      }
      options.host = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--host=")) {
      options.host = arg.slice("--host=".length);
      continue;
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    if (options.presentationPath) {
      throw new Error("Only one presentation JSON path can be provided");
    }

    options.presentationPath = arg;
  }

  return {
    ...options,
    help: false,
  };
}

export function formatPresentCliUsage() {
  return [
    "Usage: npm run present -- <path-to-json> [--port 3000] [--host localhost] [--open]",
    "",
    "Examples:",
    "  npm run present -- examples/hello-world.json",
    "  npm run present -- ~/slides/q2-review.json --open",
    "  npm run present -- /Users/name/slides/demo.json --port 4173",
  ].join("\n");
}

export function rewritePresentationAssetPaths(presentationData, deckPath) {
  const deckDirectory = dirname(deckPath);
  const assetIdsByPath = new Map();
  const assetFiles = new Map();
  const clonedPresentation = structuredClone(presentationData);

  for (const slide of clonedPresentation.presentation?.slides || []) {
    slide.background = registerAsset(
      slide.background,
      deckDirectory,
      assetIdsByPath,
      assetFiles,
    );

    for (const element of slide.elements || []) {
      if (element.type === "image") {
        element.src = registerAsset(
          element.src,
          deckDirectory,
          assetIdsByPath,
          assetFiles,
        );
      }
    }
  }

  return {
    assetFiles,
    presentationData: clonedPresentation,
  };
}

export function buildPresentationUrl(
  baseUrl,
  presentationRoute = DEFAULT_PRESENTATION_ROUTE,
) {
  const url = new URL("/", ensureTrailingSlash(baseUrl));
  url.searchParams.set("presentation", presentationRoute);
  return url.toString();
}

function registerAsset(assetPath, deckDirectory, assetIdsByPath, assetFiles) {
  const resolvedPath = resolvePresentationAssetPath(assetPath, deckDirectory);

  if (!resolvedPath) {
    return assetPath;
  }

  let assetId = assetIdsByPath.get(resolvedPath);

  if (!assetId) {
    assetId = `asset-${assetIdsByPath.size + 1}`;
    assetIdsByPath.set(resolvedPath, assetId);
    assetFiles.set(assetId, resolvedPath);
  }

  const assetName = encodeURIComponent(basename(resolvedPath));
  return `${DEFAULT_ASSET_ROUTE}/${assetId}/${assetName}`;
}

export function resolvePresentationAssetPath(assetPath, deckDirectory) {
  if (typeof assetPath !== "string" || assetPath.length === 0) {
    return null;
  }

  if (assetPath.startsWith("#") || assetPath.startsWith("//")) {
    return null;
  }

  if (assetPath.startsWith("file://")) {
    const filePath = fileURLToPath(assetPath);
    return existsSync(filePath) ? resolve(filePath) : null;
  }

  if (hasRemoteProtocol(assetPath)) {
    return null;
  }

  if (isAbsolute(assetPath)) {
    return existsSync(assetPath) ? resolve(assetPath) : null;
  }

  return resolve(deckDirectory, assetPath);
}

function hasRemoteProtocol(value) {
  if (/^[a-zA-Z]:[\\/]/.test(value)) {
    return false;
  }

  const protocolMatch = value.match(/^([a-zA-Z][a-zA-Z\d+.-]*):/);
  if (!protocolMatch) {
    return false;
  }

  return protocolMatch[1] !== "file";
}

function parsePort(value) {
  const port = Number.parseInt(value, 10);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid port: ${value}`);
  }

  return port;
}

function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}

export function getContentType(filePath) {
  switch (extname(filePath).toLowerCase()) {
    case ".avif":
      return "image/avif";
    case ".gif":
      return "image/gif";
    case ".jpeg":
    case ".jpg":
      return "image/jpeg";
    case ".json":
      return "application/json; charset=utf-8";
    case ".png":
      return "image/png";
    case ".svg":
      return "image/svg+xml";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}
