#!/usr/bin/env node

import { createReadStream, readFileSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { validatePresentation } from '../src/validator/index.js';
import {
  DEFAULT_ASSET_ROUTE,
  DEFAULT_PRESENTATION_ROUTE,
  buildPresentationUrl,
  formatPresentCliUsage,
  getContentType,
  parsePresentCliArgs,
  rewritePresentationAssetPaths
} from '../src/utils/present-cli.js';

async function main() {
  let args;

  try {
    args = parsePresentCliArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    console.error('');
    console.error(formatPresentCliUsage());
    process.exit(1);
  }

  if (args.help) {
    console.log(formatPresentCliUsage());
    return;
  }

  if (!args.presentationPath) {
    console.error('Missing presentation JSON path.');
    console.error('');
    console.error(formatPresentCliUsage());
    process.exit(1);
  }

  const presentationPath = resolve(args.presentationPath);
  const fileContent = readFileSync(presentationPath, 'utf-8');
  const presentationData = JSON.parse(fileContent);
  const validationResult = validatePresentation(presentationData);

  if (!validationResult.valid) {
    console.error(`Presentation validation failed for ${presentationPath}\n`);
    printErrors(validationResult.errors);
    printWarnings(validationResult.warnings);
    process.exit(1);
  }

  const { assetFiles, presentationData: rewrittenPresentation } =
    rewritePresentationAssetPaths(presentationData, presentationPath);
  const presentationJson = JSON.stringify(rewrittenPresentation, null, 2);

  const server = await createServer({
    plugins: [createLocalPresentationPlugin(presentationJson, assetFiles)],
    server: {
      host: args.host,
      open: args.open,
      port: args.port
    }
  });

  await server.listen();

  const baseUrl = server.resolvedUrls?.local?.[0] || `http://${args.host}:${args.port}/`;
  const presentationUrl = buildPresentationUrl(baseUrl, DEFAULT_PRESENTATION_ROUTE);

  console.log(`Serving presentation: ${presentationPath}`);
  console.log(`Presentation URL: ${presentationUrl}`);

  if (validationResult.warnings.length > 0) {
    console.log('');
    printWarnings(validationResult.warnings);
  }

  console.log('\nPress Ctrl+C to stop the server.');

  const shutdown = async () => {
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

function createLocalPresentationPlugin(presentationJson, assetFiles) {
  return {
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || '/', 'http://localhost');

        if (url.pathname === DEFAULT_PRESENTATION_ROUTE) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(presentationJson);
          return;
        }

        if (!url.pathname.startsWith(`${DEFAULT_ASSET_ROUTE}/`)) {
          next();
          return;
        }

        const assetId = getAssetIdFromPath(url.pathname);
        const assetPath = assetFiles.get(assetId);

        if (!assetPath) {
          res.statusCode = 404;
          res.end('Asset not found');
          return;
        }

        try {
          const assetStat = await stat(assetPath);
          if (!assetStat.isFile()) {
            res.statusCode = 404;
            res.end('Asset not found');
            return;
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', getContentType(assetPath));
          createReadStream(assetPath).pipe(res);
        } catch {
          res.statusCode = 404;
          res.end('Asset not found');
        }
      });
    },
    name: 'local-presentation-cli'
  };
}

export function getAssetIdFromPath(pathname) {
  const parts = pathname.split('/');
  return parts[3] || '';
}

function printErrors(errors) {
  errors.forEach((error, index) => {
    const path = error.path || 'root';

    console.error(`${index + 1}. Path: ${path}`);
    console.error(`   Code: ${error.code}`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Suggestion: ${error.suggestion}\n`);
  });
}

function printWarnings(warnings) {
  console.log(`Warnings (${warnings.length}):\n`);

  warnings.forEach((warning, index) => {
    console.log(`${index + 1}. Slide: ${warning.slideTitle}`);
    console.log(`   Path: ${warning.path}`);
    console.log(`   Code: ${warning.code}`);
    console.log(`   Warning: ${warning.message}`);
    console.log(`   Suggestion: ${warning.suggestion}\n`);
  });
}

const isEntrypoint = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isEntrypoint) {
  main().catch(error => {
    console.error(error.message);
    process.exit(1);
  });
}
