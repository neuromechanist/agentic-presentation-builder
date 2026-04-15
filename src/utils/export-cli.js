import { basename, dirname, extname, join, resolve } from "node:path";

const SUPPORTED_EXPORT_FORMATS = new Set(["pdf", "pptx"]);

export function parseExportCliArgs(argv) {
  const options = {
    chromePath: null,
    format: null,
    help: false,
    host: "127.0.0.1",
    outputPath: null,
    port: 4173,
    presentationPath: null,
    waitMs: 400,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      return { ...options, help: true };
    }

    if (arg === "--format") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("Missing value for --format");
      }
      options.format = parseFormat(value);
      index += 1;
      continue;
    }

    if (arg.startsWith("--format=")) {
      options.format = parseFormat(arg.slice("--format=".length));
      continue;
    }

    if (arg === "--output") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("Missing value for --output");
      }
      options.outputPath = resolve(value);
      index += 1;
      continue;
    }

    if (arg.startsWith("--output=")) {
      options.outputPath = resolve(arg.slice("--output=".length));
      continue;
    }

    if (arg === "--chrome-path") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("Missing value for --chrome-path");
      }
      options.chromePath = resolve(value);
      index += 1;
      continue;
    }

    if (arg.startsWith("--chrome-path=")) {
      options.chromePath = resolve(arg.slice("--chrome-path=".length));
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

    if (arg === "--wait") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("Missing value for --wait");
      }
      options.waitMs = parseWaitMs(value);
      index += 1;
      continue;
    }

    if (arg.startsWith("--wait=")) {
      options.waitMs = parseWaitMs(arg.slice("--wait=".length));
      continue;
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    if (options.presentationPath) {
      throw new Error("Only one presentation JSON path can be provided");
    }

    options.presentationPath = resolve(arg);
  }

  if (!options.presentationPath) {
    return options;
  }

  const format =
    options.format || inferExportFormat(options.outputPath) || "pdf";
  return {
    ...options,
    format,
    outputPath:
      options.outputPath ||
      resolveDefaultOutputPath(options.presentationPath, format),
  };
}

export function formatExportCliUsage() {
  return [
    "Usage: npm run export -- <path-to-json> [--format pdf|pptx] [--output <path>]",
    "",
    "Examples:",
    "  npm run export -- examples/hello-world.json",
    "  npm run export -- examples/hello-world.json --format pptx",
    "  npm run export -- examples/hello-world.json --output dist/hello-world.pdf",
    "  npm run export -- examples/hello-world.json --format pdf --chrome-path /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome",
  ].join("\n");
}

export function inferExportFormat(outputPath) {
  if (!outputPath) {
    return null;
  }

  const extension = extname(outputPath).toLowerCase().replace(/^\./, "");
  return SUPPORTED_EXPORT_FORMATS.has(extension) ? extension : null;
}

export function resolveDefaultOutputPath(presentationPath, format) {
  const sourceDirectory = dirname(resolve(presentationPath));
  const sourceName = basename(presentationPath, extname(presentationPath));
  return join(sourceDirectory, `${sourceName}.${format}`);
}

function parseFormat(value) {
  const normalized = value.toLowerCase();

  if (!SUPPORTED_EXPORT_FORMATS.has(normalized)) {
    throw new Error(`Unsupported export format: ${value}`);
  }

  return normalized;
}

function parsePort(value) {
  const port = Number.parseInt(value, 10);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid port: ${value}`);
  }

  return port;
}

function parseWaitMs(value) {
  const waitMs = Number.parseInt(value, 10);

  if (!Number.isInteger(waitMs) || waitMs < 0) {
    throw new Error(`Invalid wait time: ${value}`);
  }

  return waitMs;
}
