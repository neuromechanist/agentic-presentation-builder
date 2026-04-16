import { createReadStream, readFileSync } from "node:fs";
import { stat } from "node:fs/promises";
import { resolve } from "node:path";
import { createServer } from "vite";
import { validatePresentation } from "../validator/index.js";
import {
  DEFAULT_ASSET_ROUTE,
  DEFAULT_PRESENTATION_ROUTE,
  buildPresentationUrl,
  getContentType,
  rewritePresentationAssetPaths,
} from "./present-cli.js";

export async function startLocalPresentationServer(options) {
  const {
    host = "127.0.0.1",
    open = false,
    port = 4173,
    presentationPath,
  } = options;

  const resolvedPresentationPath = resolve(presentationPath);
  const fileContent = readFileSync(resolvedPresentationPath, "utf-8");
  const presentationData = JSON.parse(fileContent);
  const validationResult = validatePresentation(presentationData);

  if (!validationResult.valid) {
    const error = new Error(
      `Presentation validation failed for ${resolvedPresentationPath}`,
    );
    error.validationResult = validationResult;
    error.presentationPath = resolvedPresentationPath;
    throw error;
  }

  const { assetFiles, presentationData: rewrittenPresentation } =
    rewritePresentationAssetPaths(presentationData, resolvedPresentationPath);
  const presentationJson = JSON.stringify(rewrittenPresentation, null, 2);

  const server = await createServer({
    plugins: [createLocalPresentationPlugin(presentationJson, assetFiles)],
    server: {
      host,
      open,
      port,
    },
  });

  await server.listen();

  const baseUrl = server.resolvedUrls?.local?.[0] || `http://${host}:${port}/`;
  const presentationUrl = buildPresentationUrl(
    baseUrl,
    DEFAULT_PRESENTATION_ROUTE,
  );

  return {
    assetFiles,
    presentationData,
    presentationPath: resolvedPresentationPath,
    presentationUrl,
    server,
    validationResult,
  };
}

export function createLocalPresentationPlugin(presentationJson, assetFiles) {
  return {
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || "/", "http://localhost");

        if (url.pathname === DEFAULT_PRESENTATION_ROUTE) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
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
          res.end("Asset not found");
          return;
        }

        try {
          const assetStat = await stat(assetPath);
          if (!assetStat.isFile()) {
            res.statusCode = 404;
            res.end("Asset not found");
            return;
          }

          res.statusCode = 200;
          res.setHeader("Content-Type", getContentType(assetPath));
          createReadStream(assetPath).pipe(res);
        } catch (error) {
          const status = error.code === "ENOENT" ? 404 : 500;
          res.statusCode = status;
          res.end(status === 404 ? "Asset not found" : `Asset error: ${error.message}`);
        }
      });
    },
    name: "local-presentation-cli",
  };
}

export function getAssetIdFromPath(pathname) {
  const parts = pathname.split("/");
  return parts[3] || "";
}
