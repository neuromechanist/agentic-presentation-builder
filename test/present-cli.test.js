import test from "node:test";
import assert from "node:assert/strict";
import { getAssetIdFromPath } from "../src/utils/local-presentation-server.js";
import { rewritePresentationAssetPaths } from "../src/utils/present-cli.js";

test("getAssetIdFromPath extracts the generated asset id from CLI asset routes", () => {
  assert.equal(
    getAssetIdFromPath("/__agentic__/asset/asset-1/claude-face.svg"),
    "asset-1",
  );
  assert.equal(
    getAssetIdFromPath("/__agentic__/asset/asset-12/sample-1.jpg"),
    "asset-12",
  );
});

test("rewritePresentationAssetPaths registers and rewrites the branding logo src", () => {
  const deckPath = "/decks/example/presentation.json";
  const { assetFiles, presentationData } = rewritePresentationAssetPaths(
    {
      presentation: {
        metadata: {
          title: "Branding",
          branding: { logo: { src: "../../shared/logos/sccn.svg" } },
        },
        slides: [{ id: "s1", layout: "single-column", elements: [] }],
      },
    },
    deckPath,
  );

  const rewritten = presentationData.presentation.metadata.branding.logo.src;
  assert.match(rewritten, /^\/__agentic__\/asset\/asset-1\/sccn\.svg$/);
  assert.equal(assetFiles.get("asset-1"), "/shared/logos/sccn.svg");
});
